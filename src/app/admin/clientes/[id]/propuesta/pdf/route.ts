import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requerirAdmin } from "@/lib/auth/sesion";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { obtenerRedaccionPropuesta } from "@/lib/datos/redaccion";
import {
  construirContenidoPropuesta,
  nombreArchivoPropuesta,
  REDACCION_VACIA,
} from "@/lib/propuestas/contenido";
import { renderizarPropuestaPdf } from "@/lib/propuestas/pdf/documento";

export const dynamic = "force-dynamic";

function respuestaTexto(mensaje: string, status: number) {
  return new NextResponse(mensaje, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Propuesta legal en PDF, generada al momento con la matriz de diagnóstico y la redacción del
 * equipo. Solo para administradores; se muestra en el navegador (`inline`) para revisarla y
 * descargarla.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/admin/clientes/[id]/propuesta/pdf">,
) {
  await requerirAdmin();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return respuestaTexto("Cliente no encontrado.", 404);

  const [diagnostico, redaccion] = await Promise.all([
    obtenerDiagnosticoCliente(id),
    obtenerRedaccionPropuesta(id),
  ]);
  if (!diagnostico) return respuestaTexto("Cliente no encontrado.", 404);
  if (!diagnostico.existe) {
    return respuestaTexto("Primero registra la matriz de diagnóstico del cliente.", 409);
  }

  const contenido = construirContenidoPropuesta(
    diagnostico.datosPropuesta,
    redaccion?.redaccion ?? REDACCION_VACIA,
  );
  if (contenido.errores.length > 0) {
    return respuestaTexto(
      `La matriz tiene errores por resolver antes de generar la propuesta:\n- ${contenido.errores.join("\n- ")}`,
      409,
    );
  }

  const pdf = await renderizarPropuestaPdf(contenido);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivoPropuesta(diagnostico.cliente.nombre)}"`,
      "Cache-Control": "no-store",
    },
  });
}
