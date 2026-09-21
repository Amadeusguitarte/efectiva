"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { siteConfig } from "@/config/site";
import type { EstadoAccion } from "@/lib/acciones";
import { requerirCliente } from "@/lib/auth/sesion";
import { createClient } from "@/lib/supabase/server";

export async function aceptarPoliticaDatos(
  _estado: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const usuario = await requerirCliente();

  if (formData.get("acepto") !== "si") {
    return {
      ok: false,
      mensaje: "Para continuar debes autorizar el tratamiento de tus datos.",
      errores: { acepto: ["Marca la casilla para continuar."] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("consentimientos").insert({
    perfil_id: usuario.id,
    tipo: "tratamiento_datos",
    version: siteConfig.legal.politicaDatosVersion,
    user_agent: (await headers()).get("user-agent")?.slice(0, 500) ?? null,
  });

  // 23505: ya estaba registrado (p. ej. doble clic); se considera aceptado.
  if (error && error.code !== "23505") {
    console.error("Error al registrar el consentimiento:", error.message);
    return { ok: false, mensaje: "No pudimos registrar tu autorización. Inténtalo de nuevo." };
  }

  revalidatePath("/portal");
  return { ok: true };
}
