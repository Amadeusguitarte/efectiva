import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Solo las rutas de la plataforma necesitan sesión; la web pública queda estática.
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/ingresar",
    "/actualizar-contrasena",
    "/auth/:path*",
    "/documentos/:path*",
  ],
};
