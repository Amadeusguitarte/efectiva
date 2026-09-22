import { z } from "zod";

import { correoDeUsuario, esNombreDeUsuario } from "@/lib/auth/usuarios";

import { correoSchema } from "./comunes";

/** Usuario del equipo (`admininsolvencia`) o correo completo; se entrega siempre como correo. */
export const usuarioOCorreoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu usuario o correo.")
  .refine(
    (valor) =>
      valor.includes("@") ? z.email().safeParse(valor).success : esNombreDeUsuario(valor),
    "Escribe un usuario o correo válido.",
  )
  .transform(correoDeUsuario);

export const ingresoSchema = z.object({
  usuario: usuarioOCorreoSchema,
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
