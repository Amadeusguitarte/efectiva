"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import type { EstadoAccion } from "@/lib/acciones";
import { requerirAdmin } from "@/lib/auth/sesion";
import { buscarClientesParaMatriz } from "@/lib/datos/diagnostico";
import {
  filaDiagnostico,
  filasObligaciones,
  leerFormularioMatriz,
  type FormularioMatriz,
} from "@/lib/diagnostico/guardado";
import type { ResultadoBusquedaClientes } from "@/lib/diagnostico/selector-cliente";
import { createClient } from "@/lib/supabase/server";
import { clienteDuplicado } from "@/lib/validaciones/cliente";
import { busquedaClientesSchema } from "@/lib/validaciones/diagnostico";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

type ResultadoGuardado =
  { ok: true; propuestaEnDiagnostico: boolean } | { ok: false; estado: EstadoAccion };

/**
 * Guarda la matriz completa (datos y obligaciones) en una sola transacción mediante la función
 * `guardar_diagnostico` de la base de datos, con control de versión (`actualizadoEn`).
 */
async function guardarMatriz(
  supabase: ClienteSupabase,
  clienteId: string,
  formulario: FormularioMatriz,
): Promise<ResultadoGuardado> {
  const { data, error } = await supabase.rpc("guardar_diagnostico", {
    p_cliente_id: clienteId,
    p_diagnostico: filaDiagnostico(formulario.diagnostico),
    p_obligaciones: filasObligaciones(formulario.diagnostico),
    p_actualizado_en: formulario.actualizadoEn,
  });

  if (error) {
    // 40001: otra persona guardó después de que se cargó la página.
    if (error.code === "40001") {
      return {
        ok: false,
        estado: {
          ok: false,
          mensaje:
            "Otra persona del equipo guardó esta matriz mientras la editabas. Copia tus cambios, recarga la página y vuelve a aplicarlos.",
        },
      };
    }
    console.error("Error al guardar el diagnóstico:", error.message);
    return {
      ok: false,
      estado: { ok: false, mensaje: "No pudimos guardar el diagnóstico. Inténtalo de nuevo." },
    };
  }

  return { ok: true, propuestaEnDiagnostico: data?.[0]?.propuesta_en_diagnostico ?? false };
}

/** Error de unicidad (correo o documento repetido) como error del campo del cliente. */
function errorDuplicado(error: { code?: string; message: string }): EstadoAccion | null {
  const duplicado = clienteDuplicado(error);
  if (!duplicado) return null;
  return {
    ok: false,
    mensaje: duplicado.mensaje,
    errores: duplicado.campo ? { [`cliente.${duplicado.campo}`]: [duplicado.mensaje] } : undefined,
  };
}

/**
 * Guarda la matriz de un cliente existente junto con sus datos (nombre, correo, documento,
 * teléfono y ciudad), que se diligencian en la misma tarjeta «Datos del cliente».
 */
export async function guardarDiagnostico(
  clienteId: string,
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();
  if (!z.uuid().safeParse(clienteId).success) return { ok: false, mensaje: "Cliente no válido." };

  const lectura = leerFormularioMatriz(formData);
  if (!lectura.ok) return lectura.estado;
  const { formulario } = lectura;

  const supabase = await createClient();
  const { error: errorCliente } = await supabase
    .from("clientes")
    .update(formulario.cliente)
    .eq("id", clienteId);
  if (errorCliente) {
    const duplicado = errorDuplicado(errorCliente);
    if (duplicado) return duplicado;
    console.error("Error al actualizar el cliente desde la matriz:", errorCliente.message);
    return { ok: false, mensaje: "No pudimos guardar los datos del cliente. Inténtalo de nuevo." };
  }

  const guardado = await guardarMatriz(supabase, clienteId, formulario);
  if (!guardado.ok) return guardado.estado;

  revalidatePath(`/admin/clientes/${clienteId}`, "layout");
  revalidatePath("/admin", "layout");
  if (guardado.propuestaEnDiagnostico) revalidatePath("/portal");

  return {
    ok: true,
    mensaje: guardado.propuestaEnDiagnostico
      ? "Diagnóstico guardado. La propuesta pasó a «En diagnóstico»."
      : "Diagnóstico guardado.",
  };
}

/**
 * Crea un cliente directamente desde la matriz (sin formulario aparte): inserta el expediente
 * (la base le abre su propuesta) y guarda la matriz. Si la matriz no se puede guardar, el
 * expediente recién creado se elimina para no dejar clientes a medias.
 */
export async function crearClienteConMatriz(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();

  const lectura = leerFormularioMatriz(formData);
  if (!lectura.ok) return lectura.estado;
  const formulario = { ...lectura.formulario, actualizadoEn: null };

  const supabase = await createClient();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({ ...formulario.cliente, origen: "creado_por_admin", created_by: admin.id })
    .select("id")
    .single();
  if (error) {
    const duplicado = errorDuplicado(error);
    if (duplicado) return duplicado;
    console.error("Error al crear el cliente desde la matriz:", error.message);
    return { ok: false, mensaje: "No pudimos crear el cliente. Inténtalo de nuevo." };
  }

  const guardado = await guardarMatriz(supabase, cliente.id, formulario);
  if (!guardado.ok) {
    const { error: errorBorrado } = await supabase.from("clientes").delete().eq("id", cliente.id);
    if (errorBorrado) {
      console.error("No se pudo deshacer el cliente creado:", errorBorrado.message);
    }
    return guardado.estado;
  }

  revalidatePath("/admin", "layout");
  if (guardado.propuestaEnDiagnostico) revalidatePath("/portal");
  redirect(`/admin/clientes/${cliente.id}/diagnostico?creado=1` as Route);
}

/**
 * Buscador «Cambiar de cliente» de la matriz: sin texto devuelve los clientes con actividad más
 * reciente; con texto, los que coinciden en nombre, documento, correo o teléfono.
 */
export async function buscarClientesMatriz(termino: unknown): Promise<ResultadoBusquedaClientes> {
  await requerirAdmin();
  const busqueda = busquedaClientesSchema.safeParse(termino);
  if (!busqueda.success) return { ok: false, mensaje: "La búsqueda no es válida." };

  try {
    return { ok: true, clientes: await buscarClientesParaMatriz(busqueda.data) };
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      "Error al buscar clientes para la matriz:",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, mensaje: "No pudimos cargar los clientes. Inténtalo de nuevo." };
  }
}
