import "server-only";

import { requerirAdmin } from "@/lib/auth/sesion";
import { filtroBusqueda, soloCaracteresIgnorados } from "@/lib/busqueda";
import {
  contarSinResponder,
  enBandeja,
  filtrarConversaciones,
  prefijoAutor,
  sinResponderEnCanal,
  type CarpetaCorreo,
  type FiltroBandeja,
} from "@/lib/crm/bandeja";
import {
  VALORES_TIPO_TAREA,
  type CanalCrm,
  type CorreoAutomatico,
  type DireccionMensaje,
  type EstadoTarea,
  type Prioridad,
  type TareaAutomatica,
  type TipoTarea,
} from "@/lib/crm/catalogos";
import {
  leerAjustesCorreo,
  leerAjustesIa,
  type AjustesCorreo,
  type AjustesIa,
} from "@/lib/crm/ajustes";
import { claveDesdeEntorno, descifrar, hayClaveCifrado } from "@/lib/crm/cifrado";
import { leerAnalisisGuardado, type ConfiguracionIA } from "@/lib/crm/ia";
import { codigoCaso, diasEntre } from "@/lib/crm/linea-tiempo";
import { resumirTexto } from "@/lib/crm/plantillas";
import { formatearTelefono } from "@/lib/crm/telefono";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/types/database";

/**
 * Capa de datos del CRM. Cada función exige sesión de admin; la base aplica RLS además.
 * Devuelve objetos mínimos y ya mapeados para las vistas.
 */

// ---------------------------------------------------------------------------
// Equipo
// ---------------------------------------------------------------------------

export type MiembroEquipo = { id: string; nombre: string; email: string; avatarUrl: string | null };

function nombreDePerfil(perfil: { nombre_completo: string | null; email: string }): string {
  return perfil.nombre_completo?.trim() || perfil.email.split("@")[0] || perfil.email;
}

export async function obtenerEquipo(): Promise<MiembroEquipo[]> {
  await requerirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, email, avatar_url")
    .eq("rol", "admin")
    .order("nombre_completo");
  if (error) throw error;
  return data.map((p) => ({
    id: p.id,
    nombre: nombreDePerfil(p),
    email: p.email,
    avatarUrl: p.avatar_url,
  }));
}

// ---------------------------------------------------------------------------
// Etapas
// ---------------------------------------------------------------------------

export type Etapa = {
  id: string;
  nombre: string;
  orden: number;
  color: string;
  descripcion: string | null;
  cierre: Tables<"crm_etapas">["cierre"];
  tareasAutomaticas: TareaAutomatica[];
  correoAutomatico: CorreoAutomatico | null;
};

function leerTareasAutomaticas(json: Json): TareaAutomatica[] {
  if (!Array.isArray(json)) return [];
  const tareas: TareaAutomatica[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const tipo = (VALORES_TIPO_TAREA as readonly string[]).includes(String(item.tipo))
      ? (item.tipo as TipoTarea)
      : "otra";
    const titulo = typeof item.titulo === "string" ? item.titulo : "";
    if (!titulo) continue;
    const dias = Number(item.dias_plazo);
    tareas.push({
      tipo,
      titulo,
      descripcion: typeof item.descripcion === "string" ? item.descripcion : null,
      dias_plazo: Number.isFinite(dias) && dias >= 0 ? Math.floor(dias) : 0,
    });
  }
  return tareas;
}

function leerCorreoAutomatico(json: Json | null): CorreoAutomatico | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const asunto = typeof json.asunto === "string" ? json.asunto : "";
  const cuerpo = typeof json.cuerpo === "string" ? json.cuerpo : "";
  return asunto ? { asunto, cuerpo } : null;
}

export function mapearEtapa(fila: Tables<"crm_etapas">): Etapa {
  return {
    id: fila.id,
    nombre: fila.nombre,
    orden: fila.orden,
    color: fila.color,
    descripcion: fila.descripcion,
    cierre: fila.cierre,
    tareasAutomaticas: leerTareasAutomaticas(fila.tareas_automaticas),
    correoAutomatico: leerCorreoAutomatico(fila.correo_automatico),
  };
}

export async function obtenerEtapas(): Promise<Etapa[]> {
  await requerirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_etapas")
    .select("*")
    .order("orden")
    .order("created_at");
  if (error) throw error;
  return data.map(mapearEtapa);
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export type FiltrosPipeline = {
  busqueda?: string;
  /** Id del responsable o "nadie" para casos sin asignar. */
  responsable?: string;
  canal?: CanalCrm;
};

export type CasoResumen = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  etapaId: string;
  responsable: { id: string; nombre: string } | null;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  ultimoMensajeAt: string | null;
  sinResponder: boolean;
  origen: CanalCrm | null;
  prioridad: Prioridad | null;
  clienteId: string | null;
  tareasPendientes: number;
  tareasVencidas: number;
};

function hoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export async function listarCasosPipeline(filtros: FiltrosPipeline = {}) {
  await requerirAdmin();
  const supabase = await createClient();

  let consulta = supabase
    .from("crm_casos")
    .select(
      `id, nombre, telefono, email, etapa_id, proxima_accion, proxima_accion_fecha, ultimo_mensaje_at,
       ultimo_mensaje_direccion, origen, analisis, cliente_id,
       responsable:perfiles!crm_casos_responsable_id_fkey(id, nombre_completo, email)`,
    )
    .order("ultimo_mensaje_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (filtros.responsable === "nadie") consulta = consulta.is("responsable_id", null);
  else if (filtros.responsable) consulta = consulta.eq("responsable_id", filtros.responsable);
  if (filtros.canal) consulta = consulta.eq("origen", filtros.canal);

  const filtro = filtroBusqueda(["nombre", "email", "telefono"], filtros.busqueda ?? "");
  if (filtro) consulta = consulta.or(filtro);

  const [etapas, casos, tareas] = await Promise.all([
    obtenerEtapas(),
    consulta,
    supabase.from("crm_tareas").select("caso_id, vence_at").eq("estado", "pendiente"),
  ]);
  if (casos.error) throw casos.error;
  if (tareas.error) throw tareas.error;

  const hoy = hoyBogota();
  const pendientes = new Map<string, { total: number; vencidas: number }>();
  for (const tarea of tareas.data) {
    const actual = pendientes.get(tarea.caso_id) ?? { total: 0, vencidas: 0 };
    actual.total += 1;
    if (tarea.vence_at && tarea.vence_at < hoy) actual.vencidas += 1;
    pendientes.set(tarea.caso_id, actual);
  }

  const resumen: CasoResumen[] = casos.data.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
    etapaId: c.etapa_id,
    responsable: c.responsable
      ? { id: c.responsable.id, nombre: nombreDePerfil(c.responsable) }
      : null,
    proximaAccion: c.proxima_accion,
    proximaAccionFecha: c.proxima_accion_fecha,
    ultimoMensajeAt: c.ultimo_mensaje_at,
    sinResponder: c.ultimo_mensaje_direccion === "entrada",
    origen: c.origen,
    prioridad: leerAnalisisGuardado(c.analisis)?.prioridad ?? null,
    clienteId: c.cliente_id,
    tareasPendientes: pendientes.get(c.id)?.total ?? 0,
    tareasVencidas: pendientes.get(c.id)?.vencidas ?? 0,
  }));

  return { etapas, casos: resumen };
}

// ---------------------------------------------------------------------------
// Caso
// ---------------------------------------------------------------------------

export async function obtenerCaso(id: string) {
  await requerirAdmin();
  const supabase = await createClient();

  const { data: caso, error } = await supabase
    .from("crm_casos")
    .select(
      `*,
       etapa:crm_etapas(*),
       responsable:perfiles!crm_casos_responsable_id_fkey(id, nombre_completo, email, avatar_url),
       cliente:clientes(id, nombre_completo, email, propuestas(id, estado))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!caso) return null;

  const [mensajes, tareas, eventos, ultimoCambioEtapa] = await Promise.all([
    // Los 500 más recientes (se devuelven en orden cronológico).
    supabase
      .from("crm_mensajes")
      .select(
        "id, canal, direccion, asunto, contenido, estado_envio, error, enviado_at, created_at, autor_id, autor:perfiles(nombre_completo, email)",
      )
      .eq("caso_id", id)
      .order("id", { ascending: false })
      .limit(500),
    supabase
      .from("crm_tareas")
      .select(
        "id, tipo, titulo, descripcion, vence_at, estado, completada_at, created_at, responsable:perfiles!crm_tareas_responsable_id_fkey(id, nombre_completo, email)",
      )
      .eq("caso_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("crm_eventos")
      .select("id, tipo, descripcion, created_at, autor:perfiles(nombre_completo, email)")
      .eq("caso_id", id)
      .order("id", { ascending: false })
      .limit(200),
    // Desde cuándo está en la etapa actual: el último cambio de etapa (o la creación del caso).
    supabase
      .from("crm_eventos")
      .select("created_at")
      .eq("caso_id", id)
      .eq("tipo", "etapa")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (mensajes.error) throw mensajes.error;
  if (tareas.error) throw tareas.error;
  if (eventos.error) throw eventos.error;
  if (ultimoCambioEtapa.error) throw ultimoCambioEtapa.error;

  const etapaDesde = ultimoCambioEtapa.data?.created_at ?? caso.created_at;

  return {
    id: caso.id,
    codigo: codigoCaso(caso.id),
    nombre: caso.nombre,
    telefono: caso.telefono,
    email: caso.email,
    etapa: mapearEtapa(caso.etapa),
    etapaDesde,
    diasEnEtapa: diasEntre(etapaDesde, new Date()),
    responsable: caso.responsable
      ? {
          id: caso.responsable.id,
          nombre: nombreDePerfil(caso.responsable),
          email: caso.responsable.email,
          avatarUrl: caso.responsable.avatar_url,
        }
      : null,
    cliente: caso.cliente
      ? {
          id: caso.cliente.id,
          nombre: caso.cliente.nombre_completo,
          email: caso.cliente.email,
          estadoPropuesta: caso.cliente.propuestas?.estado ?? null,
        }
      : null,
    proximaAccion: caso.proxima_accion,
    proximaAccionFecha: caso.proxima_accion_fecha,
    origen: caso.origen,
    ultimoMensajeAt: caso.ultimo_mensaje_at,
    sinResponder: caso.ultimo_mensaje_direccion === "entrada",
    analisis: leerAnalisisGuardado(caso.analisis),
    createdAt: caso.created_at,
    updatedAt: caso.updated_at,
    mensajes: mensajes.data.toReversed().map((m) => ({
      id: m.id,
      canal: m.canal,
      direccion: m.direccion,
      asunto: m.asunto,
      contenido: m.contenido,
      estadoEnvio: m.estado_envio,
      error: m.error,
      enviadoAt: m.enviado_at,
      createdAt: m.created_at,
      // Momento del feed: lo entrante, cuando lo escribió el contacto; lo saliente, cuando el
      // equipo lo escribió (aunque el worker lo envíe segundos después).
      fecha: m.direccion === "entrada" ? (m.enviado_at ?? m.created_at) : m.created_at,
      autorId: m.autor_id,
      autor: m.autor ? nombreDePerfil(m.autor) : null,
    })),
    tareas: tareas.data.map((t) => ({
      id: t.id,
      tipo: t.tipo,
      titulo: t.titulo,
      descripcion: t.descripcion,
      venceAt: t.vence_at,
      estado: t.estado,
      completadaAt: t.completada_at,
      createdAt: t.created_at,
      responsable: t.responsable
        ? { id: t.responsable.id, nombre: nombreDePerfil(t.responsable) }
        : null,
    })),
    eventos: eventos.data.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      descripcion: e.descripcion,
      createdAt: e.created_at,
      fecha: e.created_at,
      autor: e.autor ? nombreDePerfil(e.autor) : null,
    })),
  };
}

export type CasoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerCaso>>>;
export type MensajeCaso = CasoDetalle["mensajes"][number];
export type TareaCaso = CasoDetalle["tareas"][number];
export type EventoCaso = CasoDetalle["eventos"][number];

// ---------------------------------------------------------------------------
// Inbox de chat (WhatsApp) e inbox de correo
// ---------------------------------------------------------------------------

/**
 * Conversaciones que se revisan en cada inbox y para sus contadores: las de los casos con
 * actividad más reciente. Cada caso trae solo su último mensaje de cada canal (una fila embebida
 * con límite 1, que usa el índice `crm_mensajes (caso_id, id)`), así la consulta queda acotada.
 */
const LIMITE_BANDEJA = 500;

export type OpcionesBandeja = {
  busqueda?: string;
  filtro?: FiltroBandeja;
  /** Solo en el inbox de correo. */
  carpeta?: CarpetaCorreo;
};

export type ConversacionResumen = {
  casoId: string;
  codigo: string;
  nombre: string;
  /** Teléfono (chat) o correo (inbox de correo) del contacto. */
  contacto: string;
  etapa: { nombre: string; color: string };
  responsableId: string | null;
  responsable: string | null;
  ultimoMensaje: {
    contenido: string;
    asunto: string | null;
    direccion: DireccionMensaje;
    fecha: string;
    /** «Tú», el nombre del agente o null si lo escribió el contacto. */
    prefijo: string | null;
  } | null;
  ultimaDireccion: DireccionMensaje | null;
  sinResponder: boolean;
};

export async function listarConversaciones(canal: CanalCrm, opciones: OpcionesBandeja = {}) {
  const usuario = await requerirAdmin();
  const busqueda = opciones.busqueda ?? "";
  if (soloCaracteresIgnorados(busqueda)) return [];
  const supabase = await createClient();

  let consulta = supabase
    .from("crm_casos")
    .select(
      `id, nombre, telefono, email, origen, created_at,
       etapa:crm_etapas(nombre, color),
       responsable:perfiles!crm_casos_responsable_id_fkey(id, nombre_completo, email),
       ultimo:crm_mensajes(contenido, asunto, direccion, created_at, enviado_at, autor_id,
         autor:perfiles(nombre_completo, email))`,
    )
    .eq("ultimo.canal", canal)
    .order("id", { referencedTable: "ultimo", ascending: false })
    .limit(1, { referencedTable: "ultimo" })
    .order("ultimo_mensaje_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(LIMITE_BANDEJA);

  const filtro = filtroBusqueda(["nombre", "email", "telefono"], busqueda);
  if (filtro) consulta = consulta.or(filtro);

  const { data, error } = await consulta;
  if (error) throw error;

  const conversaciones: (ConversacionResumen & { orden: string })[] = [];
  for (const c of data) {
    const ultimo = c.ultimo[0] ?? null;
    if (!enBandeja(canal, { origen: c.origen, ultimoDelCanal: ultimo })) continue;
    const fecha = ultimo
      ? ultimo.direccion === "entrada"
        ? (ultimo.enviado_at ?? ultimo.created_at)
        : ultimo.created_at
      : null;
    conversaciones.push({
      casoId: c.id,
      codigo: codigoCaso(c.id),
      nombre: c.nombre,
      contacto: canal === "whatsapp" ? formatearTelefono(c.telefono) : (c.email ?? ""),
      etapa: { nombre: c.etapa.nombre, color: c.etapa.color },
      responsableId: c.responsable?.id ?? null,
      responsable: c.responsable ? nombreDePerfil(c.responsable) : null,
      ultimoMensaje:
        ultimo && fecha
          ? {
              contenido: resumirTexto(ultimo.contenido, 140),
              asunto: ultimo.asunto,
              direccion: ultimo.direccion,
              fecha,
              prefijo: prefijoAutor(
                {
                  direccion: ultimo.direccion,
                  autorId: ultimo.autor_id,
                  autor: ultimo.autor ? nombreDePerfil(ultimo.autor) : null,
                },
                usuario.id,
              ),
            }
          : null,
      ultimaDireccion: ultimo?.direccion ?? null,
      sinResponder: sinResponderEnCanal(ultimo),
      // Primero las que tienen mensajes del canal, por la fecha del último; luego las nuevas.
      orden: fecha ?? `0${c.created_at}`,
    });
  }
  conversaciones.sort((a, b) => b.orden.localeCompare(a.orden));

  return filtrarConversaciones(conversaciones, {
    filtro: opciones.filtro ?? "todos",
    usuarioId: usuario.id,
    carpeta: canal === "correo" ? (opciones.carpeta ?? "recibidos") : null,
  }).map(({ orden: _orden, ...conversacion }) => conversacion);
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export type FiltrosTareas = { estado?: EstadoTarea; responsable?: string };

export async function listarTareas(filtros: FiltrosTareas = {}) {
  await requerirAdmin();
  const supabase = await createClient();

  let consulta = supabase
    .from("crm_tareas")
    .select(
      `id, tipo, titulo, descripcion, vence_at, estado, completada_at, created_at,
       caso:crm_casos(id, nombre),
       responsable:perfiles!crm_tareas_responsable_id_fkey(id, nombre_completo, email)`,
    )
    .order("vence_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);
  if (filtros.estado) consulta = consulta.eq("estado", filtros.estado);
  if (filtros.responsable === "nadie") consulta = consulta.is("responsable_id", null);
  else if (filtros.responsable) consulta = consulta.eq("responsable_id", filtros.responsable);

  const { data, error } = await consulta;
  if (error) throw error;

  const hoy = hoyBogota();
  return data.map((t) => ({
    id: t.id,
    tipo: t.tipo,
    titulo: t.titulo,
    descripcion: t.descripcion,
    venceAt: t.vence_at,
    vencida: t.estado === "pendiente" && t.vence_at !== null && t.vence_at < hoy,
    estado: t.estado,
    completadaAt: t.completada_at,
    createdAt: t.created_at,
    caso: { id: t.caso.id, nombre: t.caso.nombre },
    responsable: t.responsable
      ? { id: t.responsable.id, nombre: nombreDePerfil(t.responsable) }
      : null,
  }));
}

export type TareaLista = Awaited<ReturnType<typeof listarTareas>>[number];

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

export async function obtenerNotificaciones(limite = 15) {
  const usuario = await requerirAdmin();
  const supabase = await createClient();
  const [lista, noLeidas] = await Promise.all([
    supabase
      .from("crm_notificaciones")
      .select("id, titulo, cuerpo, enlace, leida_at, created_at")
      .eq("perfil_id", usuario.id)
      .order("id", { ascending: false })
      .limit(limite),
    supabase
      .from("crm_notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("perfil_id", usuario.id)
      .is("leida_at", null),
  ]);
  if (lista.error) throw lista.error;
  if (noLeidas.error) throw noLeidas.error;
  return {
    notificaciones: lista.data.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      cuerpo: n.cuerpo,
      enlace: n.enlace,
      leida: n.leida_at !== null,
      createdAt: n.created_at,
    })),
    noLeidas: noLeidas.count ?? 0,
  };
}

export type Notificacion = Awaited<
  ReturnType<typeof obtenerNotificaciones>
>["notificaciones"][number];

// ---------------------------------------------------------------------------
// Ajustes (IA, correo, WhatsApp)
// ---------------------------------------------------------------------------

export type { AjustesCorreo, AjustesIa };

export type CuentaWhatsApp = {
  id: string;
  nombre: string;
  estado: Tables<"wa_cuentas">["estado"];
  telefono: string | null;
  qr: string | null;
  ultimoError: string | null;
  conectadoAt: string | null;
  vistoAt: string | null;
  workerActivo: boolean;
  actualizadoAt: string;
};

const LATIDO_MAXIMO_MS = 90_000;

export function mapearCuentaWhatsApp(fila: Tables<"wa_cuentas">): CuentaWhatsApp {
  const visto = fila.visto_at ? Date.parse(fila.visto_at) : 0;
  return {
    id: fila.id,
    nombre: fila.nombre,
    estado: fila.estado,
    telefono: fila.telefono,
    qr: fila.qr,
    ultimoError: fila.ultimo_error,
    conectadoAt: fila.conectado_at,
    vistoAt: fila.visto_at,
    workerActivo: Date.now() - visto < LATIDO_MAXIMO_MS,
    actualizadoAt: fila.updated_at,
  };
}

export async function obtenerCuentaWhatsApp(): Promise<CuentaWhatsApp | null> {
  await requerirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wa_cuentas")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapearCuentaWhatsApp(data) : null;
}

export async function obtenerAjustes() {
  await requerirAdmin();
  const supabase = await createClient();
  const [ajustes, cuenta] = await Promise.all([
    supabase.from("crm_ajustes").select("*"),
    obtenerCuentaWhatsApp(),
  ]);
  if (ajustes.error) throw ajustes.error;
  const porClave = new Map(ajustes.data.map((fila) => [fila.clave, fila]));
  return {
    ia: leerAjustesIa(porClave.get("ia")),
    correo: leerAjustesCorreo(porClave.get("correo")),
    whatsapp: cuenta,
    hayClaveCifrado: hayClaveCifrado(),
  };
}

export type ConfiguracionIaResuelta =
  | { ok: true; config: ConfiguracionIA; aplicarEtapaSugerida: boolean }
  | { ok: false; mensaje: string };

/** Configuración de IA lista para usar (clave descifrada). Solo en el servidor. */
export async function obtenerConfiguracionIA(): Promise<ConfiguracionIaResuelta> {
  await requerirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_ajustes")
    .select("*")
    .eq("clave", "ia")
    .maybeSingle();
  if (error) throw error;
  const ajustes = leerAjustesIa(data ?? undefined);
  if (!ajustes.activo) {
    return { ok: false, mensaje: "La IA está desactivada. Actívala en Configuración → IA." };
  }
  if (!data?.secreto) {
    return { ok: false, mensaje: "Falta la clave de API. Guárdala en Configuración → IA." };
  }
  const clave = claveDesdeEntorno();
  if (!clave) {
    return {
      ok: false,
      mensaje: "Falta CRM_CLAVE_CIFRADO en el servidor; no se puede leer la clave de API.",
    };
  }
  try {
    return {
      ok: true,
      config: {
        proveedor: ajustes.proveedor,
        modelo: ajustes.modelo,
        apiKey: descifrar(data.secreto, clave),
      },
      aplicarEtapaSugerida: ajustes.aplicarEtapaSugerida,
    };
  } catch {
    return {
      ok: false,
      mensaje:
        "No se pudo descifrar la clave de API (¿cambió CRM_CLAVE_CIFRADO?). Guárdala de nuevo.",
    };
  }
}

/** Contraseña del correo descifrada, para probar la conexión desde el panel. */
export async function obtenerCredencialesCorreo() {
  await requerirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_ajustes")
    .select("*")
    .eq("clave", "correo")
    .maybeSingle();
  if (error) throw error;
  const ajustes = leerAjustesCorreo(data ?? undefined);
  const clave = claveDesdeEntorno();
  if (!data?.secreto || !clave) return { ajustes, contrasena: null };
  try {
    return { ajustes, contrasena: descifrar(data.secreto, clave) };
  } catch {
    return { ajustes, contrasena: null };
  }
}

// ---------------------------------------------------------------------------
// Búsquedas auxiliares
// ---------------------------------------------------------------------------

export async function buscarClientesParaVincular(termino: string) {
  await requerirAdmin();
  const supabase = await createClient();
  const filtro = filtroBusqueda(["nombre_completo", "email", "telefono"], termino);
  let consulta = supabase
    .from("clientes")
    .select("id, nombre_completo, email")
    .order("created_at", { ascending: false })
    .limit(8);
  if (filtro) consulta = consulta.or(filtro);
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

/** Indicadores del CRM para el resumen del panel. */
export async function obtenerResumenCrm() {
  await requerirAdmin();
  const supabase = await createClient();
  const [abiertos, sinResponder, tareasVencidas, porCanal] = await Promise.all([
    supabase
      .from("crm_casos")
      .select("id, etapa:crm_etapas!inner(cierre)", { count: "exact", head: true })
      .is("etapa.cierre", null),
    supabase
      .from("crm_casos")
      .select("id", { count: "exact", head: true })
      .eq("ultimo_mensaje_direccion", "entrada"),
    supabase
      .from("crm_tareas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente")
      .lt("vence_at", hoyBogota()),
    // Por inbox: el último mensaje de cada canal de las conversaciones recientes (las mismas que
    // listan los inbox). Sin responder = ese último mensaje es de entrada.
    supabase
      .from("crm_casos")
      .select("whatsapp:crm_mensajes(direccion), correo:crm_mensajes(direccion)")
      .eq("whatsapp.canal", "whatsapp")
      .order("id", { referencedTable: "whatsapp", ascending: false })
      .limit(1, { referencedTable: "whatsapp" })
      .eq("correo.canal", "correo")
      .order("id", { referencedTable: "correo", ascending: false })
      .limit(1, { referencedTable: "correo" })
      .not("ultimo_mensaje_at", "is", null)
      .order("ultimo_mensaje_at", { ascending: false })
      .limit(LIMITE_BANDEJA),
  ]);
  if (abiertos.error) throw abiertos.error;
  if (sinResponder.error) throw sinResponder.error;
  if (tareasVencidas.error) throw tareasVencidas.error;
  if (porCanal.error) throw porCanal.error;
  const pendientes = contarSinResponder(
    porCanal.data.map((c) => ({ whatsapp: c.whatsapp[0] ?? null, correo: c.correo[0] ?? null })),
  );
  return {
    casosAbiertos: abiertos.count ?? 0,
    sinResponder: sinResponder.count ?? 0,
    tareasVencidas: tareasVencidas.count ?? 0,
    sinResponderChat: pendientes.chat,
    sinResponderCorreo: pendientes.correo,
  };
}
