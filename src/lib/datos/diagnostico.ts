import "server-only";

import { requerirAdmin } from "@/lib/auth/sesion";
import { filtroBusqueda, soloCaracteresIgnorados, textoBusqueda } from "@/lib/busqueda";
import {
  calcularDiagnostico,
  diagnosticoVacio,
  type DiagnosticoEntrada,
  type ObligacionEntrada,
} from "@/lib/diagnostico/calcular";
import { construirDatosPropuesta } from "@/lib/diagnostico/propuesta";
import {
  detalleCliente,
  LIMITE_CLIENTES_SELECTOR,
  masRecientes,
  ultimaActividad,
  type ClienteSelector,
} from "@/lib/diagnostico/selector-cliente";
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

/** Fechas que cuentan como actividad de un cliente: su ficha, su matriz y su propuesta. */
const ORDEN_ACTIVIDAD = ["updated_at", "diagnosticos(updated_at)", "propuestas(updated_at)"];

/**
 * Clientes para el selector «Cambiar de cliente» de la matriz: los que coinciden con el término en
 * nombre, documento, correo o teléfono (sin término, todos), del más reciente al más antiguo por
 * actividad, hasta 8. Devuelve objetos mínimos para el navegador.
 */
export async function buscarClientesParaMatriz(termino: string): Promise<ClienteSelector[]> {
  await requerirAdmin();
  // Lo escrito no deja nada que buscar (p. ej. «,,,»): sin filtro saldrían todos los clientes.
  if (soloCaracteresIgnorados(termino)) return [];
  const supabase = await createClient();
  const limpio = textoBusqueda(termino);
  const filtro = filtroBusqueda(
    ["nombre_completo", "numero_documento", "email", "telefono"],
    limpio,
  );

  // PostgREST no ordena por la mayor de varias fechas: se piden los más recientes según cada una
  // (ficha, matriz y propuesta, que son relaciones uno a uno) y `masRecientes()` los combina.
  const respuestas = await Promise.all(
    ORDEN_ACTIVIDAD.map((columna) => {
      let consulta = supabase
        .from("clientes")
        .select(
          `id, nombre_completo, email, telefono, tipo_documento, numero_documento, updated_at,
           propuestas(estado, updated_at), diagnosticos(updated_at)`,
        )
        .order(columna, { ascending: false, nullsFirst: false })
        .limit(LIMITE_CLIENTES_SELECTOR);
      if (filtro) consulta = consulta.or(filtro);
      return consulta;
    }),
  );

  const listas = respuestas.map(({ data, error }) => {
    if (error) throw error;
    return data.map((fila) => ({
      ...fila,
      actividad: ultimaActividad(
        fila.updated_at,
        fila.diagnosticos?.updated_at,
        fila.propuestas?.updated_at,
      ),
    }));
  });

  return masRecientes(listas, LIMITE_CLIENTES_SELECTOR).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre_completo,
    detalle: detalleCliente(
      {
        nombre: fila.nombre_completo,
        tipoDocumento: fila.tipo_documento,
        numeroDocumento: fila.numero_documento,
        email: fila.email,
        telefono: fila.telefono,
      },
      limpio,
    ),
    estadoPropuesta: fila.propuestas?.estado ?? null,
    tieneMatriz: fila.diagnosticos !== null,
  }));
}
