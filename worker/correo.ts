import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";

import { leerAjustesCorreo, objetoJson, type AjustesCorreo } from "@/lib/crm/ajustes";
import { descifrar } from "@/lib/crm/cifrado";
import type { Json } from "@/types/database";

import type { EntornoWorker } from "./entorno";
import { crearRegistro, mensajeDeError } from "./registro";
import type { SupabaseWorker } from "./supabase";

/**
 * Canal de correo: revisa la bandeja por IMAP y registra los correos nuevos como mensajes del
 * CRM; envía por SMTP los correos en cola (respuestas del equipo y correos automáticos).
 */

const log = crearRegistro("correo");

const REVISAR_CADA_MS = 60_000;
const ENVIAR_CADA_MS = 10_000;
const MAX_CONTENIDO = 20_000;
const DIAS_INICIALES = 2;

type Credenciales = { ajustes: AjustesCorreo; contrasena: string };

async function cargarCredenciales(
  sb: SupabaseWorker,
  entorno: EntornoWorker,
): Promise<Credenciales | null> {
  const { data, error } = await sb
    .from("crm_ajustes")
    .select("valor, secreto, updated_at")
    .eq("clave", "correo")
    .maybeSingle();
  if (error) {
    log.error("No se pudieron leer los ajustes de correo", error.message);
    return null;
  }
  if (!data) return null;
  const ajustes = leerAjustesCorreo(data);
  if (
    !ajustes.activo ||
    !data.secreto ||
    !ajustes.smtpHost ||
    !ajustes.imapHost ||
    !ajustes.usuario
  ) {
    return null;
  }
  if (!entorno.claveCifrado) {
    log.aviso("Falta CRM_CLAVE_CIFRADO; no se puede leer la contraseña del correo");
    return null;
  }
  try {
    return { ajustes, contrasena: descifrar(data.secreto, entorno.claveCifrado) };
  } catch {
    log.error("No se pudo descifrar la contraseña del correo (¿cambió CRM_CLAVE_CIFRADO?)");
    return null;
  }
}

async function guardarEstadoCorreo(sb: SupabaseWorker, cambios: Record<string, Json>) {
  const { data } = await sb.from("crm_ajustes").select("valor").eq("clave", "correo").maybeSingle();
  const valor = { ...objetoJson(data?.valor), ...cambios } as Json;
  const { error } = await sb.from("crm_ajustes").update({ valor }).eq("clave", "correo");
  if (error) log.error("No se pudo guardar el estado del correo", error.message);
}

function htmlATexto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

async function revisarBandeja(sb: SupabaseWorker, { ajustes, contrasena }: Credenciales) {
  const cliente = new ImapFlow({
    host: ajustes.imapHost,
    port: ajustes.imapPuerto,
    secure: ajustes.imapSeguro,
    auth: { user: ajustes.usuario, pass: contrasena },
    logger: false,
    connectionTimeout: 20_000,
  });
  const propios = new Set([ajustes.usuario.toLowerCase(), ajustes.remitenteEmail.toLowerCase()]);
  let maxUid = ajustes.ultimoUid ?? 0;
  let nuevos = 0;

  await cliente.connect();
  try {
    const bloqueo = await cliente.getMailboxLock("INBOX");
    try {
      const desde = ajustes.ultimoUid;
      const rango =
        desde !== null
          ? { uid: `${desde + 1}:*` }
          : { since: new Date(Date.now() - DIAS_INICIALES * 86_400_000) };
      for await (const mensaje of cliente.fetch(rango, { uid: true, source: true })) {
        // Con "n:*" el servidor devuelve el último correo aunque su UID sea menor que n.
        if (desde !== null && mensaje.uid <= desde) continue;
        maxUid = Math.max(maxUid, mensaje.uid);
        if (!mensaje.source) continue;
        const parseado = await simpleParser(mensaje.source);
        const remitente = parseado.from?.value[0];
        const direccion = remitente?.address?.toLowerCase();
        if (!direccion || propios.has(direccion)) continue;
        const texto = (
          parseado.text?.trim() ||
          (parseado.html ? htmlATexto(parseado.html) : "") ||
          "(sin texto)"
        ).slice(0, MAX_CONTENIDO);
        const { data, error } = await sb.rpc("crm_registrar_entrante", {
          p_canal: "correo",
          p_identificador: direccion,
          p_nombre: remitente?.name?.trim() || null,
          p_contenido: texto,
          p_id_externo: parseado.messageId ?? `uid:${ajustes.usuario}:${mensaje.uid}`,
          p_asunto: parseado.subject?.slice(0, 300) ?? null,
          p_fecha: parseado.date?.toISOString() ?? null,
        });
        if (error) log.error("No se pudo registrar un correo entrante", error.message);
        else if (data?.[0]?.mensaje_nuevo) {
          nuevos += 1;
          log.info(data[0].caso_nuevo ? "Caso nuevo desde correo" : "Correo nuevo", direccion);
        }
      }
    } finally {
      bloqueo.release();
    }
  } finally {
    await cliente.logout().catch(() => undefined);
  }

  await guardarEstadoCorreo(sb, {
    ultimo_uid: maxUid,
    revisado_at: new Date().toISOString(),
    ultimo_error: null,
  });
  if (nuevos > 0) log.info(`${nuevos} correo(s) registrado(s)`);
}

async function enviarPendientes(sb: SupabaseWorker, { ajustes, contrasena }: Credenciales) {
  const { data, error } = await sb
    .from("crm_mensajes")
    .select("id, caso_id, asunto, contenido, caso:crm_casos(email, nombre)")
    .eq("canal", "correo")
    .eq("direccion", "salida")
    .eq("estado_envio", "pendiente")
    .order("id")
    .limit(10);
  if (error) {
    log.error("No se pudieron leer los correos pendientes", error.message);
    return;
  }
  if (data.length === 0) return;

  const transporte = nodemailer.createTransport({
    host: ajustes.smtpHost,
    port: ajustes.smtpPuerto,
    secure: ajustes.smtpSeguro,
    auth: { user: ajustes.usuario, pass: contrasena },
    connectionTimeout: 20_000,
  });

  for (const mensaje of data) {
    const email = mensaje.caso?.email;
    if (!email) {
      await sb
        .from("crm_mensajes")
        .update({ estado_envio: "fallido", error: "El caso no tiene correo" })
        .eq("id", mensaje.id);
      continue;
    }
    const { data: ultimo } = await sb
      .from("crm_mensajes")
      .select("id_externo")
      .eq("caso_id", mensaje.caso_id)
      .eq("canal", "correo")
      .eq("direccion", "entrada")
      .not("id_externo", "is", null)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    const referencia = ultimo?.id_externo?.startsWith("<") ? ultimo.id_externo : undefined;

    try {
      const info = await transporte.sendMail({
        from: {
          name: ajustes.remitenteNombre || "Insolvencia Efectiva",
          address: ajustes.remitenteEmail,
        },
        to: { name: mensaje.caso?.nombre ?? "", address: email },
        subject: mensaje.asunto ?? "Insolvencia Efectiva",
        text: mensaje.contenido,
        inReplyTo: referencia,
        references: referencia,
      });
      await sb
        .from("crm_mensajes")
        .update({
          estado_envio: "enviado",
          id_externo: info.messageId ?? null,
          enviado_at: new Date().toISOString(),
          error: null,
        })
        .eq("id", mensaje.id);
      log.info("Correo enviado", { id: mensaje.id, email });
    } catch (error) {
      await sb
        .from("crm_mensajes")
        .update({ estado_envio: "fallido", error: mensajeDeError(error).slice(0, 500) })
        .eq("id", mensaje.id);
      log.error("No se pudo enviar un correo", error);
      await guardarEstadoCorreo(sb, {
        ultimo_error: `Envío: ${mensajeDeError(error).slice(0, 300)}`,
      });
    }
  }
}

export async function iniciarCorreo(
  sb: SupabaseWorker,
  entorno: EntornoWorker,
): Promise<() => Promise<void>> {
  let revisando = false;
  let enviando = false;

  const revisar = async () => {
    if (revisando) return;
    revisando = true;
    try {
      const credenciales = await cargarCredenciales(sb, entorno);
      if (!credenciales) return;
      await revisarBandeja(sb, credenciales);
    } catch (error) {
      log.error("Error al revisar la bandeja", error);
      await guardarEstadoCorreo(sb, {
        ultimo_error: `IMAP: ${mensajeDeError(error).slice(0, 300)}`,
      });
    } finally {
      revisando = false;
    }
  };

  const enviar = async () => {
    if (enviando) return;
    enviando = true;
    try {
      const credenciales = await cargarCredenciales(sb, entorno);
      if (!credenciales) return;
      await enviarPendientes(sb, credenciales);
    } catch (error) {
      log.error("Error al enviar correos", error);
    } finally {
      enviando = false;
    }
  };

  const intervalos = [
    setInterval(() => void revisar(), REVISAR_CADA_MS),
    setInterval(() => void enviar(), ENVIAR_CADA_MS),
  ];
  void revisar();
  void enviar();
  log.info("Canal de correo iniciado (revisa la bandeja cada minuto)");

  return async () => {
    for (const intervalo of intervalos) clearInterval(intervalo);
  };
}
