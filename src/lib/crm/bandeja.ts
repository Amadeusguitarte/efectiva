import type { Route } from "next";

import type { CanalCrm, DireccionMensaje } from "./catalogos";

/**
 * Reglas de los inbox del CRM (chat y correo), como en Kommo: cada inbox muestra solo las
 * conversaciones de su canal, con filtros y, en el correo, carpetas Recibidos / Enviados.
 * Lógica pura: la usan la capa de datos, los contadores del menú y las pruebas.
 */

export const FILTROS_BANDEJA = ["todos", "sin_responder", "mios", "sin_asignar"] as const;
export type FiltroBandeja = (typeof FILTROS_BANDEJA)[number];

export const CARPETAS_CORREO = ["recibidos", "enviados"] as const;
export type CarpetaCorreo = (typeof CARPETAS_CORREO)[number];

export const INFO_CARPETA_CORREO: Record<CarpetaCorreo, string> = {
  recibidos: "Recibidos",
  enviados: "Enviados",
};

/** Lo que define la vista de un inbox en la URL. */
export type EstadoBandeja = {
  canal: CanalCrm;
  busqueda: string;
  filtro: FiltroBandeja;
  /** Solo en el inbox de correo. */
  carpeta: CarpetaCorreo | null;
};

/**
 * URL del inbox con la búsqueda, el filtro, la carpeta y la conversación abierta. Los valores por
 * defecto no se escriben, para que las URL queden limpias.
 */
export function urlBandeja(
  estado: EstadoBandeja,
  cambios: Partial<EstadoBandeja> & { caso?: string | null } = {},
): Route {
  const final = { ...estado, ...cambios };
  const parametros = new URLSearchParams();
  if (final.busqueda) parametros.set("q", final.busqueda);
  if (final.filtro !== "todos") parametros.set("filtro", final.filtro);
  if (final.canal === "correo" && final.carpeta === "enviados")
    parametros.set("carpeta", "enviados");
  if (cambios.caso) parametros.set("caso", cambios.caso);
  const consulta = parametros.toString();
  return `/admin/crm/${final.canal}${consulta ? `?${consulta}` : ""}` as Route;
}

/** Lee el filtro de la URL con lista blanca; cualquier otro valor equivale a «todos». */
export function leerFiltroBandeja(valor: unknown): FiltroBandeja {
  return (FILTROS_BANDEJA as readonly unknown[]).includes(valor)
    ? (valor as FiltroBandeja)
    : "todos";
}

/** Lee la carpeta del inbox de correo de la URL; por defecto, «recibidos». */
export function leerCarpetaCorreo(valor: unknown): CarpetaCorreo {
  return valor === "enviados" ? "enviados" : "recibidos";
}

/** Nombre del filtro tal como se ve en el chip verde de la lista. */
export function etiquetaFiltroBandeja(canal: CanalCrm, filtro: FiltroBandeja): string {
  switch (filtro) {
    case "todos":
      // En el CRM las conversaciones no se cierran: «abiertos» son todos, como en Kommo.
      return canal === "whatsapp" ? "Chats abiertos" : "Correos abiertos";
    case "sin_responder":
      return "Sin responder";
    case "mios":
      return "Asignados a mí";
    case "sin_asignar":
      return "Sin asignar";
  }
}

/**
 * ¿La conversación del caso va en el inbox de este canal? Sí si tiene al menos un mensaje del
 * canal o si el caso llegó por él (casos nuevos todavía sin mensajes).
 */
export function enBandeja(
  canal: CanalCrm,
  caso: { origen: CanalCrm | null; ultimoDelCanal: { direccion: DireccionMensaje } | null },
): boolean {
  return caso.ultimoDelCanal !== null || caso.origen === canal;
}

/** Sin responder en un canal: el último mensaje de ese canal lo escribió el contacto. */
export function sinResponderEnCanal(
  ultimoDelCanal: { direccion: DireccionMensaje } | null,
): boolean {
  return ultimoDelCanal?.direccion === "entrada";
}

export type ConversacionFiltrable = {
  sinResponder: boolean;
  responsableId: string | null;
  /** Dirección del último mensaje del canal; null si todavía no hay mensajes. */
  ultimaDireccion: DireccionMensaje | null;
};

/**
 * Aplica el filtro del chip (todos, sin responder, asignados a mí, sin asignar) y, en el inbox de
 * correo, la carpeta: Recibidos (el último correo llegó o aún no hay) o Enviados (el último correo
 * lo envió el equipo).
 */
export function filtrarConversaciones<T extends ConversacionFiltrable>(
  conversaciones: readonly T[],
  opciones: { filtro: FiltroBandeja; usuarioId: string; carpeta?: CarpetaCorreo | null },
): T[] {
  return conversaciones.filter((conversacion) => {
    if (opciones.carpeta === "recibidos" && conversacion.ultimaDireccion === "salida") return false;
    if (opciones.carpeta === "enviados" && conversacion.ultimaDireccion !== "salida") return false;
    switch (opciones.filtro) {
      case "sin_responder":
        return conversacion.sinResponder;
      case "mios":
        return conversacion.responsableId === opciones.usuarioId;
      case "sin_asignar":
        return conversacion.responsableId === null;
      default:
        return true;
    }
  });
}

/**
 * Contadores rojos del menú: conversaciones cuyo último mensaje de cada canal es de entrada.
 * Recibe, por caso, el último mensaje de WhatsApp y el último correo.
 */
export function contarSinResponder(
  casos: readonly {
    whatsapp: { direccion: DireccionMensaje } | null;
    correo: { direccion: DireccionMensaje } | null;
  }[],
): { chat: number; correo: number } {
  let chat = 0;
  let correo = 0;
  for (const caso of casos) {
    if (sinResponderEnCanal(caso.whatsapp)) chat += 1;
    if (sinResponderEnCanal(caso.correo)) correo += 1;
  }
  return { chat, correo };
}

/** Prefijo del último mensaje en la lista: «Tú:» si lo envió quien mira, o el nombre del agente. */
export function prefijoAutor(
  ultimo: { direccion: DireccionMensaje; autorId: string | null; autor: string | null },
  usuarioId: string,
): string | null {
  if (ultimo.direccion === "entrada") return null;
  if (ultimo.autorId === usuarioId) return "Tú";
  return ultimo.autor?.trim().split(/\s+/)[0] || "Equipo";
}
