import { z } from "zod";

import { TRATAMIENTOS } from "@/lib/propuestas/contenido";

import "./comunes";

const MAXIMO_TEXTO = 8000;

/** Texto libre de la propuesta; vacío significa "usar el borrador automático". */
const textoRedaccion = z
  .string()
  .trim()
  .max(MAXIMO_TEXTO, `Máximo ${MAXIMO_TEXTO} caracteres.`)
  .transform((valor) => valor || null);

export const CAMPOS_FORMULARIO_REDACCION = [
  "tratamiento",
  "situacion_economica",
  "situacion_legal",
  "recomendacion",
  "honorarios",
] as const;

export const redaccionSchema = z.object({
  tratamiento: z.enum(TRATAMIENTOS, "Selecciona el tratamiento."),
  situacion_economica: textoRedaccion,
  situacion_legal: textoRedaccion,
  recomendacion: textoRedaccion,
  honorarios: textoRedaccion,
});

export type RedaccionValidada = z.infer<typeof redaccionSchema>;
