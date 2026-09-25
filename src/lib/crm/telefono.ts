/**
 * Teléfonos del CRM: se guardan solo con dígitos e indicativo (573001234567), que es el formato
 * que usa WhatsApp. Un celular colombiano de 10 dígitos recibe el 57 automáticamente.
 */
export function normalizarTelefono(valor: string | null | undefined): string | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (digitos.length === 10 && digitos.startsWith("3")) return `57${digitos}`;
  if (digitos.length >= 7 && digitos.length <= 15) return digitos;
  return null;
}

/** "573001234567" -> "+57 300 123 4567"; otros indicativos se muestran con espacios cada 3. */
export function formatearTelefono(digitos: string | null | undefined): string {
  if (!digitos) return "";
  if (digitos.length === 12 && digitos.startsWith("57")) {
    return `+57 ${digitos.slice(2, 5)} ${digitos.slice(5, 8)} ${digitos.slice(8)}`;
  }
  return `+${digitos.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
}

/** JID de WhatsApp de un teléfono normalizado. */
export function jidDeTelefono(digitos: string): string {
  return `${digitos}@s.whatsapp.net`;
}

/** Teléfono a partir de un JID de WhatsApp (573001234567@s.whatsapp.net); null si no es personal. */
export function telefonoDeJid(jid: string | null | undefined): string | null {
  if (!jid) return null;
  const [usuario, servidor] = jid.split("@");
  if (servidor !== "s.whatsapp.net" || !usuario) return null;
  return normalizarTelefono(usuario.split(":")[0]);
}
