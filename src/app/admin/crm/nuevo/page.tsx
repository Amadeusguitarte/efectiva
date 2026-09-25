import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FormularioCaso } from "@/components/crm/formulario-caso";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Card, CardContent } from "@/components/ui/card";
import { obtenerEquipo, obtenerEtapas } from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "Nuevo caso",
};

export default async function NuevoCasoPage() {
  const [etapas, equipo] = await Promise.all([obtenerEtapas(), obtenerEquipo()]);

  return (
    <>
      <Link
        href="/admin/crm"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Pipeline
      </Link>
      <EncabezadoPagina
        titulo="Nuevo caso"
        descripcion="Para personas que llegan por otro medio. Las que escriben por WhatsApp o correo se crean solas."
      />
      <Card className="max-w-2xl">
        <CardContent>
          <FormularioCaso etapas={etapas} equipo={equipo} />
        </CardContent>
      </Card>
    </>
  );
}
