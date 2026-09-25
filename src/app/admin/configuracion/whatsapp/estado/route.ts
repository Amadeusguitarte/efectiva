import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { obtenerCuentaWhatsApp } from "@/lib/datos/crm";

export const dynamic = "force-dynamic";

/** Estado de la cuenta de WhatsApp y el QR como imagen, para la pantalla de configuración. */
export async function GET() {
  // obtenerCuentaWhatsApp exige sesión de admin.
  const cuenta = await obtenerCuentaWhatsApp();
  if (!cuenta) {
    return NextResponse.json(
      { error: "Sin cuenta" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const qrImagen =
    cuenta.estado === "qr" && cuenta.qr
      ? await QRCode.toDataURL(cuenta.qr, { margin: 1, width: 288 })
      : null;
  return NextResponse.json(
    {
      estado: cuenta.estado,
      telefono: cuenta.telefono,
      qrImagen,
      workerActivo: cuenta.workerActivo,
      ultimoError: cuenta.ultimoError,
      conectadoAt: cuenta.conectadoAt,
      actualizadoAt: cuenta.actualizadoAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
