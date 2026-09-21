import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { obtenerUsuario } from "@/lib/auth/sesion";
import { BUCKET_PROPUESTAS } from "@/lib/propuestas/documentos";
import { createClient } from "@/lib/supabase/server";

const SEGUNDOS_VALIDEZ = 60;

function noEncontrado() {
  return new NextResponse("Documento no disponible.", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Descarga del documento final. Redirige a una URL firmada de corta duración; los permisos los
 * garantizan RLS (la propuesta debe ser visible para el usuario) y las políticas de Storage
 * (un cliente solo accede a su propuesta finalizada).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/documentos/propuestas/[propuestaId]">,
) {
  const { propuestaId } = await params;
  if (!z.uuid().safeParse(propuestaId).success) return noEncontrado();

  const usuario = await obtenerUsuario();
  if (!usuario) {
    const login = new URL("/ingresar", request.nextUrl.origin);
    login.searchParams.set("siguiente", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const supabase = await createClient();
  const { data: propuesta } = await supabase
    .from("propuestas")
    .select("id, estado, documento_path")
    .eq("id", propuestaId)
    .maybeSingle();

  if (!propuesta?.documento_path) return noEncontrado();
  if (usuario.rol !== "admin" && propuesta.estado !== "finalizada") return noEncontrado();

  const { data, error } = await supabase.storage
    .from(BUCKET_PROPUESTAS)
    .createSignedUrl(propuesta.documento_path, SEGUNDOS_VALIDEZ, {
      download: "propuesta-insolvencia-efectiva.pdf",
    });

  if (error || !data) return noEncontrado();

  const respuesta = NextResponse.redirect(data.signedUrl);
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
}
