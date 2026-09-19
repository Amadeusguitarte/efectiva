import { z } from "zod";

import { valoresTexto } from "@/lib/acciones";

import { correoSchema } from "./comunes";

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((valor) => valor || null);

export const TIPOS_DOCUMENTO = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
  PPT: "Permiso por Protección Temporal",
} as const;

export const clienteSchema = z
  .object({
    nombre_completo: z
      .string()
      .trim()
      .min(3, "Escribe el nombre completo.")
      .max(160, "Máximo 160 caracteres."),
    email: correoSchema,
    telefono: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{7,20}$/, "Escribe un teléfono válido.")
      .optional()
      .or(z.literal(""))
      .transform((valor) => valor || null),
    tipo_documento: z
      .enum(["CC", "CE", "PA", "PPT"], "Selecciona un tipo de documento válido.")
      .optional()
      .or(z.literal(""))
      .transform((valor) => valor || null),
    numero_documento: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{4,20}$/, "Escribe un número de documento válido.")
      .optional()
      .or(z.literal(""))
      .transform((valor) => valor || null),
    ciudad: textoOpcional(80),
  })
  .superRefine((datos, ctx) => {
    if (Boolean(datos.tipo_documento) !== Boolean(datos.numero_documento)) {
      ctx.addIssue({
        code: "custom",
        path: [datos.tipo_documento ? "numero_documento" : "tipo_documento"],
        message: "Completa el tipo y el número de documento.",
      });
    }
  });

export type ClienteFormulario = z.infer<typeof clienteSchema>;

export const CAMPOS_CLIENTE = [
  "nombre_completo",
  "email",
  "telefono",
  "tipo_documento",
  "numero_documento",
  "ciudad",
] as const;

export type CampoCliente = (typeof CAMPOS_CLIENTE)[number];

/** Valores de texto del formulario de cliente; los campos ausentes llegan como cadena vacía. */
export function valoresFormularioCliente(formData: FormData): Record<CampoCliente, string> {
  const valores = valoresTexto(formData, CAMPOS_CLIENTE);
  return Object.fromEntries(CAMPOS_CLIENTE.map((campo) => [campo, valores[campo] ?? ""])) as Record<
    CampoCliente,
    string
  >;
}
