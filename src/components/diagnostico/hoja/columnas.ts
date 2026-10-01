import type { CSSProperties } from "react";

import type { ClaseCredito } from "@/lib/diagnostico/catalogos";

/**
 * Columnas B a M de la hoja «Diagnóstico Cliente», con anchos proporcionales a los del Excel.
 * La parte superior (datos e indicadores) y las tablas comparten estas columnas para que todo
 * quede alineado como en la hoja original.
 */
export const LETRAS = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] as const;
export type Letra = (typeof LETRAS)[number];

export const ANCHOS: Record<Letra, number> = {
  B: 112,
  C: 200,
  D: 150,
  E: 124,
  F: 150,
  G: 112,
  H: 128,
  I: 116,
  J: 76,
  K: 92,
  L: 152,
  M: 108,
};

export const ANCHO_HOJA = LETRAS.reduce((total, letra) => total + ANCHOS[letra], 0);

export const PLANTILLA_COLUMNAS = LETRAS.map((letra) => `${ANCHOS[letra]}px`).join(" ");

/** Ancho total de un rango de columnas (por ejemplo B a E). */
export function anchoRango(desde: Letra, hasta: Letra): number {
  const inicio = LETRAS.indexOf(desde);
  const fin = LETRAS.indexOf(hasta);
  return LETRAS.slice(inicio, fin + 1).reduce((total, letra) => total + ANCHOS[letra], 0);
}

/** Posición en la cuadrícula de la parte superior: columnas por letra y filas del Excel. */
export function ubicar(desde: Letra, hasta: Letra, filaDesde: number, filaHasta = filaDesde) {
  return {
    gridColumn: `${LETRAS.indexOf(desde) + 1} / ${LETRAS.indexOf(hasta) + 2}`,
    gridRow: `${filaDesde} / ${filaHasta + 1}`,
  } satisfies CSSProperties;
}

/** Colores del formato condicional de la columna CLASE. */
export const FONDO_CLASE: Record<ClaseCredito, string> = {
  primera: "bg-clase-primera",
  segunda: "bg-clase-segunda",
  tercera: "bg-clase-tercera",
  cuarta: "bg-clase-cuarta",
  quinta: "bg-clase-quinta",
  por_verificar: "bg-clase-por-verificar",
};
