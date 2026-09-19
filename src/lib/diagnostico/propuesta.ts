import { formatearPesos, formatearPorcentajeHonorarios } from "@/lib/formato";

import type {
  Alerta,
  DiagnosticoEntrada,
  EstadoElegibilidad,
  ResultadoDiagnostico,
} from "./calcular";
import {
  INFO_CLASE,
  INFO_ESTADO_CIVIL,
  INFO_MORA,
  INFO_TIPO_GARANTIA,
  INFO_TIPO_SERVICIO,
} from "./catalogos";

/**
 * "Datos para la propuesta": equivale a la hoja DATOS PROPUESTA del Excel, que el equipo
 * imprimía en PDF para redactar la propuesta. Es la fuente única que consumirán la vista
 * imprimible del panel y, en la siguiente fase, el generador de propuestas con IA.
 *
 * Las etiquetas son las que espera el prompt de la propuesta (clase en mayúsculas, "> 90 días",
 * "Sin garantía", "SI"/"NO").
 */

export type Acreencia = {
  clase: string;
  acreedor: string;
  concepto: string;
  valorAdeudado: number;
  tipoGarantia: string;
  mora: string;
};

export type DatosPropuesta = {
  cliente: {
    nombre: string;
    ocupacion: string | null;
    ingresosMensuales: number | null;
    gastosMensuales: number | null;
    bienes: string | null;
    estadoCivil: string | null;
  };
  pasivoTotal: number;
  elegibilidad: { estado: EstadoElegibilidad; etiqueta: string };
  acreencias: Acreencia[];
  obligacionesConMoraMayor90: number;
  observacionesJuridicas: string | null;
  situacionUrgencia: string | null;
  objetivoCliente: string | null;
  contrato: {
    tipoServicio: string | null;
    porcentajeHonorarios: number;
    valorHonorarios: number;
    costoProceso: number;
    cuotasHonorarios: number;
    valorCuota: number;
    requiereCentroConciliacion: boolean;
    /** Valor neto del centro (tarifa menos descuento); 0 si no aplica. */
    valorCentroConciliacion: number;
  };
  alertas: Alerta[];
  /** Sin alertas de nivel "error": la propuesta puede redactarse. */
  listaParaPropuesta: boolean;
};

export const ETIQUETA_ELEGIBILIDAD: Record<EstadoElegibilidad, string> = {
  elegible: "ELEGIBLE",
  no_elegible: "NO ELEGIBLE",
  sin_datos: "SIN DATOS",
};

/** Encabezado que exige el prompt cuando hay inconsistencias sin resolver. */
export const TEXTO_REQUIERE_REVISION = "REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA";

export function construirDatosPropuesta(
  nombreCliente: string,
  entrada: DiagnosticoEntrada,
  resultado: ResultadoDiagnostico,
): DatosPropuesta {
  const { centroConciliacion, honorarios } = resultado;
  return {
    cliente: {
      nombre: nombreCliente,
      ocupacion: entrada.ocupacion,
      ingresosMensuales: entrada.ingresosMensuales,
      gastosMensuales: entrada.gastosMensuales,
      bienes: entrada.bienes,
      estadoCivil: entrada.estadoCivil ? INFO_ESTADO_CIVIL[entrada.estadoCivil].etiqueta : null,
    },
    pasivoTotal: resultado.pasivoTotal,
    elegibilidad: {
      estado: resultado.elegibilidad.estado,
      etiqueta: ETIQUETA_ELEGIBILIDAD[resultado.elegibilidad.estado],
    },
    acreencias: resultado.obligaciones
      .filter((o) => o.acreedor.trim() !== "")
      .map((o) => ({
        clase: INFO_CLASE[o.clase].etiquetaPropuesta,
        acreedor: o.acreedor.trim(),
        concepto: o.concepto?.trim() ?? "",
        valorAdeudado: o.total,
        tipoGarantia: INFO_TIPO_GARANTIA[o.tipoGarantia].etiquetaPropuesta,
        mora: INFO_MORA[o.mora].etiquetaPropuesta,
      })),
    obligacionesConMoraMayor90: resultado.elegibilidad.obligacionesEnMora,
    observacionesJuridicas: entrada.observacionesJuridicas,
    situacionUrgencia: entrada.situacionUrgencia,
    objetivoCliente: entrada.objetivoCliente,
    contrato: {
      tipoServicio: entrada.tipoServicio
        ? INFO_TIPO_SERVICIO[entrada.tipoServicio].etiquetaPropuesta
        : null,
      porcentajeHonorarios: honorarios.porcentaje,
      valorHonorarios: honorarios.valor,
      costoProceso: resultado.costoProceso,
      cuotasHonorarios: honorarios.cuotas,
      valorCuota: honorarios.valorCuota,
      requiereCentroConciliacion: centroConciliacion.aplica,
      valorCentroConciliacion: centroConciliacion.aplica ? centroConciliacion.valor : 0,
    },
    alertas: resultado.alertas,
    listaParaPropuesta: !resultado.alertas.some((a) => a.nivel === "error"),
  };
}

const sinDato = "—";
const pesosONada = (valor: number | null) => (valor === null ? sinDato : formatearPesos(valor));

/**
 * Versión en texto plano de los datos para la propuesta, con la misma estructura que el PDF
 * que se entregaba a la IA. Sirve para copiar y, en la siguiente fase, como contexto del prompt.
 */
export function datosPropuestaComoTexto(datos: DatosPropuesta): string {
  const { cliente, contrato } = datos;
  const errores = datos.alertas.filter((a) => a.nivel === "error");
  const lineas: string[] = [
    ...(errores.length > 0
      ? [TEXTO_REQUIERE_REVISION, ...errores.map((a) => `- ${a.mensaje}`), ""]
      : []),
    "DATOS PROPUESTA",
    "",
    "1. DATOS DEL CLIENTE",
    `Nombre: ${cliente.nombre}`,
    `Ocupación: ${cliente.ocupacion ?? sinDato}`,
    `Ingresos mensuales: ${pesosONada(cliente.ingresosMensuales)}`,
    `Gastos mensuales aproximados: ${pesosONada(cliente.gastosMensuales)}`,
    `Bienes a nombre del deudor: ${cliente.bienes ?? sinDato}`,
    `Estado civil: ${cliente.estadoCivil ?? sinDato}`,
    `Pasivo total: ${formatearPesos(datos.pasivoTotal)}`,
    `Elegibilidad del deudor: ${datos.elegibilidad.etiqueta}`,
    "",
    "2. DEUDAS DEL CLIENTE",
    "CLASE | ACREEDOR | CONCEPTO | VR. ADEUDADO | TIPO DE GARANTÍA | MORA",
    ...datos.acreencias.map(
      (a) =>
        `${a.clase} | ${a.acreedor} | ${a.concepto || sinDato} | ${formatearPesos(a.valorAdeudado)} | ${a.tipoGarantia} | ${a.mora}`,
    ),
    `TOTAL: ${formatearPesos(datos.pasivoTotal)}`,
    `Obligaciones con más de 90 días de mora: ${datos.obligacionesConMoraMayor90}`,
    "",
    "3. OBSERVACIONES JURÍDICAS",
    datos.observacionesJuridicas ?? sinDato,
    "",
    "4. SITUACIÓN / URGENCIA DEL CLIENTE",
    datos.situacionUrgencia ?? sinDato,
    "",
    "5. OBJETIVO DEL CLIENTE",
    datos.objetivoCliente ?? sinDato,
    "",
    "6. HONORARIOS Y DATOS DEL CONTRATO",
    `Tipo de servicio: ${contrato.tipoServicio ?? sinDato}`,
    `% Honorarios: ${formatearPorcentajeHonorarios(contrato.porcentajeHonorarios)}`,
    `$ Honorarios: ${formatearPesos(contrato.valorHonorarios)}`,
    `Costo del proceso: ${formatearPesos(contrato.costoProceso)}`,
    `Cuotas de honorarios: ${contrato.cuotasHonorarios}`,
    `Valor de la cuota: ${formatearPesos(contrato.valorCuota)}`,
    `Requiere centro de conciliación: ${contrato.requiereCentroConciliacion ? "SI" : "NO"}`,
  ];
  if (contrato.requiereCentroConciliacion) {
    lineas.push(
      `Valor del centro de conciliación: ${formatearPesos(contrato.valorCentroConciliacion)}`,
    );
  }
  return lineas.join("\n");
}
