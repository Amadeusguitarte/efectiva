"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { erroresDeValidacion, valoresTexto, type EstadoAccion } from "@/lib/acciones";
import { requerirAdmin } from "@/lib/auth/sesion";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { esErrorTablaPendiente } from "@/lib/datos/redaccion";
import { esTextoSugerido, redactarBorrador } from "@/lib/propuestas/contenido";
import { createClient } from "@/lib/supabase/server";
import { CAMPOS_FORMULARIO_REDACCION, redaccionSchema } from "@/lib/validaciones/redaccion";

/**
 * Guarda la redacción de la propuesta. Un texto igual al borrador automático se guarda como null,
 * de modo que siga actualizándose solo cuando cambie la matriz.
 */
export async function guardarRedaccion(
  clienteId: string,
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();
  if (!z.uuid().safeParse(clienteId).success) return { ok: false, mensaje: "Cliente no válido." };

  const valores = valoresTexto(formData, CAMPOS_FORMULARIO_REDACCION);
  const datos = redaccionSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const diagnostico = await obtenerDiagnosticoCliente(clienteId);
  if (!diagnostico) return { ok: false, mensaje: "Cliente no encontrado.", valores };

  const borrador = redactarBorrador(diagnostico.datosPropuesta, datos.data.tratamiento);
  const propio = (texto: string | null, sugerido: string) =>
    esTextoSugerido(texto, sugerido) ? null : texto;

  const supabase = await createClient();
  const { error } = await supabase.from("propuesta_redacciones").upsert(
    {
      cliente_id: clienteId,
      tratamiento: datos.data.tratamiento,
      situacion_economica: propio(datos.data.situacion_economica, borrador.situacionEconomica),
      situacion_legal: propio(datos.data.situacion_legal, borrador.situacionLegal),
      recomendacion: propio(datos.data.recomendacion, borrador.recomendacion),
      honorarios: propio(datos.data.honorarios, borrador.honorarios),
      actualizado_por: admin.id,
    },
    { onConflict: "cliente_id" },
  );

  if (error) {
    if (esErrorTablaPendiente(error)) {
      return {
        ok: false,
        mensaje:
          "Falta aplicar la migración 20260923120000_redaccion_propuesta.sql en Supabase. Mientras tanto el PDF se genera con el texto sugerido.",
        valores,
      };
    }
    console.error("Error al guardar la redacción:", error.message);
    return { ok: false, mensaje: "No pudimos guardar la redacción. Inténtalo de nuevo.", valores };
  }

  revalidatePath(`/admin/clientes/${clienteId}`, "layout");
  return { ok: true, mensaje: "Redacción guardada. Ya puedes generar el PDF.", valores };
}
