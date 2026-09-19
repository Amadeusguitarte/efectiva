import {
  CLASE_ESPERADA_POR_GARANTIA,
  INFO_CLASE,
  INFO_TIPO_GARANTIA,
  SERVICIOS_CON_CENTRO_OBLIGATORIO,
  VALORES_CLASE,
  type ClaseCredito,
  type EstadoCivil,
  type MoraObligacion,
  type TipoGarantia,
  type TipoServicio,
} from "./catalogos";
import {
  PARAMETROS_DIAGNOSTICO,
  tarifaCentroConciliacion,
  type ParametrosDiagnostico,
} from "./parametros";

/**
 * Motor de la matriz de diagnóstico. Función pura: recibe lo que el equipo registra en la
 * reunión con el cliente y devuelve todos los indicadores que antes calculaba el Excel
 * (pasivo, elegibilidad, honorarios, centro de conciliación, costo del proceso) más las
 * alertas de inconsistencia que el prompt de la propuesta exige revisar.
 *
 * Se ejecuta tanto en el servidor como en el navegador (vista previa en vivo del formulario).
 */

export type ObligacionEntrada = {
  acreedor: string;
  concepto: string | null;
  capital: number;
  intereses: number;
  mora: MoraObligacion;
  diasMora: number | null;
  descuentoNomina: boolean;
  tipoGarantia: TipoGarantia;
  clase: ClaseCredito;
};

export type DiagnosticoEntrada = {
  ocupacion: string | null;
  ingresosMensuales: number | null;
  gastosMensuales: number | null;
  bienes: string | null;
  estadoCivil: EstadoCivil | null;
  tipoServicio: TipoServicio | null;
  /** Porcentaje de honorarios sobre el pasivo (5 = 5 %). */
  porcentajeHonorarios: number;
  cuotasHonorarios: number;
  requiereCentroConciliacion: boolean;
  descuentoCentroConciliacion: number;
  observacionesJuridicas: string | null;
  situacionUrgencia: string | null;
  objetivoCliente: string | null;
  obligaciones: ObligacionEntrada[];
};

export type ObligacionCalculada = ObligacionEntrada & {
  /** Posición en la tabla, desde 1. */
  numero: number;
  total: number;
  /** Fracción del pasivo total (0.87 = 87 %). */
  porcentajePasivo: number;
};

export type EstadoElegibilidad = "elegible" | "no_elegible" | "sin_datos";

export type CodigoAlerta =
  | "sin_obligaciones"
  | "sin_tipo_servicio"
  | "acuerdo_sin_centro"
  | "descuento_supera_tarifa"
  | "pasivo_fuera_de_tarifas"
  | "honorarios_cero"
  | "obligacion_sin_valor"
  | "obligacion_garantia_clase"
  | "obligacion_por_verificar"
  | "obligacion_mora_dias";

export type Alerta = {
  codigo: CodigoAlerta;
  /** "error": impide generar la propuesta; "aviso": conviene revisar. */
  nivel: "error" | "aviso";
  mensaje: string;
  /** Número de la obligación afectada, si aplica. */
  obligacion?: number;
};

export type ResumenClase = { cantidad: number; total: number; porcentajePasivo: number };

export type ResultadoDiagnostico = {
  obligaciones: ObligacionCalculada[];
  pasivoTotal: number;
  numeroObligaciones: number;
  /** Ingresos menos gastos mensuales; null si falta alguno. */
  excedenteMensual: number | null;
  resumenPorClase: Record<ClaseCredito, ResumenClase>;
  elegibilidad: {
    estado: EstadoElegibilidad;
    obligacionesEnMora: number;
    acreedoresEnMora: number;
    pasivoEnMora: number;
    /** Fracción del pasivo con mora mayor a 90 días. */
    porcentajeEnMora: number;
    cumple: { obligaciones: boolean; acreedores: boolean; porcentaje: boolean };
  };
  honorarios: { porcentaje: number; valor: number; cuotas: number; valorCuota: number };
  centroConciliacion: {
    /** El tipo de servicio lo exige (acuerdos de pago). */
    obligatorio: boolean;
    /** Se cobra en este caso. */
    aplica: boolean;
    tarifa: number;
    descuento: number;
    /** Tarifa menos descuento (nunca negativo). */
    valor: number;
  };
  gastosProceso: number;
  costoProceso: number;
  alertas: Alerta[];
};

const MORA_MAYOR_90: MoraObligacion = "mas_90_dias";

const redondearPesos = (valor: number) => Math.round(valor);

/** Clave para comparar acreedores: sin tildes, espacios repetidos ni mayúsculas. */
export function claveAcreedor(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Categoría de mora que corresponde a un número de días. */
export function moraSegunDias(dias: number): MoraObligacion {
  if (dias > 90) return "mas_90_dias";
  if (dias > 0) return "menos_90_dias";
  return "al_dia";
}

export function calcularDiagnostico(
  entrada: DiagnosticoEntrada,
  parametros: ParametrosDiagnostico = PARAMETROS_DIAGNOSTICO,
): ResultadoDiagnostico {
  const alertas: Alerta[] = [];

  const obligacionesConTotal = entrada.obligaciones.map((obligacion, indice) => ({
    ...obligacion,
    numero: indice + 1,
    total: obligacion.capital + obligacion.intereses,
  }));
  const pasivoTotal = obligacionesConTotal.reduce((suma, o) => suma + o.total, 0);
  const fraccion = (valor: number) => (pasivoTotal > 0 ? valor / pasivoTotal : 0);

  // El porcentaje de cada deuda se calcula sobre el total (capital + intereses); el Excel
  // usaba solo el capital, con lo que los porcentajes no sumaban 100 % si había intereses.
  const obligaciones: ObligacionCalculada[] = obligacionesConTotal.map((o) => ({
    ...o,
    porcentajePasivo: fraccion(o.total),
  }));

  // --- Alertas por obligación --------------------------------------------------------------
  for (const o of obligaciones) {
    if (o.total <= 0) {
      alertas.push({
        codigo: "obligacion_sin_valor",
        nivel: "aviso",
        obligacion: o.numero,
        mensaje: `La obligación ${o.numero} (${o.acreedor}) no tiene valor adeudado.`,
      });
    }
    const claseEsperada = CLASE_ESPERADA_POR_GARANTIA[o.tipoGarantia];
    const claseDePreferencia = o.clase === "segunda" || o.clase === "tercera";
    if (
      (claseEsperada && o.clase !== claseEsperada && o.clase !== "por_verificar") ||
      (o.tipoGarantia === "sin_garantia" && claseDePreferencia)
    ) {
      alertas.push({
        codigo: "obligacion_garantia_clase",
        nivel: "aviso",
        obligacion: o.numero,
        mensaje: `Obligación ${o.numero} (${o.acreedor}): la garantía "${INFO_TIPO_GARANTIA[o.tipoGarantia].etiqueta}" no suele corresponder a la clase ${INFO_CLASE[o.clase].etiqueta.toLowerCase()}.`,
      });
    }
    if (o.clase === "por_verificar" || o.tipoGarantia === "otra_verificar") {
      alertas.push({
        codigo: "obligacion_por_verificar",
        nivel: "aviso",
        obligacion: o.numero,
        mensaje: `Obligación ${o.numero} (${o.acreedor}): clase o garantía pendientes de verificar.`,
      });
    }
    if (o.diasMora !== null && moraSegunDias(o.diasMora) !== o.mora) {
      alertas.push({
        codigo: "obligacion_mora_dias",
        nivel: "aviso",
        obligacion: o.numero,
        mensaje: `Obligación ${o.numero} (${o.acreedor}): ${o.diasMora} días de mora no coinciden con la categoría de mora seleccionada.`,
      });
    }
  }

  // --- Resumen por clase ---------------------------------------------------------------------
  const resumenPorClase = Object.fromEntries(
    VALORES_CLASE.map((clase) => {
      const deLaClase = obligaciones.filter((o) => o.clase === clase);
      const total = deLaClase.reduce((suma, o) => suma + o.total, 0);
      return [clase, { cantidad: deLaClase.length, total, porcentajePasivo: fraccion(total) }];
    }),
  ) as Record<ClaseCredito, ResumenClase>;

  // --- Elegibilidad preliminar ---------------------------------------------------------------
  const enMora = obligaciones.filter((o) => o.mora === MORA_MAYOR_90);
  const pasivoEnMora = enMora.reduce((suma, o) => suma + o.total, 0);
  const acreedoresEnMora = new Set(enMora.map((o) => claveAcreedor(o.acreedor))).size;
  const porcentajeEnMora = fraccion(pasivoEnMora);
  const { elegibilidad: reglas } = parametros;
  const cumple = {
    obligaciones: enMora.length >= reglas.minimoObligacionesEnMora,
    acreedores: acreedoresEnMora >= reglas.minimoAcreedoresEnMora,
    // Tolerancia para que 30 % exacto no falle por redondeo binario.
    porcentaje: porcentajeEnMora >= reglas.umbralPasivoEnMora - 1e-9,
  };
  const estadoElegibilidad: EstadoElegibilidad =
    pasivoTotal <= 0
      ? "sin_datos"
      : cumple.obligaciones && cumple.acreedores && cumple.porcentaje
        ? "elegible"
        : "no_elegible";

  // --- Honorarios ----------------------------------------------------------------------------
  const valorHonorarios = redondearPesos((pasivoTotal * entrada.porcentajeHonorarios) / 100);
  const cuotas = Math.max(1, Math.trunc(entrada.cuotasHonorarios));
  const honorarios = {
    porcentaje: entrada.porcentajeHonorarios,
    valor: valorHonorarios,
    cuotas,
    valorCuota: redondearPesos(valorHonorarios / cuotas),
  };

  // --- Centro de conciliación ----------------------------------------------------------------
  const obligatorio =
    entrada.tipoServicio !== null &&
    SERVICIOS_CON_CENTRO_OBLIGATORIO.includes(entrada.tipoServicio);
  const aplica =
    obligatorio ||
    (entrada.tipoServicio === "liquidacion_patrimonial" && entrada.requiereCentroConciliacion);
  const tarifa = tarifaCentroConciliacion(pasivoTotal, parametros.tarifasCentroConciliacion);
  const descuento = entrada.descuentoCentroConciliacion;
  const centroConciliacion = {
    obligatorio,
    aplica,
    tarifa: tarifa.valor,
    descuento,
    valor: Math.max(0, tarifa.valor - descuento),
  };

  // --- Gastos y costo total del proceso ------------------------------------------------------
  const gastosProceso =
    parametros.gastosProceso.fijos + parametros.gastosProceso.porObligacion * obligaciones.length;
  const costoProceso =
    honorarios.valor + gastosProceso + (centroConciliacion.aplica ? centroConciliacion.valor : 0);

  // --- Alertas generales ---------------------------------------------------------------------
  if (obligaciones.length === 0) {
    alertas.push({
      codigo: "sin_obligaciones",
      nivel: "error",
      mensaje: "Registra las obligaciones del cliente para calcular el diagnóstico.",
    });
  }
  if (entrada.tipoServicio === null) {
    alertas.push({
      codigo: "sin_tipo_servicio",
      nivel: "error",
      mensaje: "Selecciona el tipo de servicio para definir la estrategia y el costo del proceso.",
    });
  }
  if (obligatorio && !entrada.requiereCentroConciliacion) {
    alertas.push({
      codigo: "acuerdo_sin_centro",
      nivel: "error",
      mensaje:
        "El acuerdo de pago requiere centro de conciliación: marca la opción o cambia el tipo de servicio.",
    });
  }
  if (aplica && descuento > tarifa.valor) {
    alertas.push({
      codigo: "descuento_supera_tarifa",
      nivel: "error",
      mensaje:
        "El descuento del centro de conciliación supera la tarifa que corresponde al pasivo.",
    });
  }
  if (aplica && tarifa.fueraDeRango) {
    alertas.push({
      codigo: "pasivo_fuera_de_tarifas",
      nivel: "aviso",
      mensaje:
        "El pasivo supera el último rango de tarifas del centro de conciliación; verifica el valor con el centro.",
    });
  }
  if (pasivoTotal > 0 && entrada.porcentajeHonorarios <= 0) {
    alertas.push({
      codigo: "honorarios_cero",
      nivel: "aviso",
      mensaje: "El porcentaje de honorarios es 0 %.",
    });
  }

  return {
    obligaciones,
    pasivoTotal,
    numeroObligaciones: obligaciones.length,
    excedenteMensual:
      entrada.ingresosMensuales !== null && entrada.gastosMensuales !== null
        ? entrada.ingresosMensuales - entrada.gastosMensuales
        : null,
    resumenPorClase,
    elegibilidad: {
      estado: estadoElegibilidad,
      obligacionesEnMora: enMora.length,
      acreedoresEnMora,
      pasivoEnMora,
      porcentajeEnMora,
      cumple,
    },
    honorarios,
    centroConciliacion,
    gastosProceso,
    costoProceso,
    alertas: alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === "error" ? -1 : 1)),
  };
}

/** Entrada vacía para un cliente sin diagnóstico. */
export function diagnosticoVacio(): DiagnosticoEntrada {
  return {
    ocupacion: null,
    ingresosMensuales: null,
    gastosMensuales: null,
    bienes: null,
    estadoCivil: null,
    tipoServicio: null,
    porcentajeHonorarios: PARAMETROS_DIAGNOSTICO.honorarios.porcentajePorDefecto,
    cuotasHonorarios: 1,
    requiereCentroConciliacion: false,
    descuentoCentroConciliacion: 0,
    observacionesJuridicas: null,
    situacionUrgencia: null,
    objetivoCliente: null,
    obligaciones: [],
  };
}

export function obligacionVacia(): ObligacionEntrada {
  return {
    acreedor: "",
    concepto: null,
    capital: 0,
    intereses: 0,
    mora: "al_dia",
    diasMora: null,
    descuentoNomina: false,
    tipoGarantia: "sin_garantia",
    clase: "quinta",
  };
}
