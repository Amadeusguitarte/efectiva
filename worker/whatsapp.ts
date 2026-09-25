import makeWASocket, {
  BufferJSON,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  proto,
  type AuthenticationCreds,
  type ConnectionState,
  type SignalDataTypeMap,
  type WAMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";

import { jidDeTelefono, telefonoDeJid } from "@/lib/crm/telefono";
import type { Json, TablesUpdate } from "@/types/database";

import { crearRegistro, esperar, mensajeDeError } from "./registro";
import type { SupabaseWorker } from "./supabase";

/**
 * Conexión de WhatsApp por QR (Baileys). La sesión se guarda en `wa_auth`; el estado y el QR en
 * `wa_cuentas` para que el panel los muestre. Los mensajes entrantes se registran con
 * `crm_registrar_entrante` y los salientes pendientes de `crm_mensajes` se envían aquí.
 * No responde nada automáticamente.
 */

const log = crearRegistro("whatsapp");
const logger = pino({ level: "silent" });

const SALIENTES_CADA_MS = 3_000;
const SENALES_CADA_MS = 3_000;
const LATIDO_CADA_MS = 30_000;
const RECONEXION_MAX_MS = 60_000;

type Valor = Json;

async function usarEstadoAuth(sb: SupabaseWorker, cuentaId: string) {
  const leer = async (clave: string): Promise<unknown> => {
    const { data, error } = await sb
      .from("wa_auth")
      .select("valor")
      .eq("cuenta_id", cuentaId)
      .eq("clave", clave)
      .maybeSingle();
    if (error) throw new Error(`wa_auth (${clave}): ${error.message}`);
    return data ? JSON.parse(JSON.stringify(data.valor), BufferJSON.reviver) : null;
  };
  const escribir = async (clave: string, valor: unknown) => {
    const serializado = JSON.parse(JSON.stringify(valor, BufferJSON.replacer)) as Valor;
    const { error } = await sb.from("wa_auth").upsert({
      cuenta_id: cuentaId,
      clave,
      valor: serializado,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`wa_auth (${clave}): ${error.message}`);
  };
  const borrar = async (clave: string) => {
    await sb.from("wa_auth").delete().eq("cuenta_id", cuentaId).eq("clave", clave);
  };

  const creds = ((await leer("creds")) as AuthenticationCreds | null) ?? initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(tipo: T, ids: string[]) => {
          const datos: { [id: string]: SignalDataTypeMap[T] } = {};
          for (const id of ids) {
            let valor = await leer(`${tipo}-${id}`);
            if (tipo === "app-state-sync-key" && valor) {
              valor = proto.Message.AppStateSyncKeyData.fromObject(valor as object);
            }
            if (valor) datos[id] = valor as SignalDataTypeMap[T];
          }
          return datos;
        },
        set: async (datos: { [categoria: string]: { [id: string]: unknown } }) => {
          for (const categoria of Object.keys(datos)) {
            for (const id of Object.keys(datos[categoria] ?? {})) {
              const valor = datos[categoria]?.[id];
              const clave = `${categoria}-${id}`;
              if (valor) await escribir(clave, valor);
              else await borrar(clave);
            }
          }
        },
      },
    },
    saveCreds: () => escribir("creds", creds),
    limpiar: async () => {
      await sb.from("wa_auth").delete().eq("cuenta_id", cuentaId);
    },
  };
}

function extraerTexto(mensaje: proto.IMessage | null | undefined): string | null {
  if (!mensaje) return null;
  const m =
    mensaje.ephemeralMessage?.message ??
    mensaje.viewOnceMessage?.message ??
    mensaje.viewOnceMessageV2?.message ??
    mensaje.documentWithCaptionMessage?.message ??
    mensaje;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage)
    return `[Imagen]${m.imageMessage.caption ? ` ${m.imageMessage.caption}` : ""}`;
  if (m.videoMessage) return `[Video]${m.videoMessage.caption ? ` ${m.videoMessage.caption}` : ""}`;
  if (m.audioMessage) return m.audioMessage.ptt ? "[Nota de voz]" : "[Audio]";
  if (m.documentMessage) {
    return `[Documento${m.documentMessage.fileName ? `: ${m.documentMessage.fileName}` : ""}]${m.documentMessage.caption ? ` ${m.documentMessage.caption}` : ""}`;
  }
  if (m.stickerMessage) return "[Sticker]";
  if (m.locationMessage || m.liveLocationMessage) return "[Ubicación compartida]";
  if (m.contactMessage || m.contactsArrayMessage) return "[Contacto compartido]";
  if (m.buttonsResponseMessage?.selectedDisplayText)
    return m.buttonsResponseMessage.selectedDisplayText;
  if (m.listResponseMessage?.title) return m.listResponseMessage.title;
  if (m.templateButtonReplyMessage?.selectedDisplayText)
    return m.templateButtonReplyMessage.selectedDisplayText;
  return null;
}

function telefonoDelMensaje(mensaje: WAMessage): string | null {
  const clave = mensaje.key as {
    remoteJid?: string | null;
    remoteJidAlt?: string | null;
    senderPn?: string | null;
  };
  return (
    telefonoDeJid(clave.remoteJid) ??
    telefonoDeJid(clave.remoteJidAlt) ??
    telefonoDeJid(clave.senderPn) ??
    telefonoDeJid((mensaje as { senderPn?: string | null }).senderPn)
  );
}

export async function iniciarWhatsApp(sb: SupabaseWorker): Promise<() => Promise<void>> {
  const { data: cuenta, error } = await sb
    .from("wa_cuentas")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer wa_cuentas: ${error.message}`);
  if (!cuenta) {
    log.aviso("No hay cuenta de WhatsApp en la base; se omite el canal.");
    return async () => {};
  }
  const cuentaId = cuenta.id;

  let sock: WASocket | null = null;
  let auth: Awaited<ReturnType<typeof usarEstadoAuth>> | null = null;
  let conectado = false;
  let deteniendo = false;
  let reconexionProgramada = false;
  let reintentos = 0;
  let procesando = false;

  const actualizarCuenta = async (cambios: TablesUpdate<"wa_cuentas">) => {
    const { error: e } = await sb.from("wa_cuentas").update(cambios).eq("id", cuentaId);
    if (e) log.error("No se pudo actualizar wa_cuentas", e.message);
  };

  function programarReconexion(retraso?: number) {
    if (deteniendo || reconexionProgramada) return;
    reconexionProgramada = true;
    const espera = retraso ?? Math.min(RECONEXION_MAX_MS, 3_000 * 2 ** Math.min(reintentos, 5));
    reintentos += 1;
    void esperar(espera).then(() => {
      reconexionProgramada = false;
      if (!deteniendo && !sock) void conectar();
    });
  }

  async function manejarConexion(socket: WASocket, actualizacion: Partial<ConnectionState>) {
    if (socket !== sock) return;
    if (actualizacion.qr) {
      conectado = false;
      await actualizarCuenta({ estado: "qr", qr: actualizacion.qr, ultimo_error: null });
      log.info("QR disponible para vincular");
    }
    if (actualizacion.connection === "open") {
      conectado = true;
      reintentos = 0;
      const id = socket.user?.id ?? null;
      const telefono = telefonoDeJid(id) ?? id?.split(":")[0]?.split("@")[0] ?? null;
      await actualizarCuenta({
        estado: "conectado",
        qr: null,
        telefono,
        conectado_at: new Date().toISOString(),
        ultimo_error: null,
      });
      log.info("Conectado", telefono);
    }
    if (actualizacion.connection === "close") {
      conectado = false;
      sock = null;
      const codigo = (
        actualizacion.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
      )?.output?.statusCode;
      const cerroSesion = codigo === DisconnectReason.loggedOut;
      const motivo = actualizacion.lastDisconnect?.error
        ? mensajeDeError(actualizacion.lastDisconnect.error)
        : "conexión cerrada";
      log.aviso(`Conexión cerrada (código ${codigo ?? "?"})`, motivo);
      if (cerroSesion) {
        await auth?.limpiar();
        await actualizarCuenta({
          estado: "desconectado",
          qr: null,
          telefono: null,
          ultimo_error:
            "La sesión se cerró desde el teléfono. Genera un QR nuevo para volver a vincular.",
        });
      } else {
        // 515 es el reinicio normal tras vincular; no es un error.
        await actualizarCuenta({
          estado: "conectando",
          qr: null,
          ultimo_error: codigo === 515 ? null : motivo,
        });
      }
      programarReconexion(cerroSesion || codigo === 515 ? 1_500 : undefined);
    }
  }

  async function manejarMensajes({ messages, type }: { messages: WAMessage[]; type: string }) {
    if (type !== "notify") return;
    for (const mensaje of messages) {
      try {
        if (!mensaje.message || mensaje.key.fromMe) continue;
        const jid = mensaje.key.remoteJid ?? "";
        if (
          !jid ||
          jid === "status@broadcast" ||
          jid.endsWith("@g.us") ||
          jid.endsWith("@newsletter")
        )
          continue;
        const texto = extraerTexto(mensaje.message);
        if (!texto) continue;
        const telefono = telefonoDelMensaje(mensaje);
        if (!telefono) {
          log.aviso("Mensaje sin teléfono identificable (LID); se omite", jid);
          continue;
        }
        const segundos = Number(mensaje.messageTimestamp ?? 0);
        const fecha =
          segundos > 0 ? new Date(segundos * 1000).toISOString() : new Date().toISOString();
        const { data, error: e } = await sb.rpc("crm_registrar_entrante", {
          p_canal: "whatsapp",
          p_identificador: telefono,
          p_nombre: mensaje.pushName ?? null,
          p_contenido: texto,
          p_id_externo: mensaje.key.id ?? null,
          p_asunto: null,
          p_fecha: fecha,
        });
        if (e) log.error("No se pudo registrar el mensaje entrante", e.message);
        else if (data?.[0]?.mensaje_nuevo) {
          log.info(data[0].caso_nuevo ? "Caso nuevo desde WhatsApp" : "Mensaje nuevo", telefono);
        }
      } catch (error) {
        log.error("Error procesando un mensaje entrante", error);
      }
    }
  }

  async function conectar() {
    if (deteniendo || sock) return;
    try {
      auth = await usarEstadoAuth(sb, cuentaId);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
      const nuevo = makeWASocket({
        version,
        auth: {
          creds: auth.state.creds,
          keys: makeCacheableSignalKeyStore(auth.state.keys, logger),
        },
        logger,
        printQRInTerminal: false,
        browser: ["Insolvencia Efectiva", "Chrome", "1.0.0"],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
      });
      sock = nuevo;
      await actualizarCuenta({ estado: "conectando" });
      nuevo.ev.on("creds.update", () => {
        auth?.saveCreds().catch((e) => log.error("No se pudieron guardar las credenciales", e));
      });
      nuevo.ev.on("connection.update", (actualizacion) => {
        void manejarConexion(nuevo, actualizacion);
      });
      nuevo.ev.on("messages.upsert", (evento) => {
        void manejarMensajes(evento);
      });
    } catch (error) {
      log.error("No se pudo iniciar la conexión", error);
      sock = null;
      await actualizarCuenta({
        estado: "error",
        ultimo_error: mensajeDeError(error).slice(0, 500),
      });
      programarReconexion();
    }
  }

  async function procesarSalientes() {
    if (procesando || !sock || !conectado) return;
    procesando = true;
    try {
      const { data, error: e } = await sb
        .from("crm_mensajes")
        .select("id, contenido, caso:crm_casos(telefono)")
        .eq("canal", "whatsapp")
        .eq("direccion", "salida")
        .eq("estado_envio", "pendiente")
        .order("id")
        .limit(10);
      if (e) {
        log.error("No se pudieron leer los mensajes pendientes", e.message);
        return;
      }
      for (const mensaje of data) {
        if (!sock || !conectado) break;
        const telefono = mensaje.caso?.telefono;
        if (!telefono) {
          await sb
            .from("crm_mensajes")
            .update({ estado_envio: "fallido", error: "El caso no tiene teléfono" })
            .eq("id", mensaje.id);
          continue;
        }
        try {
          const enviado = await sock.sendMessage(jidDeTelefono(telefono), {
            text: mensaje.contenido,
          });
          await sb
            .from("crm_mensajes")
            .update({
              estado_envio: "enviado",
              id_externo: enviado?.key?.id ?? null,
              enviado_at: new Date().toISOString(),
              error: null,
            })
            .eq("id", mensaje.id);
          log.info("Mensaje enviado", { id: mensaje.id, telefono });
        } catch (error) {
          await sb
            .from("crm_mensajes")
            .update({ estado_envio: "fallido", error: mensajeDeError(error).slice(0, 500) })
            .eq("id", mensaje.id);
          log.error("No se pudo enviar un mensaje", error);
        }
      }
    } finally {
      procesando = false;
    }
  }

  async function revisarSenales() {
    const { data } = await sb
      .from("wa_cuentas")
      .select("reinicio_solicitado, cierre_solicitado")
      .eq("id", cuentaId)
      .maybeSingle();
    if (!data) return;
    if (data.cierre_solicitado) {
      await actualizarCuenta({ cierre_solicitado: false, reinicio_solicitado: false });
      log.info("Cierre de sesión solicitado desde el panel");
      const actual = sock;
      sock = null;
      conectado = false;
      try {
        await actual?.logout();
      } catch {
        // Si ya estaba cerrada, seguimos igual.
      }
      await auth?.limpiar();
      await actualizarCuenta({
        estado: "desconectado",
        qr: null,
        telefono: null,
        ultimo_error: null,
      });
      programarReconexion(1_000);
      return;
    }
    if (data.reinicio_solicitado) {
      await actualizarCuenta({ reinicio_solicitado: false });
      log.info("Reinicio solicitado desde el panel");
      const actual = sock;
      sock = null;
      conectado = false;
      try {
        actual?.end(undefined);
      } catch {
        // Ignorado.
      }
      reintentos = 0;
      programarReconexion(1_000);
    }
  }

  const intervalos = [
    setInterval(() => void procesarSalientes(), SALIENTES_CADA_MS),
    setInterval(() => void revisarSenales().catch((e) => log.error("señales", e)), SENALES_CADA_MS),
    setInterval(
      () => void actualizarCuenta({ visto_at: new Date().toISOString() }),
      LATIDO_CADA_MS,
    ),
  ];

  await actualizarCuenta({
    visto_at: new Date().toISOString(),
    reinicio_solicitado: false,
    cierre_solicitado: false,
  });
  await conectar();

  return async () => {
    deteniendo = true;
    for (const intervalo of intervalos) clearInterval(intervalo);
    try {
      sock?.end(undefined);
    } catch {
      // Ignorado.
    }
    await actualizarCuenta({ estado: "desconectado", qr: null });
  };
}
