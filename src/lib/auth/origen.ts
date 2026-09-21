import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env";

/**
 * Origen público de la petición actual (p. ej. https://insolvenciaefectiva.com o una URL de
 * vista previa). Se usa para construir los enlaces de retorno de Supabase Auth.
 */
export async function obtenerOrigen(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const protocolo =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${protocolo}://${host}`;
  }
  return env.NEXT_PUBLIC_SITE_URL;
}
