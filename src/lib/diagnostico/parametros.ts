/**
 * Parámetros de negocio de la matriz de diagnóstico. Son los únicos números "mágicos" del
 * motor; cambiarlos aquí cambia los cálculos en todo el panel (requiere un despliegue).
 *
 * Origen: hoja "Listas" y fórmulas de la hoja "Diagnóstico Cliente" del Excel original.
 */

export type TarifaCentroConciliacion = {
  /** Pasivo total desde el que aplica la tarifa (inclusive). */
  desde: number;
  /** Límite superior orientativo del rango (exclusive). */
  hasta: number;
  valor: number;
};

export type ParametrosDiagnostico = {
  elegibilidad: {
    minimoObligacionesEnMora: number;
    minimoAcreedoresEnMora: number;
    umbralPasivoEnMora: number;
  };
  honorarios: {
    porcentajesSugeridos: readonly number[];
    porcentajePorDefecto: number;
    cuotasMaximas: number;
  };
  gastosProceso: { fijos: number; porObligacion: number };
  tarifasCentroConciliacion: readonly TarifaCentroConciliacion[];
};

export const PARAMETROS_DIAGNOSTICO: ParametrosDiagnostico = {
  /**
   * Elegibilidad preliminar (Ley 2445 de 2025): al menos dos obligaciones con más de 90 días de
   * mora, de al menos dos acreedores distintos, que sumen como mínimo este porcentaje del
   * pasivo total.
   */
  elegibilidad: {
    minimoObligacionesEnMora: 2,
    minimoAcreedoresEnMora: 2,
    /** Fracción del pasivo (0.3 = 30 %). */
    umbralPasivoEnMora: 0.3,
  },

  honorarios: {
    /** Porcentajes que ofrece la lista del Excel; el campo admite cualquier valor entre 0 y 100. */
    porcentajesSugeridos: [5, 6, 7, 8, 9, 10],
    porcentajePorDefecto: 5,
    // Debe coincidir con el check de cuotas_honorarios en la migración de la matriz.
    cuotasMaximas: 60,
  },

  /**
   * Gastos del proceso que se suman a los honorarios (radicación, notificaciones, etc.).
   *
   * El Excel calculaba `120.000 + 12.000 × COUNTA(B14:B35)`, pero ese rango es la columna de
   * numeración fija de la tabla (siempre 21 celdas), así que en la práctica sumaba 372.000 a
   * todos los casos; así se han cotizado las propuestas hasta ahora y así se conserva.
   * Si el criterio real es 12.000 por acreedor, usa `fijos: 120_000` y `porObligacion: 12_000`.
   */
  gastosProceso: {
    fijos: 372_000,
    porObligacion: 0,
  },

  /**
   * Tarifa del centro de conciliación según el pasivo total. Se aplica la fila con el mayor
   * `desde` que no supere el pasivo (como XLOOKUP con coincidencia "exacta o menor").
   */
  tarifasCentroConciliacion: [
    { desde: 0, hasta: 70_000_000, valor: 1_000_000 },
    { desde: 70_000_000, hasta: 120_000_000, valor: 1_500_000 },
    { desde: 120_000_000, hasta: 180_000_000, valor: 2_200_000 },
    { desde: 180_000_000, hasta: 250_000_000, valor: 3_000_000 },
    { desde: 250_000_000, hasta: 350_000_000, valor: 4_000_000 },
    { desde: 350_000_000, hasta: 500_000_000, valor: 5_500_000 },
    { desde: 500_000_000, hasta: 700_000_000, valor: 7_500_000 },
    { desde: 700_000_000, hasta: 1_000_000_000, valor: 10_000_000 },
  ],
};

/**
 * Tarifa del centro de conciliación para un pasivo. Devuelve también si el pasivo supera el
 * último rango definido (se aplica la última tarifa, pero conviene verificarla).
 */
export function tarifaCentroConciliacion(
  pasivoTotal: number,
  tarifas: readonly TarifaCentroConciliacion[] = PARAMETROS_DIAGNOSTICO.tarifasCentroConciliacion,
): { valor: number; fueraDeRango: boolean } {
  let aplicable: TarifaCentroConciliacion | undefined;
  for (const tarifa of tarifas) {
    if (tarifa.desde <= pasivoTotal && (!aplicable || tarifa.desde >= aplicable.desde)) {
      aplicable = tarifa;
    }
  }
  if (!aplicable) return { valor: 0, fueraDeRango: false };
  return { valor: aplicable.valor, fueraDeRango: pasivoTotal >= aplicable.hasta };
}
