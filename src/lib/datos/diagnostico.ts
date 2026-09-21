import "server-only";

import { requerirAdmin } from "@/lib/auth/sesion";
import {
  calcularDiagnostico,
  diagnosticoVacio,
  type DiagnosticoEntrada,
  type ObligacionEntrada,
} from "@/lib/diagnostico/calcular";
import { construirDatosPropuesta } from "@/lib/diagnostico/propuesta";
import { createClient } from "@/lib/supabase/server";

/**
 * Matriz de diagnóstico de un cliente para el panel: la entrada guardada (o vacía si aún no
 * existe), los indicadores calculados y los datos listos para la propuesta.
 */
export async function obtenerDiagnosticoCliente(clienteId: string) {
  await requerirAdmin();
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select(
      `id, nombre_completo, email,
       propuestas(id, estado),
       diagnosticos(
         id, ocupacion, ingresos_mensuales, gastos_mensuales, bienes, estado_civil, tipo_servicio,
         porcentaje_honorarios, cuotas_honorarios, requiere_centro_conciliacion,
         descuento_centro_conciliacion, observaciones_juridicas, situacion_urgencia,
         objetivo_cliente, updated_at,
         autor:perfiles!diagnosticos_actualizado_por_fkey(nombre_completo, email),
         obligaciones(orden, acreedor, concepto, capital, intereses, mora, dias_mora,
           descuento_nomina, tipo_garantia, clase)
       )`,
    )
    .eq("id", clienteId)
    .maybeSingle();

  if (error) throw error;
  if (!cliente) return null;

  const fila = cliente.diagnosticos;
  const entrada: DiagnosticoEntrada = fila
    ? {
        ocupacion: fila.ocupacion,
        ingresosMensuales: fila.ingresos_mensuales,
        gastosMensuales: fila.gastos_mensuales,
        bienes: fila.bienes,
        estadoCivil: fila.estado_civil,
        tipoServicio: fila.tipo_servicio,
        porcentajeHonorarios: fila.porcentaje_honorarios,
        cuotasHonorarios: fila.cuotas_honorarios,
        requiereCentroConciliacion: fila.requiere_centro_conciliacion,
        descuentoCentroConciliacion: fila.descuento_centro_conciliacion,
        observacionesJuridicas: fila.observaciones_juridicas,
        situacionUrgencia: fila.situacion_urgencia,
        objetivoCliente: fila.objetivo_cliente,
        obligaciones: [...fila.obligaciones]
          .sort((a, b) => a.orden - b.orden)
          .map((o): ObligacionEntrada => ({
            acreedor: o.acreedor,
            concepto: o.concepto,
            capital: o.capital,
            intereses: o.intereses,
            mora: o.mora,
            diasMora: o.dias_mora,
            descuentoNomina: o.descuento_nomina,
            tipoGarantia: o.tipo_garantia,
            clase: o.clase,
          })),
      }
    : diagnosticoVacio();

  const resultado = calcularDiagnostico(entrada);

  return {
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre_completo,
      email: cliente.email,
      propuesta: cliente.propuestas,
    },
    existe: fila !== null,
    actualizadoAt: fila?.updated_at ?? null,
    actualizadoPor: fila?.autor ?? null,
    entrada,
    resultado,
    datosPropuesta: construirDatosPropuesta(cliente.nombre_completo, entrada, resultado),
  };
}

export type DiagnosticoCliente = NonNullable<Awaited<ReturnType<typeof obtenerDiagnosticoCliente>>>;
