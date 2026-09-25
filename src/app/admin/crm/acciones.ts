"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { erroresDeValidacion, valoresTexto, type EstadoAccion } from "@/lib/acciones";
import { requerirAdmin } from "@/lib/auth/sesion";
import type { EstadoTarea } from "@/lib/crm/catalogos";
import { analizarCasoConIA, type AnalisisIA } from "@/lib/crm/ia";
import { formatearTelefono } from "@/lib/crm/telefono";
import {
  buscarClientesParaVincular,
  obtenerCaso,
  obtenerConfiguracionIA,
  obtenerEtapas,
  obtenerEquipo,
} from "@/lib/datos/crm";
import { createClient } from "@/lib/supabase/server";
import {
  CAMPOS_CASO,
  CAMPOS_TAREA,
  asignarResponsableSchema,
  casoSchema,
  crearExpedienteSchema,
  estadoTareaSchema,
  mensajeSchema,
  moverEtapaSchema,
  notaCasoSchema,
  proximaAccionSchema,
  tareaSchema,
  vincularClienteSchema,
} from "@/lib/validaciones/crm";
import type { Database, Json } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type TipoEvento = Database["public"]["Enums"]["crm_tipo_evento"];

function rutaCaso(casoId: string) {
  return `/admin/crm/casos/${casoId}` as Route;
}

function revalidarCrm(casoId?: string) {
  revalidatePath("/admin/crm", "layout");
  revalidatePath("/admin", "page");
  if (casoId) revalidatePath(rutaCaso(casoId), "page");
}

async function registrarEvento(
  supabase: Supabase,
  casoId: string,
  tipo: TipoEvento,
  descripcion: string,
  autorId: string,
  datos?: Json,
) {
  const { error } = await supabase
    .from("crm_eventos")
    .insert({ caso_id: casoId, tipo, descripcion, autor_id: autorId, datos: datos ?? null });
  if (error) console.error("Error al registrar evento del CRM:", error.message);
}

function mensajeDuplicado(error: { code?: string; message: string }): string | null {
  if (error.code !== "23505") return null;
  if (error.message.includes("crm_casos_telefono_key")) {
    return "Ya existe un caso con ese teléfono.";
  }
  if (error.message.includes("crm_casos_email_key")) return "Ya existe un caso con ese correo.";
  return "Ya existe un caso con esos datos.";
}

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

export async function crearCaso(_estado: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, CAMPOS_CASO);
  const datos = casoSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);
  if (!datos.data.telefono && !datos.data.email) {
    return {
      ok: false,
      mensaje: "Escribe al menos un teléfono o un correo para poder contactar a la persona.",
      valores,
    };
  }

  let etapaId = datos.data.etapa_id;
  if (!etapaId) {
    const etapas = await obtenerEtapas();
    etapaId = etapas[0]?.id ?? null;
  }
  if (!etapaId) {
    return {
      ok: false,
      mensaje: "Primero crea las etapas del pipeline en Configuración.",
      valores,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_casos")
    .insert({
      nombre: datos.data.nombre,
      telefono: datos.data.telefono,
      email: datos.data.email,
      etapa_id: etapaId,
      responsable_id: datos.data.responsable_id,
      proxima_accion: datos.data.proxima_accion,
      proxima_accion_fecha: datos.data.proxima_accion_fecha,
      creado_por: admin.id,
    })
    .select("id")
    .single();

  if (error) {
    const duplicado = mensajeDuplicado(error);
    if (duplicado) return { ok: false, mensaje: duplicado, valores };
    console.error("Error al crear el caso:", error.message);
    return { ok: false, mensaje: "No pudimos crear el caso. Inténtalo de nuevo.", valores };
  }

  await registrarEvento(supabase, data.id, "creacion", "Caso creado por el equipo", admin.id);
  revalidarCrm();
  redirect(rutaCaso(data.id));
}

export async function actualizarDatosCaso(
  casoId: string,
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  if (!z.uuid().safeParse(casoId).success) return { ok: false, mensaje: "Caso no válido." };
  const valores = valoresTexto(formData, ["nombre", "telefono", "email"]);
  const datos = casoSchema.pick({ nombre: true, telefono: true, email: true }).safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_casos")
    .update({
      nombre: datos.data.nombre,
      telefono: datos.data.telefono,
      email: datos.data.email,
    })
    .eq("id", casoId);
  if (error) {
    const duplicado = mensajeDuplicado(error);
    if (duplicado) return { ok: false, mensaje: duplicado, valores };
    console.error("Error al actualizar el caso:", error.message);
    return { ok: false, mensaje: "No pudimos guardar los datos.", valores };
  }
  await registrarEvento(supabase, casoId, "datos", "Datos de contacto actualizados", admin.id);
  revalidarCrm(casoId);
  return { ok: true, mensaje: "Datos guardados.", valores };
}

export async function eliminarCaso(casoId: string): Promise<EstadoAccion> {
  await requerirAdmin();
  if (!z.uuid().safeParse(casoId).success) return { ok: false, mensaje: "Caso no válido." };
  const supabase = await createClient();
  const { error } = await supabase.from("crm_casos").delete().eq("id", casoId);
  if (error) {
    console.error("Error al eliminar el caso:", error.message);
    return { ok: false, mensaje: "No pudimos eliminar el caso." };
  }
  revalidarCrm();
  redirect("/admin/crm");
}

/** Mueve un caso de etapa (tablero y ficha). La base crea las tareas y el correo automáticos. */
export async function moverEtapaCaso(
  casoId: string,
  etapaId: string,
  motivo?: string | null,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const datos = moverEtapaSchema.safeParse({ caso_id: casoId, etapa_id: etapaId, motivo });
  if (!datos.success) return { ok: false, mensaje: "Etapa o caso no válidos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("crm_mover_etapa", {
    p_caso_id: datos.data.caso_id,
    p_etapa_id: datos.data.etapa_id,
    p_autor: admin.id,
    p_motivo: datos.data.motivo,
  });
  if (error) {
    console.error("Error al mover de etapa:", error.message);
    return { ok: false, mensaje: "No pudimos mover el caso de etapa." };
  }
  revalidarCrm(casoId);
  return { ok: true, mensaje: "Caso movido de etapa." };
}

export async function moverEtapa(_estado: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const valores = valoresTexto(formData, ["caso_id", "etapa_id", "motivo"]);
  return moverEtapaCaso(valores.caso_id ?? "", valores.etapa_id ?? "", valores.motivo);
}

export async function asignarResponsableCaso(
  casoId: string,
  responsableId: string | null,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const datos = asignarResponsableSchema.safeParse({
    caso_id: casoId,
    responsable_id: responsableId ?? "",
  });
  if (!datos.success) return { ok: false, mensaje: "Responsable no válido." };

  const supabase = await createClient();
  const [equipo, caso] = await Promise.all([obtenerEquipo(), obtenerCaso(casoId)]);
  if (!caso) return { ok: false, mensaje: "Caso no encontrado." };
  const nuevo = datos.data.responsable_id
    ? equipo.find((m) => m.id === datos.data.responsable_id)
    : null;
  if (datos.data.responsable_id && !nuevo) {
    return { ok: false, mensaje: "Esa persona no pertenece al equipo." };
  }

  const { error } = await supabase
    .from("crm_casos")
    .update({ responsable_id: nuevo?.id ?? null })
    .eq("id", casoId);
  if (error) {
    console.error("Error al asignar responsable:", error.message);
    return { ok: false, mensaje: "No pudimos asignar el responsable." };
  }

  await registrarEvento(
    supabase,
    casoId,
    "responsable",
    nuevo ? `Asignado a ${nuevo.nombre}` : "Quedó sin responsable",
    admin.id,
  );
  if (nuevo && nuevo.id !== admin.id) {
    await supabase.from("crm_notificaciones").insert({
      perfil_id: nuevo.id,
      titulo: `Te asignaron el caso de ${caso.nombre}`,
      cuerpo: caso.proximaAccion ? `Próxima acción: ${caso.proximaAccion}` : null,
      enlace: rutaCaso(casoId),
      caso_id: casoId,
    });
  }
  revalidarCrm(casoId);
  return { ok: true, mensaje: nuevo ? `Asignado a ${nuevo.nombre}.` : "Caso sin responsable." };
}

export async function guardarProximaAccion(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, ["caso_id", "proxima_accion", "proxima_accion_fecha"]);
  const datos = proximaAccionSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_casos")
    .update({
      proxima_accion: datos.data.proxima_accion,
      proxima_accion_fecha: datos.data.proxima_accion_fecha,
    })
    .eq("id", datos.data.caso_id);
  if (error) {
    console.error("Error al guardar la próxima acción:", error.message);
    return { ok: false, mensaje: "No pudimos guardar la próxima acción.", valores };
  }
  await registrarEvento(
    supabase,
    datos.data.caso_id,
    "proxima_accion",
    datos.data.proxima_accion
      ? `Próxima acción: ${datos.data.proxima_accion}${datos.data.proxima_accion_fecha ? ` (${datos.data.proxima_accion_fecha})` : ""}`
      : "Próxima acción borrada",
    admin.id,
  );
  revalidarCrm(datos.data.caso_id);
  return { ok: true, mensaje: "Próxima acción guardada.", valores };
}

export async function agregarNotaCaso(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, ["caso_id", "contenido"]);
  const datos = notaCasoSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { error } = await supabase.from("crm_eventos").insert({
    caso_id: datos.data.caso_id,
    tipo: "nota",
    descripcion: datos.data.contenido,
    autor_id: admin.id,
  });
  if (error) {
    console.error("Error al agregar la nota:", error.message);
    return { ok: false, mensaje: "No pudimos guardar la nota.", valores };
  }
  revalidarCrm(datos.data.caso_id);
  return { ok: true, mensaje: "Nota guardada." };
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export async function crearTarea(_estado: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, ["caso_id", ...CAMPOS_TAREA]);
  const datos = tareaSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_tareas")
    .insert({
      caso_id: datos.data.caso_id,
      tipo: datos.data.tipo,
      titulo: datos.data.titulo,
      descripcion: datos.data.descripcion,
      vence_at: datos.data.vence_at,
      responsable_id: datos.data.responsable_id,
      creada_por: admin.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Error al crear la tarea:", error.message);
    return { ok: false, mensaje: "No pudimos crear la tarea.", valores };
  }

  await registrarEvento(
    supabase,
    datos.data.caso_id,
    "tarea_creada",
    `Tarea creada: ${datos.data.titulo}`,
    admin.id,
    { tarea_id: data.id },
  );
  if (datos.data.responsable_id && datos.data.responsable_id !== admin.id) {
    await supabase.from("crm_notificaciones").insert({
      perfil_id: datos.data.responsable_id,
      titulo: `Nueva tarea: ${datos.data.titulo}`,
      cuerpo: datos.data.vence_at ? `Vence el ${datos.data.vence_at}` : null,
      enlace: rutaCaso(datos.data.caso_id),
      caso_id: datos.data.caso_id,
    });
  }
  revalidarCrm(datos.data.caso_id);
  return { ok: true, mensaje: "Tarea creada." };
}

export async function cambiarEstadoTarea(
  tareaId: string,
  estado: EstadoTarea,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const datos = estadoTareaSchema.safeParse({ tarea_id: tareaId, estado });
  if (!datos.success) return { ok: false, mensaje: "Tarea no válida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_tareas")
    .update({
      estado: datos.data.estado,
      completada_at: datos.data.estado === "completada" ? new Date().toISOString() : null,
    })
    .eq("id", datos.data.tarea_id)
    .select("caso_id, titulo")
    .single();
  if (error) {
    console.error("Error al cambiar la tarea:", error.message);
    return { ok: false, mensaje: "No pudimos actualizar la tarea." };
  }
  if (datos.data.estado !== "pendiente") {
    await registrarEvento(
      supabase,
      data.caso_id,
      "tarea_completada",
      `${datos.data.estado === "completada" ? "Tarea completada" : "Tarea cancelada"}: ${data.titulo}`,
      admin.id,
      { tarea_id: datos.data.tarea_id },
    );
  }
  revalidarCrm(data.caso_id);
  revalidatePath("/admin/crm/tareas", "page");
  return { ok: true, mensaje: "Tarea actualizada." };
}

// ---------------------------------------------------------------------------
// Mensajes (siempre a mano; el worker los envía)
// ---------------------------------------------------------------------------

export async function enviarMensaje(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, ["caso_id", "canal", "asunto", "contenido"]);
  const datos = mensajeSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data: caso, error: errorCaso } = await supabase
    .from("crm_casos")
    .select("id, telefono, email")
    .eq("id", datos.data.caso_id)
    .maybeSingle();
  if (errorCaso || !caso) return { ok: false, mensaje: "Caso no encontrado.", valores };
  if (datos.data.canal === "whatsapp" && !caso.telefono) {
    return { ok: false, mensaje: "El caso no tiene teléfono; agrégalo en sus datos.", valores };
  }
  if (datos.data.canal === "correo" && !caso.email) {
    return { ok: false, mensaje: "El caso no tiene correo; agrégalo en sus datos.", valores };
  }
  if (datos.data.canal === "correo" && !datos.data.asunto) {
    return {
      ok: false,
      mensaje: "Escribe el asunto del correo.",
      errores: { asunto: ["Escribe el asunto."] },
      valores,
    };
  }

  const { error } = await supabase.from("crm_mensajes").insert({
    caso_id: caso.id,
    canal: datos.data.canal,
    direccion: "salida",
    asunto: datos.data.canal === "correo" ? datos.data.asunto : null,
    contenido: datos.data.contenido,
    autor_id: admin.id,
    estado_envio: "pendiente",
  });
  if (error) {
    console.error("Error al encolar el mensaje:", error.message);
    return { ok: false, mensaje: "No pudimos enviar el mensaje.", valores };
  }
  await supabase
    .from("crm_casos")
    .update({ ultimo_mensaje_at: new Date().toISOString(), ultimo_mensaje_direccion: "salida" })
    .eq("id", caso.id);

  revalidarCrm(caso.id);
  return { ok: true, mensaje: "Mensaje en cola de envío." };
}

// ---------------------------------------------------------------------------
// IA: analiza y clasifica; nunca responde
// ---------------------------------------------------------------------------

async function ejecutarAnalisis(
  supabase: Supabase,
  casoId: string,
  autorId: string,
): Promise<
  { ok: true; analisis: AnalisisIA; etapaAplicada: boolean } | { ok: false; mensaje: string }
> {
  const configuracion = await obtenerConfiguracionIA();
  if (!configuracion.ok) return configuracion;
  const [caso, etapas] = await Promise.all([obtenerCaso(casoId), obtenerEtapas()]);
  if (!caso) return { ok: false, mensaje: "Caso no encontrado." };

  let analisis: AnalisisIA;
  try {
    analisis = await analizarCasoConIA(configuracion.config, {
      nombre: caso.nombre,
      etapaActual: caso.etapa.nombre,
      etapas: etapas.map((e) => ({ id: e.id, nombre: e.nombre, descripcion: e.descripcion })),
      mensajes: caso.mensajes
        .filter((m) => m.estadoEnvio !== "fallido")
        .map((m) => ({
          canal: m.canal,
          direccion: m.direccion,
          contenido: m.contenido,
          asunto: m.asunto,
          fecha: m.createdAt.slice(0, 16).replace("T", " "),
        })),
      proximaAccion: caso.proximaAccion,
      notas: caso.eventos.filter((e) => e.tipo === "nota").map((e) => e.descripcion),
    });
  } catch (error) {
    return { ok: false, mensaje: error instanceof Error ? error.message : "La IA no respondió." };
  }

  const { error } = await supabase
    .from("crm_casos")
    .update({ analisis: analisis as unknown as Json })
    .eq("id", casoId);
  if (error) {
    console.error("Error al guardar el análisis:", error.message);
    return { ok: false, mensaje: "No pudimos guardar el análisis." };
  }
  await registrarEvento(
    supabase,
    casoId,
    "analisis_ia",
    `Análisis de IA (${analisis.modelo}): prioridad ${analisis.prioridad}${analisis.etapaSugeridaNombre ? `, etapa sugerida «${analisis.etapaSugeridaNombre}»` : ""}. ${analisis.resumen}`,
    autorId,
  );

  let etapaAplicada = false;
  if (
    configuracion.aplicarEtapaSugerida &&
    analisis.etapaSugeridaId &&
    analisis.etapaSugeridaId !== caso.etapa.id
  ) {
    const { error: errorMover } = await supabase.rpc("crm_mover_etapa", {
      p_caso_id: casoId,
      p_etapa_id: analisis.etapaSugeridaId,
      p_autor: autorId,
      p_motivo: "Clasificado por la IA",
    });
    etapaAplicada = !errorMover;
  }
  return { ok: true, analisis, etapaAplicada };
}

export async function analizarCaso(casoId: string): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  if (!z.uuid().safeParse(casoId).success) return { ok: false, mensaje: "Caso no válido." };
  const supabase = await createClient();
  const resultado = await ejecutarAnalisis(supabase, casoId, admin.id);
  revalidarCrm(casoId);
  if (!resultado.ok) return resultado;
  return {
    ok: true,
    mensaje: resultado.etapaAplicada
      ? `Análisis listo. El caso pasó a «${resultado.analisis.etapaSugeridaNombre}».`
      : "Análisis listo.",
  };
}

/** Analiza hasta 15 casos con mensajes nuevos desde su último análisis. */
export async function analizarCasosPendientes(): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_casos")
    .select("id, analisis, ultimo_mensaje_at, etapa:crm_etapas!inner(cierre)")
    .is("etapa.cierre", null)
    .not("ultimo_mensaje_at", "is", null)
    .order("ultimo_mensaje_at", { ascending: false })
    .limit(60);
  if (error) return { ok: false, mensaje: "No pudimos leer los casos." };

  const pendientes = data
    .filter((c) => {
      const analizado =
        c.analisis && typeof c.analisis === "object" && !Array.isArray(c.analisis)
          ? c.analisis.analizadoAt
          : null;
      return typeof analizado !== "string" || (c.ultimo_mensaje_at ?? "") > analizado;
    })
    .slice(0, 15);
  if (pendientes.length === 0)
    return { ok: true, mensaje: "No hay casos con mensajes nuevos por analizar." };

  let analizados = 0;
  let ultimoError: string | null = null;
  for (const caso of pendientes) {
    const resultado = await ejecutarAnalisis(supabase, caso.id, admin.id);
    if (resultado.ok) analizados += 1;
    else {
      ultimoError = resultado.mensaje;
      if (/clave|desactivada|CRM_CLAVE/.test(resultado.mensaje)) break;
    }
  }
  revalidarCrm();
  if (analizados === 0)
    return { ok: false, mensaje: ultimoError ?? "No se pudo analizar ningún caso." };
  return {
    ok: true,
    mensaje: `${analizados} ${analizados === 1 ? "caso analizado" : "casos analizados"}${ultimoError ? `. Último error: ${ultimoError}` : "."}`,
  };
}

export async function aplicarEtapaSugerida(casoId: string): Promise<EstadoAccion> {
  await requerirAdmin();
  const caso = await obtenerCaso(casoId);
  if (!caso?.analisis?.etapaSugeridaId) return { ok: false, mensaje: "No hay etapa sugerida." };
  return moverEtapaCaso(casoId, caso.analisis.etapaSugeridaId, "Etapa sugerida por la IA");
}

// ---------------------------------------------------------------------------
// Integración con los expedientes (clientes) de la plataforma
// ---------------------------------------------------------------------------

/** Búsqueda de expedientes para vincular (desde la ficha del caso). */
export async function buscarClientes(termino: string) {
  return buscarClientesParaVincular(typeof termino === "string" ? termino : "");
}

export async function vincularCliente(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, ["caso_id", "cliente_id"]);
  const datos = vincularClienteSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre_completo")
    .eq("id", datos.data.cliente_id)
    .maybeSingle();
  if (!cliente) return { ok: false, mensaje: "Cliente no encontrado.", valores };

  const { error } = await supabase
    .from("crm_casos")
    .update({ cliente_id: cliente.id })
    .eq("id", datos.data.caso_id);
  if (error) return { ok: false, mensaje: "No pudimos vincular el expediente.", valores };

  await registrarEvento(
    supabase,
    datos.data.caso_id,
    "expediente",
    `Vinculado al expediente de ${cliente.nombre_completo}`,
    admin.id,
  );
  revalidarCrm(datos.data.caso_id);
  return { ok: true, mensaje: "Expediente vinculado." };
}

/** Crea el expediente (cliente + propuesta) con los datos del caso y lo vincula. */
export async function crearExpedienteDesdeCaso(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, ["caso_id", "email"]);
  const datos = crearExpedienteSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const caso = await obtenerCaso(datos.data.caso_id);
  if (!caso) return { ok: false, mensaje: "Caso no encontrado.", valores };
  if (caso.cliente) return { ok: false, mensaje: "Este caso ya tiene expediente.", valores };
  const email = datos.data.email ?? caso.email;
  if (!email) {
    return {
      ok: false,
      mensaje: "El expediente necesita un correo.",
      errores: { email: ["Escribe el correo del cliente."] },
      valores,
    };
  }

  const supabase = await createClient();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nombre_completo: caso.nombre,
      email,
      telefono: caso.telefono ? formatearTelefono(caso.telefono) : null,
      origen: "creado_por_admin",
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        mensaje: "Ya existe un cliente con ese correo. Vincúlalo con «Buscar expediente».",
        valores,
      };
    }
    console.error("Error al crear el expediente:", error.message);
    return { ok: false, mensaje: "No pudimos crear el expediente.", valores };
  }

  await supabase
    .from("crm_casos")
    .update({ cliente_id: cliente.id, email: caso.email ?? email })
    .eq("id", caso.id);
  await registrarEvento(
    supabase,
    caso.id,
    "expediente",
    "Expediente creado desde el CRM",
    admin.id,
  );
  revalidarCrm(caso.id);
  revalidatePath("/admin/clientes", "layout");
  return { ok: true, mensaje: "Expediente creado y vinculado." };
}

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

export async function marcarNotificacionesLeidas(ids?: number[]): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const supabase = await createClient();
  let consulta = supabase
    .from("crm_notificaciones")
    .update({ leida_at: new Date().toISOString() })
    .eq("perfil_id", admin.id)
    .is("leida_at", null);
  if (ids && ids.length > 0) consulta = consulta.in("id", ids.slice(0, 100));
  const { error } = await consulta;
  if (error) return { ok: false, mensaje: "No pudimos actualizar las notificaciones." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
