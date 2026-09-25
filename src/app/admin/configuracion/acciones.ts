"use server";

import { ImapFlow } from "imapflow";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { z } from "zod";

import { erroresDeValidacion, valoresTexto, type EstadoAccion } from "@/lib/acciones";
import { requerirAdmin } from "@/lib/auth/sesion";
import { cifrar, claveDesdeEntorno } from "@/lib/crm/cifrado";
import { probarConexionIA } from "@/lib/crm/ia";
import { obtenerConfiguracionIA, obtenerCredencialesCorreo, obtenerEtapas } from "@/lib/datos/crm";
import { createClient } from "@/lib/supabase/server";
import {
  CAMPOS_AJUSTES_CORREO,
  CAMPOS_AJUSTES_IA,
  CAMPOS_ETAPA,
  ajustesCorreoSchema,
  ajustesIaSchema,
  etapaSchema,
} from "@/lib/validaciones/crm";
import type { Json } from "@/types/database";

function revalidarConfiguracion() {
  revalidatePath("/admin/configuracion", "layout");
  revalidatePath("/admin/crm", "layout");
}

// ---------------------------------------------------------------------------
// Etapas
// ---------------------------------------------------------------------------

export async function guardarEtapa(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();
  const valores = valoresTexto(formData, CAMPOS_ETAPA);
  const datos = etapaSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const correo =
    datos.data.correo_asunto || datos.data.correo_cuerpo
      ? { asunto: datos.data.correo_asunto ?? "", cuerpo: datos.data.correo_cuerpo ?? "" }
      : null;
  if (correo && !correo.asunto) {
    return {
      ok: false,
      mensaje: "El correo automático necesita un asunto.",
      errores: { correo_asunto: ["Escribe el asunto."] },
      valores,
    };
  }

  const supabase = await createClient();
  const fila = {
    nombre: datos.data.nombre,
    color: datos.data.color,
    descripcion: datos.data.descripcion,
    cierre: datos.data.cierre,
    tareas_automaticas: datos.data.tareas_automaticas as unknown as Json,
    correo_automatico: correo as Json | null,
  };

  if (datos.data.id) {
    const { error } = await supabase.from("crm_etapas").update(fila).eq("id", datos.data.id);
    if (error) {
      console.error("Error al actualizar la etapa:", error.message);
      return { ok: false, mensaje: "No pudimos guardar la etapa.", valores };
    }
  } else {
    const etapas = await obtenerEtapas();
    const orden = (etapas.at(-1)?.orden ?? 0) + 1;
    const { error } = await supabase.from("crm_etapas").insert({ ...fila, orden });
    if (error) {
      console.error("Error al crear la etapa:", error.message);
      return { ok: false, mensaje: "No pudimos crear la etapa.", valores };
    }
  }
  revalidarConfiguracion();
  return { ok: true, mensaje: "Etapa guardada." };
}

export async function eliminarEtapa(etapaId: string): Promise<EstadoAccion> {
  await requerirAdmin();
  if (!z.uuid().safeParse(etapaId).success) return { ok: false, mensaje: "Etapa no válida." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("crm_casos")
    .select("id", { count: "exact", head: true })
    .eq("etapa_id", etapaId);
  if (count && count > 0) {
    return {
      ok: false,
      mensaje: `Esta etapa tiene ${count} ${count === 1 ? "caso" : "casos"}. Muévelos a otra etapa antes de eliminarla.`,
    };
  }
  const { error } = await supabase.from("crm_etapas").delete().eq("id", etapaId);
  if (error) return { ok: false, mensaje: "No pudimos eliminar la etapa." };
  revalidarConfiguracion();
  return { ok: true, mensaje: "Etapa eliminada." };
}

export async function moverOrdenEtapa(
  etapaId: string,
  direccion: "arriba" | "abajo",
): Promise<EstadoAccion> {
  await requerirAdmin();
  const etapas = await obtenerEtapas();
  const indice = etapas.findIndex((e) => e.id === etapaId);
  if (indice === -1) return { ok: false, mensaje: "Etapa no válida." };
  const destino = direccion === "arriba" ? indice - 1 : indice + 1;
  if (destino < 0 || destino >= etapas.length) return { ok: true };

  const supabase = await createClient();
  const reordenadas = [...etapas];
  [reordenadas[indice], reordenadas[destino]] = [reordenadas[destino]!, reordenadas[indice]!];
  const resultados = await Promise.all(
    reordenadas.map((etapa, i) =>
      supabase
        .from("crm_etapas")
        .update({ orden: i + 1 })
        .eq("id", etapa.id),
    ),
  );
  if (resultados.some((r) => r.error)) return { ok: false, mensaje: "No pudimos reordenar." };
  revalidarConfiguracion();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// IA
// ---------------------------------------------------------------------------

export async function guardarAjustesIa(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, CAMPOS_AJUSTES_IA);
  const datos = ajustesIaSchema.safeParse({ ...valores, api_key: formData.get("api_key") });
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const cambios: {
    valor: Json;
    actualizado_por: string;
    secreto?: string;
  } = {
    valor: {
      activo: datos.data.activo,
      proveedor: datos.data.proveedor,
      modelo: datos.data.modelo,
      aplicar_etapa_sugerida: datos.data.aplicar_etapa_sugerida,
    },
    actualizado_por: admin.id,
  };

  if (datos.data.api_key) {
    const clave = claveDesdeEntorno();
    if (!clave) {
      return {
        ok: false,
        mensaje:
          "Falta CRM_CLAVE_CIFRADO en el servidor. Defínela (ver Configuración → IA) antes de guardar la clave de API.",
        valores,
      };
    }
    cambios.secreto = cifrar(datos.data.api_key, clave);
  }

  const { error } = await supabase.from("crm_ajustes").update(cambios).eq("clave", "ia");
  if (error) {
    console.error("Error al guardar los ajustes de IA:", error.message);
    return { ok: false, mensaje: "No pudimos guardar los ajustes.", valores };
  }
  revalidarConfiguracion();
  return { ok: true, mensaje: "Ajustes de IA guardados.", valores };
}

export async function probarIa(): Promise<EstadoAccion> {
  await requerirAdmin();
  const configuracion = await obtenerConfiguracionIA();
  if (!configuracion.ok) return { ok: false, mensaje: configuracion.mensaje };
  try {
    const respuesta = await probarConexionIA(configuracion.config);
    return {
      ok: true,
      mensaje: `Conexión correcta con ${configuracion.config.modelo}: «${respuesta}».`,
    };
  } catch (error) {
    return { ok: false, mensaje: error instanceof Error ? error.message : "La prueba falló." };
  }
}

// ---------------------------------------------------------------------------
// Correo
// ---------------------------------------------------------------------------

export async function guardarAjustesCorreo(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  const valores = valoresTexto(formData, CAMPOS_AJUSTES_CORREO);
  const datos = ajustesCorreoSchema.safeParse({
    ...valores,
    contrasena: formData.get("contrasena"),
  });
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("crm_ajustes")
    .select("valor, secreto")
    .eq("clave", "correo")
    .maybeSingle();
  const previo =
    actual?.valor && typeof actual.valor === "object" && !Array.isArray(actual.valor)
      ? actual.valor
      : {};

  const cambios: { valor: Json; actualizado_por: string; secreto?: string } = {
    valor: {
      ...previo,
      activo: datos.data.activo,
      remitente_nombre: datos.data.remitente_nombre,
      remitente_email: datos.data.remitente_email,
      usuario: datos.data.usuario,
      smtp_host: datos.data.smtp_host,
      smtp_puerto: datos.data.smtp_puerto,
      smtp_seguro: datos.data.smtp_seguro,
      imap_host: datos.data.imap_host,
      imap_puerto: datos.data.imap_puerto,
      imap_seguro: datos.data.imap_seguro,
      ultimo_error: null,
    },
    actualizado_por: admin.id,
  };

  if (datos.data.contrasena) {
    const clave = claveDesdeEntorno();
    if (!clave) {
      return {
        ok: false,
        mensaje: "Falta CRM_CLAVE_CIFRADO en el servidor; no se puede guardar la contraseña.",
        valores,
      };
    }
    cambios.secreto = cifrar(datos.data.contrasena, clave);
  } else if (!actual?.secreto && datos.data.activo) {
    return {
      ok: false,
      mensaje: "Escribe la contraseña (o contraseña de aplicación) del correo.",
      errores: { contrasena: ["Escribe la contraseña."] },
      valores,
    };
  }

  const { error } = await supabase.from("crm_ajustes").update(cambios).eq("clave", "correo");
  if (error) {
    console.error("Error al guardar los ajustes de correo:", error.message);
    return { ok: false, mensaje: "No pudimos guardar los ajustes.", valores };
  }
  revalidarConfiguracion();
  return { ok: true, mensaje: "Ajustes de correo guardados.", valores };
}

export async function probarCorreo(): Promise<EstadoAccion> {
  await requerirAdmin();
  const { ajustes, contrasena } = await obtenerCredencialesCorreo();
  if (!contrasena) return { ok: false, mensaje: "Guarda primero la contraseña del correo." };
  if (!ajustes.smtpHost || !ajustes.imapHost) {
    return { ok: false, mensaje: "Completa los servidores SMTP e IMAP." };
  }

  const resultados: string[] = [];
  try {
    const transporte = nodemailer.createTransport({
      host: ajustes.smtpHost,
      port: ajustes.smtpPuerto,
      secure: ajustes.smtpSeguro,
      auth: { user: ajustes.usuario, pass: contrasena },
      connectionTimeout: 15_000,
    });
    await transporte.verify();
    resultados.push("SMTP correcto");
  } catch (error) {
    return {
      ok: false,
      mensaje: `SMTP falló: ${error instanceof Error ? error.message : "sin detalle"}`,
    };
  }

  const imap = new ImapFlow({
    host: ajustes.imapHost,
    port: ajustes.imapPuerto,
    secure: ajustes.imapSeguro,
    auth: { user: ajustes.usuario, pass: contrasena },
    logger: false,
    connectionTimeout: 15_000,
  });
  try {
    await imap.connect();
    const buzon = await imap.mailboxOpen("INBOX");
    resultados.push(`IMAP correcto (${buzon.exists} correos en la bandeja)`);
    await imap.logout();
  } catch (error) {
    return {
      ok: false,
      mensaje: `${resultados.join(", ")}. IMAP falló: ${error instanceof Error ? error.message : "sin detalle"}`,
    };
  }
  return { ok: true, mensaje: resultados.join(" · ") + "." };
}

// ---------------------------------------------------------------------------
// WhatsApp (señales al worker)
// ---------------------------------------------------------------------------

async function senalarWhatsApp(campo: "reinicio_solicitado" | "cierre_solicitado") {
  await requerirAdmin();
  const supabase = await createClient();
  const { data: cuenta } = await supabase
    .from("wa_cuentas")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!cuenta) return { ok: false, mensaje: "No hay cuenta de WhatsApp configurada." };
  const { error } = await supabase
    .from("wa_cuentas")
    .update(
      campo === "reinicio_solicitado" ? { reinicio_solicitado: true } : { cierre_solicitado: true },
    )
    .eq("id", cuenta.id);
  if (error) return { ok: false, mensaje: "No pudimos enviar la señal al worker." };
  revalidarConfiguracion();
  return { ok: true };
}

export async function reiniciarWhatsApp(): Promise<EstadoAccion> {
  const r = await senalarWhatsApp("reinicio_solicitado");
  return r.ok ? { ok: true, mensaje: "Reinicio solicitado; el QR aparecerá en unos segundos." } : r;
}

export async function cerrarSesionWhatsApp(): Promise<EstadoAccion> {
  const r = await senalarWhatsApp("cierre_solicitado");
  return r.ok ? { ok: true, mensaje: "Cierre de sesión solicitado; se generará un QR nuevo." } : r;
}
