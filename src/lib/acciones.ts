import type { z } from "zod";

/** Resultado estándar de las Server Actions usadas con useActionState. */
export type EstadoAccion = {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string[] | undefined>;
  /**
   * Valores enviados. React 19 reinicia el formulario al terminar la acción; devolverlos permite
   * usarlos como `defaultValue` para no perder lo escrito cuando hay errores.
   */
  valores?: Record<string, string>;
};

export const ESTADO_INICIAL: EstadoAccion = { ok: false };

export function erroresDeValidacion(
  error: z.ZodError,
  valores?: Record<string, string>,
): EstadoAccion {
  const errores: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "formulario");
    (errores[campo] ??= []).push(issue.message);
  }
  return { ok: false, mensaje: "Revisa los campos marcados.", errores, valores };
}

/** Copia los campos de texto de un FormData (nunca contraseñas ni archivos). */
export function valoresTexto(
  formData: FormData,
  campos: readonly string[],
): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const campo of campos) {
    const valor = formData.get(campo);
    if (typeof valor === "string") valores[campo] = valor;
  }
  return valores;
}

/**
 * Como `erroresDeValidacion`, pero conserva la ruta completa del campo ("obligaciones.2.capital")
 * para formularios con listas anidadas. No devuelve `valores`: estos formularios mantienen su
 * propio estado en el cliente.
 */
export function erroresPorRuta(error: z.ZodError): EstadoAccion {
  const errores: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const campo = issue.path.length ? issue.path.map(String).join(".") : "formulario";
    (errores[campo] ??= []).push(issue.message);
  }
  return { ok: false, mensaje: "Revisa los campos marcados.", errores };
}
