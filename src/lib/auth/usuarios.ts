import { siteConfig } from "@/config/site";

/** Nombre de usuario del equipo: letras, números, punto, guion y guion bajo (3 a 64 caracteres). */
const USUARIO_REGEX = /^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/;

export function esNombreDeUsuario(valor: string): boolean {
  return USUARIO_REGEX.test(valor);
}

/**
 * Las cuentas del equipo se identifican con un nombre de usuario corto. Supabase Auth exige un
 * correo, así que el usuario `nombre` equivale a `nombre@<dominio del equipo>`. Si ya viene un
 * correo (contiene «@»), se usa tal cual.
 */
export function correoDeUsuario(valor: string): string {
  const limpio = valor.trim().toLowerCase();
  return limpio.includes("@") ? limpio : `${limpio}@${siteConfig.team.usernameDomain}`;
}
