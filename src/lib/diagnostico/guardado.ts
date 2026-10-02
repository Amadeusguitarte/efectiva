import type { EstadoAccion } from "@/lib/acciones";
import {
  clienteSchema,
  valoresClienteDe,
  type ClienteFormulario,
} from "@/lib/validaciones/cliente";
import { diagnosticoSchema, type DiagnosticoValidado } from "@/lib/validaciones/diagnostico";
import type { Json } from "@/types/database";

/**
 * Lectura del formulario de la matriz de diagnóstico, compartida por «guardar» (cliente
 * existente) y «crear cliente» (matriz nueva). El formulario envía tres campos:
 *   - `datos`: la matriz como JSON (`DiagnosticoEntrada`).
 *   - `cliente`: los datos del cliente como JSON (nombre, correo, documento, teléfono, ciudad).
 *   - `actualizado_en`: versión de la matriz que se cargó (vacío si es nueva).
 * Los errores del cliente llegan con el prefijo `cliente.` («cliente.email») y los de la matriz
 * con su ruta («obligaciones.2.capital»).
 */

export type FormularioMatriz = {
  diagnostico: DiagnosticoValidado;
  cliente: ClienteFormulario;
  /** `updated_at` que vio quien edita; null en una matriz nueva. */
  actualizadoEn: string | null;
};

const MENSAJE_ILEGIBLE = "No pudimos leer el formulario. Recarga la página e inténtalo de nuevo.";

function leerJson(valor: FormDataEntryValue | null): { ok: true; json: unknown } | { ok: false } {
  if (typeof valor !== "string") return { ok: false };
  try {
    return { ok: true, json: JSON.parse(valor) };
  } catch {
    return { ok: false };
  }
}

export function leerFormularioMatriz(
  formData: FormData,
): { ok: true; formulario: FormularioMatriz } | { ok: false; estado: EstadoAccion } {
  const datos = leerJson(formData.get("datos"));
  const cliente = leerJson(formData.get("cliente"));
  if (!datos.ok || !cliente.ok)
    return { ok: false, estado: { ok: false, mensaje: MENSAJE_ILEGIBLE } };

  const diagnostico = diagnosticoSchema.safeParse(datos.json);
  const identidad = clienteSchema.safeParse(valoresClienteDe(cliente.json));

  if (!diagnostico.success || !identidad.success) {
    const errores: Record<string, string[]> = {};
    for (const issue of diagnostico.error?.issues ?? []) {
      const campo = issue.path.length ? issue.path.map(String).join(".") : "formulario";
      (errores[campo] ??= []).push(issue.message);
    }
    for (const issue of identidad.error?.issues ?? []) {
      const campo = `cliente.${issue.path.map(String).join(".") || "formulario"}`;
      (errores[campo] ??= []).push(issue.message);
    }
    return { ok: false, estado: { ok: false, mensaje: "Revisa los campos marcados.", errores } };
  }

  const version = formData.get("actualizado_en");
  return {
    ok: true,
    formulario: {
      diagnostico: diagnostico.data,
      cliente: identidad.data,
      actualizadoEn: typeof version === "string" && version !== "" ? version : null,
    },
  };
}

/** Columnas de `public.diagnosticos` a partir del formulario validado. */
export function filaDiagnostico(datos: DiagnosticoValidado): Record<string, Json> {
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

export function filasObligaciones(datos: DiagnosticoValidado): Record<string, Json>[] {
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
