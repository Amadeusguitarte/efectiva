import type { Metadata } from "next";

import { EstadoWhatsApp } from "@/components/configuracion/estado-whatsapp";
import { InstructivoWhatsApp } from "@/components/configuracion/instructivos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerCuentaWhatsApp } from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "WhatsApp",
};

export default async function ConfiguracionWhatsAppPage() {
  const cuenta = await obtenerCuentaWhatsApp();
  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cuenta de WhatsApp</CardTitle>
          <CardDescription>
            Número vinculado al CRM. Los mensajes entrantes crean casos; las respuestas salen desde
            el panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EstadoWhatsApp inicial={cuenta} />
        </CardContent>
      </Card>
      <InstructivoWhatsApp />
    </div>
  );
}
