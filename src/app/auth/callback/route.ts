import { NextResponse, type NextRequest } from "next/server";

import { rutaSegura } from "@/lib/auth/rutas";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorno del inicio de sesión con Google (flujo PKCE). Los clientes van a su portal; si quien
 * entra es del equipo, el portal lo redirige al panel.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const siguiente = rutaSegura(searchParams.get("siguiente")) ?? "/portal";

  if (codigo) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) {
      return NextResponse.redirect(new URL(siguiente, origin));
    }
    console.error("Error al completar el inicio de sesión:", error.message);
  }

  return NextResponse.redirect(new URL("/ingresar?error=auth", origin));
}
