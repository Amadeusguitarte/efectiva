import { z } from "zod";

import { correoSchema } from "./comunes";

export const ingresoSchema = z.object({
  email: correoSchema,
  password: z.string().min(1, "Escribe tu contraseña."),
});

export const recuperacionSchema = z.object({
  email: correoSchema,
});

export const nuevaContrasenaSchema = z
  .object({
    password: z
      .string()
      .min(10, "Usa al menos 10 caracteres.")
      .max(72, "Máximo 72 caracteres.")
      .regex(/[a-zA-Z]/, "Incluye al menos una letra.")
      .regex(/\d/, "Incluye al menos un número."),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  });
