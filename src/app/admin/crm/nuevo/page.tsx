import type { Metadata } from "next";

import { FormularioCaso } from "@/components/crm/formulario-caso";
import { ALTO_VISTA_CRM } from "@/components/crm/kommo/barra-crm";
import { requerirAdmin } from "@/lib/auth/sesion";
import { ordenarEtapas } from "@/lib/crm/pipeline";
import { obtenerEquipo, obtenerEtapas } from "@/lib/datos/crm";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Nuevo caso",
};

export default async function NuevoCasoPage({ searchParams }: PageProps<"/admin/crm/nuevo">) {
  const usuario = await requerirAdmin();
  const [{ etapa }, etapas, equipo] = await Promise.all([
    searchParams,
    obtenerEtapas(),
    obtenerEquipo(),
  ]);
  // «Agregar rápido» de una columna del pipeline llega con ?etapa=<id>.
  const etapaInicial =
    typeof etapa === "string" && etapas.some((e) => e.id === etapa) ? etapa : undefined;
  // Como en Kommo, el responsable por defecto es quien crea el caso.
  const responsableInicial = equipo.some((m) => m.id === usuario.id) ? usuario.id : undefined;

  return (
    <div className={cn(ALTO_VISTA_CRM, "flex flex-col")}>
      <FormularioCaso
        etapas={ordenarEtapas(etapas)}
        equipo={equipo}
        etapaInicial={etapaInicial}
        responsableInicial={responsableInicial}
      />
    </div>
  );
}
