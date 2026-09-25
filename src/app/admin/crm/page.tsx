import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotonAnalizarPendientes } from "@/components/crm/boton-analizar-pendientes";
import { FiltrosPipeline } from "@/components/crm/filtros-pipeline";
import { TableroPipeline } from "@/components/crm/tablero-pipeline";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Button } from "@/components/ui/button";
import {
  listarCasosPipeline,
  obtenerAjustes,
  obtenerEquipo,
  type FiltrosPipeline as FiltrosCasos,
} from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "Pipeline",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function PipelinePage({ searchParams }: PageProps<"/admin/crm">) {
  const parametros = await searchParams;
  const canalParam = texto(parametros.canal);
  const filtros: FiltrosCasos = {
    busqueda: texto(parametros.q),
    responsable: texto(parametros.responsable),
    canal: canalParam === "whatsapp" || canalParam === "correo" ? canalParam : undefined,
  };

  const [{ etapas, casos }, equipo, ajustes] = await Promise.all([
    listarCasosPipeline(filtros),
    obtenerEquipo(),
    obtenerAjustes(),
  ]);
  const sinResponder = casos.filter((c) => c.sinResponder).length;

  return (
    <>
      <EncabezadoPagina
        titulo="Pipeline"
        descripcion={`${casos.length} ${casos.length === 1 ? "caso" : "casos"}${sinResponder ? ` · ${sinResponder} sin responder` : ""}. Arrastra las tarjetas para cambiar de etapa.`}
        acciones={
          <>
            <BotonAnalizarPendientes iaActiva={ajustes.ia.activo && ajustes.ia.tieneClave} />
            <Button asChild>
              <Link href="/admin/crm/nuevo">
                <UserPlus />
                Nuevo caso
              </Link>
            </Button>
          </>
        }
      />
      <FiltrosPipeline equipo={equipo} />
      <TableroPipeline etapas={etapas} casos={casos} />
    </>
  );
}
