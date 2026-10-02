import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotonAnalizarPendientes } from "@/components/crm/boton-analizar-pendientes";
import { FiltrosPipeline } from "@/components/crm/filtros-pipeline";
import { ALTO_VISTA_CRM, BarraCrm } from "@/components/crm/kommo/barra-crm";
import { TableroPipeline, type ProximaTarea } from "@/components/crm/tablero-pipeline";
import { requerirAdmin } from "@/lib/auth/sesion";
import { contarCasosActivos, filtrarCasos, ordenarEtapas } from "@/lib/crm/pipeline";
import { fechaBogota } from "@/lib/crm/plazos";
import {
  listarCasosPipeline,
  listarTareas,
  obtenerAjustes,
  obtenerEquipo,
  type FiltrosPipeline as FiltrosCasos,
} from "@/lib/datos/crm";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Pipeline",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function PipelinePage({ searchParams }: PageProps<"/admin/crm">) {
  const usuario = await requerirAdmin();
  const parametros = await searchParams;
  const canalParam = texto(parametros.canal);
  const tareasParam = texto(parametros.tareas);
  const filtros: FiltrosCasos = {
    busqueda: texto(parametros.q),
    responsable: texto(parametros.responsable),
    canal: canalParam === "whatsapp" || canalParam === "correo" ? canalParam : undefined,
  };

  const [pipeline, equipo, ajustes, pendientes] = await Promise.all([
    listarCasosPipeline(filtros),
    obtenerEquipo(),
    obtenerAjustes(),
    listarTareas({ estado: "pendiente" }),
  ]);
  const etapas = ordenarEtapas(pipeline.etapas);
  const casos = filtrarCasos(pipeline.casos, {
    sinResponder: texto(parametros.sin_responder) === "1",
    tareas: tareasParam === "sin" || tareasParam === "vencidas" ? tareasParam : undefined,
  });

  // La tarea pendiente que vence antes de cada caso (la lista ya viene por vencimiento).
  const proximasTareas: Record<string, ProximaTarea> = {};
  for (const tarea of pendientes) {
    proximasTareas[tarea.caso.id] ??= { titulo: tarea.titulo, venceAt: tarea.venceAt };
  }
  const activos = contarCasosActivos(etapas, casos);

  return (
    <div className={cn(ALTO_VISTA_CRM, "flex flex-col")}>
      <BarraCrm
        titulo="Pipeline"
        centro={
          <>
            <div className="min-w-0 flex-1 basis-64 lg:max-w-3xl">
              <FiltrosPipeline equipo={equipo} usuarioId={usuario.id} />
            </div>
            <p className="shrink-0 text-sm whitespace-nowrap text-crm-texto-suave">
              {activos} {activos === 1 ? "caso activo" : "casos activos"}
            </p>
          </>
        }
        acciones={
          <>
            <BotonAnalizarPendientes iaActiva={ajustes.ia.activo && ajustes.ia.tieneClave} />
            <Link
              href="/admin/crm/nuevo"
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[3px] bg-crm-seleccion px-3.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-crm-seleccion/90 focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo caso
            </Link>
          </>
        }
      />
      <TableroPipeline
        etapas={etapas}
        casos={casos}
        proximasTareas={proximasTareas}
        equipo={equipo}
        hoy={fechaBogota()}
        className="flex-1"
      />
    </div>
  );
}
