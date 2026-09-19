"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { erroresPorRuta, type EstadoAccion } from "@/lib/acciones";
import { requerirAdmin } from "@/lib/auth/sesion";
import { createClient } from "@/lib/supabase/server";
import { diagnosticoSchema, type DiagnosticoValidado } from "@/lib/validaciones/diagnostico";
import type { Json } from "@/types/database";

/** Columnas de `public.diagnosticos` a partir del formulario validado. */
function filaDiagnostico(datos: DiagnosticoValidado): Record<string, Json> {
  return {
    ocupacion: datos.ocupacion,
    ingresos_mensuales: datos.ingresosMensuales,
    gastos_mensuales: datos.gastosMensuales,
    bienes: datos.bienes,
    estado_civil: datos.estadoCivil,
    tipo_servicio: datos.tipoServicio,
    porcentaje_honorarios: datos.porcentajeHonorarios,
    cuotas_honorarios: datos.cuotasHonorarios,
    requiere_centro_conciliacion: datos.requiereCentroConciliacion,
    descuento_centro_conciliacion: datos.descuentoCentroConciliacion,
    observaciones_juridicas: datos.observacionesJuridicas,
    situacion_urgencia: datos.situacionUrgencia,
    objetivo_cliente: datos.objetivoCliente,
  };
}

function filasObligaciones(datos: DiagnosticoValidado): Record<string, Json>[] {
  return datos.obligaciones.map((o) => ({
    acreedor: o.acreedor,
    concepto: o.concepto,
    capital: o.capital,
    intereses: o.intereses,
    mora: o.mora,
    dias_mora: o.diasMora,
    descuento_nomina: o.descuentoNomina,
    tipo_garantia: o.tipoGarantia,
    clase: o.clase,
  }));
}

/**
 * Guarda la matriz completa (datos y obligaciones) en una sola transacción mediante la función
 * `guardar_diagnostico` de la base de datos. El formulario envía el estado como JSON en el
 * campo `datos`.
 */
export async function guardarDiagnostico(
  clienteId: string,
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();
  if (!z.uuid().safeParse(clienteId).success) return { ok: false, mensaje: "Cliente no válido." };

  const crudo = formData.get("datos");
  let json: unknown;
  try {
    json = JSON.parse(typeof crudo === "string" ? crudo : "");
  } catch {
    return {
      ok: false,
      mensaje: "No pudimos leer el formulario. Recarga la página e inténtalo de nuevo.",
    };
  }

  const datos = diagnosticoSchema.safeParse(json);
  if (!datos.success) return erroresPorRuta(datos.error);

  // Versión que vio quien edita (updated_at); vacío en un diagnóstico nuevo.
  const version = formData.get("actualizado_en");
  const actualizadoEn = typeof version === "string" && version !== "" ? version : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guardar_diagnostico", {
    p_cliente_id: clienteId,
    p_diagnostico: filaDiagnostico(datos.data),
    p_obligaciones: filasObligaciones(datos.data),
    p_actualizado_en: actualizadoEn,
  });

  if (error) {
    // 40001: otra persona guardó después de que se cargó la página.
    if (error.code === "40001") {
      return {
        ok: false,
        mensaje:
          "Otra persona del equipo guardó esta matriz mientras la editabas. Copia tus cambios, recarga la página y vuelve a aplicarlos.",
      };
    }
    console.error("Error al guardar el diagnóstico:", error.message);
    return { ok: false, mensaje: "No pudimos guardar el diagnóstico. Inténtalo de nuevo." };
  }

  const propuesta = data?.[0]?.propuesta_en_diagnostico ?? false;

  revalidatePath(`/admin/clientes/${clienteId}`, "layout");
  revalidatePath("/admin", "layout");
  if (propuesta) revalidatePath("/portal");

  return {
    ok: true,
    mensaje: propuesta
      ? "Diagnóstico guardado. La propuesta pasó a «En diagnóstico»."
      : "Diagnóstico guardado.",
  };
}
