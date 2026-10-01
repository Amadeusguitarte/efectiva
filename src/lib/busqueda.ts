/**
 * Búsquedas de texto en la base de datos (filtros `or` de PostgREST con `ilike`). Lo usan las
 * capas de datos del panel y del CRM.
 */

/** Limpia el texto para usarlo como valor entrecomillado en un filtro `or` de PostgREST. */
export function textoBusqueda(valor: string): string {
  return valor
    .replace(/[,()*%"\\]/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Hay algo escrito, pero solo caracteres que `textoBusqueda()` quita (p. ej. «,,,» o «()»): no
 * queda nada que buscar y ningún registro puede coincidir. Sin esta comprobación, la consulta
 * saldría sin filtro y devolvería todos los registros como si coincidieran.
 */
export function soloCaracteresIgnorados(valor: string): boolean {
  return valor.trim() !== "" && textoBusqueda(valor) === "";
}

/**
 * Filtro `or` de PostgREST que busca el texto (sin distinguir mayúsculas) dentro de cualquiera de
 * las columnas. Devuelve null si después de limpiarlo no queda texto.
 */
export function filtroBusqueda(columnas: readonly string[], valor: string): string | null {
  const termino = textoBusqueda(valor);
  if (!termino) return null;
  // En `ilike`, `_` es el comodín de un carácter: se escapa para buscarlo tal cual. Dentro del
  // valor entrecomillado de PostgREST, `\\_` llega a la base de datos como `\_` (guion bajo
  // literal). Es seguro porque `textoBusqueda()` ya quitó las barras invertidas del usuario.
  const patron = `"*${termino.replace(/_/g, "\\\\_")}*"`;
  return columnas.map((columna) => `${columna}.ilike.${patron}`).join(",");
}
