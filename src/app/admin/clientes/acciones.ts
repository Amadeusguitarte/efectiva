"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { erroresDeValidacion, valoresTexto, type EstadoAccion } from "@/lib/acciones";
import { requerirAdmin } from "@/lib/auth/sesion";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema, valoresFormularioCliente } from "@/lib/validaciones/cliente";
import {
  BUCKET_PROPUESTAS,
  esRutaDocumentoValida,
  rutaDocumentoPropuesta,
} from "@/lib/propuestas/documentos";
import { actualizarEstadoSchema, notaInternaSchema } from "@/lib/validaciones/propuesta";

function mensajeDuplicado(error: { code?: string; message: string }): string | null {
  if (error.code !== "23505") return null;
  if (error.message.includes("clientes_email_key")) return "Ya existe un cliente con ese correo.";
  if (error.message.includes("clientes_documento_key")) {
    return "Ya existe un cliente con ese documento.";
  }
  return "Ya existe un cliente con esos datos.";
}

export async function crearCliente(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();

  const valores = valoresFormularioCliente(formData);
  const datos = clienteSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...datos.data, origen: "creado_por_admin", created_by: admin.id })
    .select("id")
    .single();

  if (error) {
    const duplicado = mensajeDuplicado(error);
    if (duplicado) return { ok: false, mensaje: duplicado, valores };
    console.error("Error al crear cliente:", error.message);
    return { ok: false, mensaje: "No pudimos crear el cliente. Inténtalo de nuevo.", valores };
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/clientes/${data.id}` as Route);
}

export async function actualizarCliente(
  clienteId: string,
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();
  if (!z.uuid().safeParse(clienteId).success) return { ok: false, mensaje: "Cliente no válido." };

  const valores = valoresFormularioCliente(formData);
  const datos = clienteSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update(datos.data).eq("id", clienteId);

  if (error) {
    const duplicado = mensajeDuplicado(error);
    if (duplicado) return { ok: false, mensaje: duplicado, valores };
    console.error("Error al actualizar cliente:", error.message);
    return { ok: false, mensaje: "No pudimos guardar los cambios. Inténtalo de nuevo.", valores };
  }

  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/admin/clientes");
  return { ok: true, mensaje: "Datos del cliente actualizados." };
}

export async function actualizarEstadoPropuesta(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requerirAdmin();

  const valores = valoresTexto(formData, ["propuesta_id", "estado", "mensaje_cliente"]);
  const datos = actualizarEstadoSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data: propuesta, error: errorLectura } = await supabase
    .from("propuestas")
    .select("cliente_id, documento_path")
    .eq("id", datos.data.propuesta_id)
    .single();

  if (errorLectura) return { ok: false, mensaje: "No encontramos la propuesta.", valores };

  if (datos.data.estado === "finalizada" && !propuesta.documento_path) {
    return {
      ok: false,
      mensaje: "Carga el documento final antes de marcar la propuesta como finalizada.",
      errores: { estado: ["Falta el documento final."] },
      valores,
    };
  }

  const { error } = await supabase
    .from("propuestas")
    .update({ estado: datos.data.estado, mensaje_cliente: datos.data.mensaje_cliente })
    .eq("id", datos.data.propuesta_id);

  if (error) {
    console.error("Error al actualizar la propuesta:", error.message);
    return { ok: false, mensaje: "No pudimos actualizar el estado. Inténtalo de nuevo.", valores };
  }

  revalidatePath(`/admin/clientes/${propuesta.cliente_id}`);
  revalidatePath("/admin", "layout");
  revalidatePath("/portal");
  return { ok: true, mensaje: "Estado actualizado. El cliente ya puede verlo en su portal." };
}

type ResultadoSubida = { ok: true; ruta: string; token: string } | { ok: false; mensaje: string };

/**
 * Autoriza la carga directa del PDF a Supabase Storage (evita el límite de tamaño de las
 * funciones del servidor). El navegador sube el archivo con el token devuelto.
 */
export async function prepararSubidaDocumento(propuestaId: string): Promise<ResultadoSubida> {
  await requerirAdmin();
  if (!z.uuid().safeParse(propuestaId).success)
    return { ok: false, mensaje: "Propuesta no válida." };

  const supabase = await createClient();
  const { data: propuesta } = await supabase
    .from("propuestas")
    .select("id, cliente_id")
    .eq("id", propuestaId)
    .single();
  if (!propuesta) return { ok: false, mensaje: "No encontramos la propuesta." };

  const ruta = rutaDocumentoPropuesta(propuesta.cliente_id, propuesta.id, `${Date.now()}.pdf`);
  const { data, error } = await supabase.storage
    .from(BUCKET_PROPUESTAS)
    .createSignedUploadUrl(ruta);

  if (error || !data) {
    console.error("Error al preparar la carga:", error?.message);
    return { ok: false, mensaje: "No pudimos preparar la carga del documento." };
  }

  return { ok: true, ruta: data.path, token: data.token };
}

export async function confirmarDocumento(propuestaId: string, ruta: string): Promise<EstadoAccion> {
  await requerirAdmin();
  if (!z.uuid().safeParse(propuestaId).success)
    return { ok: false, mensaje: "Propuesta no válida." };

  const supabase = await createClient();
  const { data: propuesta } = await supabase
    .from("propuestas")
    .select("id, cliente_id, documento_path")
    .eq("id", propuestaId)
    .single();
  if (!propuesta || !esRutaDocumentoValida(ruta, propuesta.cliente_id, propuesta.id)) {
    return { ok: false, mensaje: "La ruta del documento no es válida." };
  }

  const { data: existe } = await supabase.storage.from(BUCKET_PROPUESTAS).exists(ruta);
  if (!existe) return { ok: false, mensaje: "No encontramos el archivo cargado. Súbelo de nuevo." };

  const { error } = await supabase
    .from("propuestas")
    .update({ documento_path: ruta })
    .eq("id", propuestaId);

  if (error) {
    console.error("Error al registrar el documento:", error.message);
    return { ok: false, mensaje: "No pudimos registrar el documento." };
  }

  // El documento anterior deja de ser necesario.
  if (propuesta.documento_path && propuesta.documento_path !== ruta) {
    await supabase.storage.from(BUCKET_PROPUESTAS).remove([propuesta.documento_path]);
  }

  revalidatePath(`/admin/clientes/${propuesta.cliente_id}`);
  revalidatePath("/portal");
  return { ok: true, mensaje: "Documento cargado correctamente." };
}

export async function agregarNotaInterna(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await requerirAdmin();

  const valores = valoresTexto(formData, ["cliente_id", "contenido"]);
  const datos = notaInternaSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { error } = await supabase
    .from("notas_internas")
    .insert({ ...datos.data, autor_id: admin.id });

  if (error) {
    console.error("Error al guardar la nota:", error.message);
    return { ok: false, mensaje: "No pudimos guardar la nota.", valores };
  }

  revalidatePath(`/admin/clientes/${datos.data.cliente_id}`);
  return { ok: true, mensaje: "Nota guardada." };
}
