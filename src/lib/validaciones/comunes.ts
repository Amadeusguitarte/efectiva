import { z } from "zod";

// Mensajes de validación por defecto en español.
z.config(z.locales.es());

/** Correo normalizado: se recorta y pasa a minúsculas antes de validar el formato. */
export const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Escribe un correo válido."));
