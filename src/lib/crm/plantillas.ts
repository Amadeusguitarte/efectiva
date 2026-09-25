/** Reemplaza los marcadores de los correos automáticos ({{nombre}}, {{etapa}}). */
export function reemplazarPlantilla(
  texto: string,
  valores: { nombre: string; etapa: string },
): string {
  return texto.replaceAll("{{nombre}}", valores.nombre).replaceAll("{{etapa}}", valores.etapa);
}

/** Primer renglón no vacío de un texto, recortado, para listas y notificaciones. */
export function resumirTexto(texto: string, maximo = 90): string {
  const linea = texto.replace(/\s+/g, " ").trim();
  return linea.length > maximo ? `${linea.slice(0, maximo - 1)}…` : linea;
}
