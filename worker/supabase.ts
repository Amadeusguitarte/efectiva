import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { EntornoWorker } from "./entorno";

/** Cliente de Supabase con la clave secreta: salta RLS. Solo vive en el worker. */
export function crearSupabase(entorno: EntornoWorker) {
  return createClient<Database>(entorno.supabaseUrl, entorno.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": "insolvencia-efectiva-worker" } },
  });
}

export type SupabaseWorker = ReturnType<typeof crearSupabase>;
