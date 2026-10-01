import type { EstadoPropuesta } from "@/lib/propuestas/estados";

/**
 * Lógica pura del selector «Cambiar de cliente» de la matriz de diagnóstico: los datos mínimos de
 * cada cliente, el orden por actividad reciente y la navegación con el teclado.
 */

/** Clientes que muestra el selector, sin texto (los más recientes) o por búsqueda. */
export const LIMITE_CLIENTES_SELECTOR = 8;

/** Lo único que llega al navegador de cada cliente. */
export type ClienteSelector = {
  id: string;
  nombre: string;
  /** Dato secundario: documento, correo o teléfono. */
  detalle: string;
  estadoPropuesta: EstadoPropuesta | null;
  tieneMatriz: boolean;
};

export type ResultadoBusquedaClientes =
  { ok: true; clientes: ClienteSelector[] } | { ok: false; mensaje: string };

type ContactoCliente = {
  nombre: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  email: string;
  telefono: string | null;
};

/**
 * Dato secundario de un cliente: el documento y, a falta de él, el correo. Si el término no está
 * en el nombre ni en el documento, el cliente apareció por su correo o su teléfono y se muestra
 * ese dato, para que se vea por qué apareció.
 */
export function detalleCliente(cliente: ContactoCliente, termino = ""): string {
  const numero = cliente.numeroDocumento?.trim() || null;
  const documento = numero ? [cliente.tipoDocumento, numero].filter(Boolean).join(" ") : null;
  const porDefecto = documento ?? cliente.email;
  const buscado = termino.trim().toLowerCase();
  if (!buscado) return porDefecto;

  const contiene = (valor: string | null) => !!valor && valor.toLowerCase().includes(buscado);
  if (contiene(cliente.nombre) || contiene(numero)) return porDefecto;
  if (contiene(cliente.email)) return cliente.email;
  if (cliente.telefono && contiene(cliente.telefono)) return cliente.telefono;
  return porDefecto;
}

/** Fecha más reciente (en milisegundos) entre las de un cliente; 0 si no hay ninguna válida. */
export function ultimaActividad(...fechas: (string | null | undefined)[]): number {
  return fechas.reduce<number>((mayor, fecha) => {
    const valor = fecha ? Date.parse(fecha) : Number.NaN;
    return Number.isNaN(valor) ? mayor : Math.max(mayor, valor);
  }, 0);
}

/**
 * Une varias listas de clientes sin repetirlos y deja los `limite` de actividad más reciente.
 * Sirve para ordenar por la mayor de varias fechas: los N más recientes según la mayor fecha
 * siempre están entre los N primeros de la lista ordenada por alguna de ellas.
 */
export function masRecientes<T extends { id: string; actividad: number }>(
  listas: readonly (readonly T[])[],
  limite: number,
): T[] {
  const porId = new Map<string, T>();
  for (const lista of listas) {
    for (const cliente of lista) {
      if (!porId.has(cliente.id)) porId.set(cliente.id, cliente);
    }
  }
  return [...porId.values()].sort((a, b) => b.actividad - a.actividad).slice(0, limite);
}

/**
 * Opción activa tras pulsar flecha abajo (`paso` 1) o arriba (`paso` -1): al pasar del último se
 * vuelve al primero y viceversa. -1 si no hay opciones.
 */
export function moverIndice(actual: number, total: number, paso: 1 | -1): number {
  if (total <= 0) return -1;
  if (actual < 0 || actual >= total) return paso === 1 ? 0 : total - 1;
  return (actual + paso + total) % total;
}
