import { z } from "zod";

import type { DiagnosticoEntrada } from "@/lib/diagnostico/calcular";
import {
  VALORES_CLASE,
  VALORES_ESTADO_CIVIL,
  VALORES_MORA,
  VALORES_TIPO_GARANTIA,
  VALORES_TIPO_SERVICIO,
} from "@/lib/diagnostico/catalogos";
import { PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";

import "./comunes";

/** Tope razonable para cualquier importe en pesos (un billón). */
export const MAXIMO_PESOS = 999_999_999_999;

const pesos = z
  .number("Escribe un valor numérico.")
  .min(0, "No puede ser negativo.")
  .max(MAXIMO_PESOS, "El valor es demasiado grande.");

const textoOpcional = (max: number) =>
  z
    .string("Escribe un texto.")
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .nullable()
    .transform((valor) => valor || null);

export const obligacionSchema = z.object({
  acreedor: z
    .string("Escribe el acreedor.")
    .trim()
    .min(1, "Escribe el acreedor.")
    .max(160, "Máximo 160 caracteres."),
  concepto: textoOpcional(160),
  capital: pesos,
  intereses: pesos,
  mora: z.enum(VALORES_MORA, "Selecciona la mora."),
  diasMora: z
    .number("Escribe un número de días.")
    .int("Escribe un número entero de días.")
    .min(0, "No puede ser negativo.")
    .max(36500, "Demasiados días.")
    .nullable(),
  descuentoNomina: z.boolean(),
  tipoGarantia: z.enum(VALORES_TIPO_GARANTIA, "Selecciona la garantía."),
  clase: z.enum(VALORES_CLASE, "Selecciona la clase."),
});

export const diagnosticoSchema = z.object({
  ocupacion: textoOpcional(200),
  ingresosMensuales: pesos.nullable(),
  gastosMensuales: pesos.nullable(),
  bienes: textoOpcional(2000),
  estadoCivil: z.enum(VALORES_ESTADO_CIVIL, "Selecciona un estado civil válido.").nullable(),
  tipoServicio: z.enum(VALORES_TIPO_SERVICIO, "Selecciona un tipo de servicio válido.").nullable(),
  porcentajeHonorarios: z
    .number("Escribe el porcentaje.")
    .min(0, "No puede ser negativo.")
    .max(100, "No puede superar el 100 %."),
  cuotasHonorarios: z
    .number("Escribe el número de cuotas.")
    .int("Debe ser un número entero.")
    .min(1, "Mínimo 1 cuota.")
    .max(
      PARAMETROS_DIAGNOSTICO.honorarios.cuotasMaximas,
      `Máximo ${PARAMETROS_DIAGNOSTICO.honorarios.cuotasMaximas} cuotas.`,
    ),
  requiereCentroConciliacion: z.boolean(),
  descuentoCentroConciliacion: pesos,
  observacionesJuridicas: textoOpcional(5000),
  situacionUrgencia: textoOpcional(5000),
  objetivoCliente: textoOpcional(5000),
  obligaciones: z.array(obligacionSchema).max(200, "Máximo 200 obligaciones."),
});

export type DiagnosticoValidado = z.infer<typeof diagnosticoSchema>;

// El resultado de la validación es exactamente lo que consume el motor de cálculo.
const _compatible: DiagnosticoEntrada = null as unknown as DiagnosticoValidado;
void _compatible;
