import { NextResponse } from "next/server";

import { obtenerNotificaciones } from "@/lib/datos/crm";

export const dynamic = "force-dynamic";

/** Notificaciones del usuario en sesión (la campana del panel las consulta cada medio minuto). */
export async function GET() {
  // obtenerNotificaciones exige sesión de admin (redirige si no la hay).
  const datos = await obtenerNotificaciones(15);
  return NextResponse.json(datos, { headers: { "Cache-Control": "no-store" } });
}
