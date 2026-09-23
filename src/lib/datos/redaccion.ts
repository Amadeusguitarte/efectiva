import "server-only";

import { requerirAdmin } from "@/lib/auth/sesion";
import type { RedaccionPropuesta } from "@/lib/propuestas/contenido";
import { createClient } from "@/lib/supabase/server";

/** La tabla aún no existe: falta aplicar la migración `20260923120000_redaccion_propuesta.sql`. */
export function esErrorTablaPendiente(error: { code?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205";
}

/**
 * Redacción guardada por el equipo para la propuesta de un cliente, o null si todavía se usa el
 * borrador automático en todo.
 */
export async function obtenerRedaccionPropuesta(clienteId: string) {
  await requerirAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("propuesta_redacciones")
    .select(
      `tratamiento, situacion_economica, situacion_legal, recomendacion, honorarios, updated_at,
       autor:perfiles!propuesta_redacciones_actualizado_por_fkey(nombre_completo, email)`,
    )
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error) {
    if (esErrorTablaPendiente(error)) {
      console.warn("Falta aplicar la migración de propuesta_redacciones; se usa el borrador.");
      return null;
    }
    throw error;
  }
  if (!data) return null;

  const redaccion: RedaccionPropuesta = {
    tratamiento: data.tratamiento,
    situacionEconomica: data.situacion_economica,
    situacionLegal: data.situacion_legal,
    recomendacion: data.recomendacion,
    honorarios: data.honorarios,
  };

  return { redaccion, actualizadoAt: data.updated_at, actualizadoPor: data.autor };
}

export type RedaccionCliente = NonNullable<Awaited<ReturnType<typeof obtenerRedaccionPropuesta>>>;
