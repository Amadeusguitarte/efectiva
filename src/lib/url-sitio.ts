/**
 * Normaliza la URL pública del sitio tal como llega de la configuración del host:
 * añade `https://` si falta el esquema y quita barras finales. Devuelve undefined si está vacía,
 * para que aplique el valor por defecto.
 */
export function normalizarUrlSitio(valor: string | undefined): string | undefined {
  const limpio = valor?.trim();
  if (!limpio) return undefined;
  const conEsquema = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
  return conEsquema.replace(/\/+$/, "");
}
