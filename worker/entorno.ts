import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { claveDesdeEntorno } from "@/lib/crm/cifrado";

/**
 * Variables del worker. En local se leen de `.env.local` (sin dependencias); en Railway vienen
 * del servicio. El worker es el único proceso que usa la clave secreta de Supabase.
 */

export type EntornoWorker = {
  supabaseUrl: string;
  supabaseSecretKey: string;
  claveCifrado: Buffer | null;
};

function cargarArchivoEnv(ruta: string) {
  if (!existsSync(ruta)) return;
  for (const linea of readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const igual = limpia.indexOf("=");
    if (igual === -1) continue;
    const clave = limpia.slice(0, igual).trim();
    let valor = limpia.slice(igual + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (process.env[clave] === undefined) process.env[clave] = valor;
  }
}

export function cargarEntorno(): EntornoWorker {
  cargarArchivoEnv(resolve(process.cwd(), ".env.local"));

  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const faltan = [
    !supabaseUrl ? "SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL)" : null,
    !supabaseSecretKey ? "SUPABASE_SECRET_KEY" : null,
  ].filter((v): v is string => v !== null);
  if (faltan.length > 0) {
    throw new Error(`Faltan variables para el worker: ${faltan.join(", ")}. Ver docs/crm.md.`);
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseSecretKey: supabaseSecretKey!,
    claveCifrado: claveDesdeEntorno(),
  };
}
