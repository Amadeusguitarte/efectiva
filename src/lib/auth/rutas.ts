import type { Enums } from "@/types/database";

export type Rol = Enums<"rol_usuario">;

export const RUTA_INGRESO = "/ingresar";

export function rutaInicioPorRol(rol: Rol): "/admin" | "/portal" {
  return rol === "admin" ? "/admin" : "/portal";
}

/**
 * Devuelve la ruta solo si es interna (evita redirecciones abiertas a otros dominios).
 */
export function rutaSegura(valor: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof valor !== "string") return null;
  const ruta = valor.trim();
  if (!ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\")) return null;
  try {
    const url = new URL(ruta, "http://localhost");
    if (url.host !== "localhost") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Decide a dónde enviar al usuario tras iniciar sesión, respetando su rol. */
export function destinoTrasIngreso(rol: Rol, siguiente: string | null): string {
  const inicio = rutaInicioPorRol(rol);
  if (!siguiente) return inicio;
  const permitido =
    rol === "admin" ? !siguiente.startsWith("/portal") : !siguiente.startsWith("/admin");
  return permitido ? siguiente : inicio;
}
