import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { rutaSegura } from "@/lib/auth/rutas";
import { createClient } from "@/lib/supabase/server";

const TIPOS_OTP: readonly EmailOtpType[] = [
  "invite",
  "recovery",
  "email",
  "email_change",
  "signup",
  "magiclink",
];

/**
 * Enlaces enviados por correo (invitación al equipo y recuperación de contraseña).
 * Admite plantillas con token_hash y el flujo PKCE con code.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const codigo = searchParams.get("code");
  const siguiente =
    rutaSegura(searchParams.get("siguiente") ?? searchParams.get("next")) ??
    "/actualizar-contrasena";

  const supabase = await createClient();

  if (tokenHash && tipo && TIPOS_OTP.includes(tipo)) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(siguiente, origin));
    console.error("Error al verificar el enlace:", error.message);
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(siguiente, origin));
    console.error("Error al verificar el enlace:", error.message);
  }

  return NextResponse.redirect(new URL("/ingresar?error=enlace", origin));
}
