import type { Json } from "@/types/database";

import { INFO_PROVEEDOR_IA, esProveedorIA, type ProveedorIA } from "./ia";

/**
 * Lectura de las filas de `crm_ajustes` (jsonb) con tolerancia a datos incompletos. Módulo puro:
 * lo usan la web y el worker.
 */

export type FilaAjustes = { valor: Json; secreto: string | null; updated_at: string };

export type AjustesIa = {
  activo: boolean;
  proveedor: ProveedorIA;
  modelo: string;
  aplicarEtapaSugerida: boolean;
  tieneClave: boolean;
  actualizadoAt: string;
};

export type AjustesCorreo = {
  activo: boolean;
  remitenteNombre: string;
  remitenteEmail: string;
  usuario: string;
  smtpHost: string;
  smtpPuerto: number;
  smtpSeguro: boolean;
  imapHost: string;
  imapPuerto: number;
  imapSeguro: boolean;
  tieneContrasena: boolean;
  ultimoUid: number | null;
  ultimoError: string | null;
  revisadoAt: string | null;
  actualizadoAt: string;
};

type Objeto = Record<string, Json | undefined>;

export function objetoJson(json: Json | null | undefined): Objeto {
  return json && typeof json === "object" && !Array.isArray(json) ? json : {};
}

const texto = (valor: Json | undefined, porDefecto = "") =>
  typeof valor === "string" ? valor : porDefecto;
const numero = (valor: Json | undefined, porDefecto: number) =>
  typeof valor === "number" && Number.isFinite(valor) ? valor : porDefecto;
const booleano = (valor: Json | undefined) => valor === true;

const SIN_FECHA = new Date(0).toISOString();

export function leerAjustesIa(fila: FilaAjustes | null | undefined): AjustesIa {
  const v = objetoJson(fila?.valor);
  const proveedor = esProveedorIA(v.proveedor) ? v.proveedor : "openai";
  return {
    activo: booleano(v.activo),
    proveedor,
    modelo: texto(v.modelo, INFO_PROVEEDOR_IA[proveedor].modeloPorDefecto),
    aplicarEtapaSugerida: booleano(v.aplicar_etapa_sugerida),
    tieneClave: Boolean(fila?.secreto),
    actualizadoAt: fila?.updated_at ?? SIN_FECHA,
  };
}

export function leerAjustesCorreo(fila: FilaAjustes | null | undefined): AjustesCorreo {
  const v = objetoJson(fila?.valor);
  return {
    activo: booleano(v.activo),
    remitenteNombre: texto(v.remitente_nombre),
    remitenteEmail: texto(v.remitente_email),
    usuario: texto(v.usuario),
    smtpHost: texto(v.smtp_host),
    smtpPuerto: numero(v.smtp_puerto, 465),
    smtpSeguro: v.smtp_seguro === undefined ? true : booleano(v.smtp_seguro),
    imapHost: texto(v.imap_host),
    imapPuerto: numero(v.imap_puerto, 993),
    imapSeguro: v.imap_seguro === undefined ? true : booleano(v.imap_seguro),
    tieneContrasena: Boolean(fila?.secreto),
    ultimoUid: typeof v.ultimo_uid === "number" ? v.ultimo_uid : null,
    ultimoError: typeof v.ultimo_error === "string" ? v.ultimo_error : null,
    revisadoAt: typeof v.revisado_at === "string" ? v.revisado_at : null,
    actualizadoAt: fila?.updated_at ?? SIN_FECHA,
  };
}
