import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { RUTA_INGRESO, rutaInicioPorRol, type Rol } from "./rutas";

export type UsuarioSesion = {
  id: string;
  email: string;
  nombre: string;
  avatarUrl: string | null;
  rol: Rol;
};

/**
 * Usuario autenticado de la petición actual (o null). Se memoriza por petición.
 * Es la única puerta de entrada para saber quién es el usuario en el servidor.
 */
export const obtenerUsuario = cache(async (): Promise<UsuarioSesion | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, email, nombre_completo, avatar_url, rol")
    .eq("id", data.claims.sub)
    .maybeSingle();

  if (!perfil) return null;

  return {
    id: perfil.id,
    email: perfil.email,
    nombre: perfil.nombre_completo?.trim() || perfil.email.split("@")[0] || perfil.email,
    avatarUrl: perfil.avatar_url,
    rol: perfil.rol,
  };
});

export async function requerirUsuario(): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect(RUTA_INGRESO);
  return usuario;
}

export async function requerirAdmin(): Promise<UsuarioSesion> {
  const usuario = await requerirUsuario();
  if (usuario.rol !== "admin") redirect(rutaInicioPorRol(usuario.rol));
  return usuario;
}

export async function requerirCliente(): Promise<UsuarioSesion> {
  const usuario = await requerirUsuario();
  if (usuario.rol !== "cliente") redirect(rutaInicioPorRol(usuario.rol));
  return usuario;
}
