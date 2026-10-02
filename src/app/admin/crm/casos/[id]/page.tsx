import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ActualizacionPeriodica } from "@/components/crm/kommo/actualizacion-periodica";
import { ALTO_VISTA_CRM } from "@/components/crm/kommo/barra-crm";
import { VistaCaso } from "@/components/crm/kommo/vista-caso";
import { obtenerAjustes, obtenerCaso, obtenerEquipo, obtenerEtapas } from "@/lib/datos/crm";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Caso",
};

/**
 * Ficha del caso con la distribución de la página de un lead en Kommo: el panel del caso a la
 * izquierda (alto completo, con su propio scroll) y el feed con el compositor a la derecha.
 */
export default async function CasoPage({ params }: PageProps<"/admin/crm/casos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [caso, etapas, equipo, ajustes] = await Promise.all([
    obtenerCaso(id),
    obtenerEtapas(),
    obtenerEquipo(),
    obtenerAjustes(),
  ]);
  if (!caso) notFound();

  return (
    <div className={cn("flex min-h-0", ALTO_VISTA_CRM)}>
      <ActualizacionPeriodica />
      <VistaCaso
        caso={caso}
        etapas={etapas}
        equipo={equipo}
        ajustes={{
          whatsappConectado: ajustes.whatsapp?.estado === "conectado",
          correoActivo: ajustes.correo.activo && ajustes.correo.tieneContrasena,
          iaActiva: ajustes.ia.activo && ajustes.ia.tieneClave,
        }}
        ahora={new Date().toISOString()}
        canalInicial={caso.origen ?? (caso.telefono ? "whatsapp" : "correo")}
        contexto="ficha"
        hrefVolver="/admin/crm"
        className="flex-1"
      />
    </div>
  );
}
