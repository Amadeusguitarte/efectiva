import { z } from "zod";

import { ESTADOS_PROPUESTA } from "@/lib/propuestas/estados";

import "./comunes";

export const actualizarEstadoSchema = z.object({
  propuesta_id: z.uuid(),
  estado: z.enum(ESTADOS_PROPUESTA, "Selecciona un estado válido."),
  mensaje_cliente: z
    .string()
    .trim()
    .max(1000, "Máximo 1000 caracteres.")
    .optional()
    .transform((valor) => valor || null),
});

export const notaInternaSchema = z.object({
  cliente_id: z.uuid(),
  contenido: z.string().trim().min(1, "Escribe la nota.").max(5000, "Máximo 5000 caracteres."),
});
