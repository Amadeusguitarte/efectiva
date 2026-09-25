import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado de los secretos del CRM (claves de API, contraseñas de correo) antes de guardarlos en
 * `crm_ajustes.secreto`. AES-256-GCM con la clave de `CRM_CLAVE_CIFRADO`, que comparten la web y
 * el worker. Sin esa variable no se pueden guardar ni leer secretos.
 */

const ALGORITMO = "aes-256-gcm";
const VERSION = "v1";

/** Acepta 64 caracteres hexadecimales o 32 bytes en base64. Devuelve null si falta o no sirve. */
export function claveDesdeEntorno(valor = process.env.CRM_CLAVE_CIFRADO): Buffer | null {
  const limpio = valor?.trim();
  if (!limpio) return null;
  if (/^[0-9a-fA-F]{64}$/.test(limpio)) return Buffer.from(limpio, "hex");
  try {
    const bytes = Buffer.from(limpio, "base64");
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null;
  }
}

export function hayClaveCifrado(): boolean {
  return claveDesdeEntorno() !== null;
}

export function cifrar(texto: string, clave: Buffer): string {
  const iv = randomBytes(12);
  const cifrador = createCipheriv(ALGORITMO, clave, iv);
  const datos = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    etiqueta.toString("base64"),
    datos.toString("base64"),
  ].join(".");
}

export function descifrar(blob: string, clave: Buffer): string {
  const [version, iv, etiqueta, datos] = blob.split(".");
  if (version !== VERSION || !iv || !etiqueta || !datos) {
    throw new Error("Secreto con formato desconocido");
  }
  const descifrador = createDecipheriv(ALGORITMO, clave, Buffer.from(iv, "base64"));
  descifrador.setAuthTag(Buffer.from(etiqueta, "base64"));
  return Buffer.concat([
    descifrador.update(Buffer.from(datos, "base64")),
    descifrador.final(),
  ]).toString("utf8");
}

/** Genera una clave nueva (64 hex) para pegar en CRM_CLAVE_CIFRADO. */
export function generarClave(): string {
  return randomBytes(32).toString("hex");
}
