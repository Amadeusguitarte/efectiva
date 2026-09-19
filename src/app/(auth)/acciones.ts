"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { erroresDeValidacion, valoresTexto, type EstadoAccion } from "@/lib/acciones";
import { obtenerOrigen } from "@/lib/auth/origen";
import { destinoTrasIngreso, RUTA_INGRESO, rutaSegura } from "@/lib/auth/rutas";
import { requerirUsuario } from "@/lib/auth/sesion";
import { createClient } from "@/lib/supabase/server";
import { ingresoSchema, nuevaContrasenaSchema, recuperacionSchema } from "@/lib/validaciones/auth";

export async function ingresarConGoogle(formData: FormData) {
  const siguiente = rutaSegura(formData.get("siguiente"));
  const callback = new URL("/auth/callback", await obtenerOrigen());
  if (siguiente) callback.searchParams.set("siguiente", siguiente);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    console.error("Error al iniciar sesión con Google:", error?.message);
    redirect(`${RUTA_INGRESO}?error=google`);
  }

  redirect(data.url as Route);
}

export async function ingresarConCorreo(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const datos = ingresoSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const valores = valoresTexto(formData, ["email"]);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(datos.data);
  if (error || !data.user) {
    return { ok: false, mensaje: "Correo o contraseña incorrectos.", valores };
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  redirect(
    destinoTrasIngreso(perfil?.rol ?? "cliente", rutaSegura(formData.get("siguiente"))) as Route,
  );
}

export async function solicitarRecuperacion(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const valores = valoresTexto(formData, ["email"]);
  const datos = recuperacionSchema.safeParse(valores);
  if (!datos.success) return erroresDeValidacion(datos.error, valores);

  const destino = new URL("/auth/confirm", await obtenerOrigen());
  destino.searchParams.set("siguiente", "/actualizar-contrasena");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(datos.data.email, {
    redirectTo: destino.toString(),
  });
  if (error) console.error("Error al solicitar recuperación:", error.message);

  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados.
  return {
    ok: true,
    mensaje:
      "Si el correo pertenece a una cuenta del equipo, recibirás un enlace para crear una nueva contraseña.",
  };
}

export async function actualizarContrasena(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const usuario = await requerirUsuario();

  const datos = nuevaContrasenaSchema.safeParse({
    password: formData.get("password"),
    confirmacion: formData.get("confirmacion"),
  });
  if (!datos.success) return erroresDeValidacion(datos.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: datos.data.password });
  if (error) {
    return {
      ok: false,
      mensaje:
        error.code === "same_password"
          ? "La nueva contraseña debe ser distinta a la anterior."
          : "No pudimos actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.",
    };
  }

  redirect(destinoTrasIngreso(usuario.rol, null) as Route);
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(RUTA_INGRESO);
}
