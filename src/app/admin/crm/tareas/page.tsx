import type { Metadata } from "next";

import { ALTO_VISTA_CRM, BarraCrm } from "@/components/crm/kommo/barra-crm";
import { FiltrosTareas, type VistaTareas } from "@/components/crm/kommo/filtros-tareas";
import { ListaTareas, type TareaConContacto } from "@/components/crm/kommo/lista-tareas";
import { requerirAdmin } from "@/lib/auth/sesion";
import { fechaBogota } from "@/lib/crm/plazos";
import { formatearTelefono } from "@/lib/crm/telefono";
import { listarCasosPipeline, listarTareas, obtenerEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Tareas",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function TareasPage({ searchParams }: PageProps<"/admin/crm/tareas">) {
  const usuario = await requerirAdmin();
  const parametros = await searchParams;
  const vistaParam = texto(parametros.vista);
  const vista: VistaTareas =
    vistaParam === "completadas" || vistaParam === "todas" ? vistaParam : "pendientes";
  const responsable = texto(parametros.responsable);

  const [tareas, equipo, { casos }] = await Promise.all([
    listarTareas({
      estado:
        vista === "pendientes" ? "pendiente" : vista === "completadas" ? "completada" : undefined,
      responsable,
    }),
    obtenerEquipo(),
    // Canal y contacto de cada caso, para el avatar y la línea del contacto.
    listarCasosPipeline(),
  ]);

  const casosPorId = new Map(casos.map((c) => [c.id, c]));
  const avatares = new Map(equipo.map((m) => [m.id, m.avatarUrl]));
  const conContacto: TareaConContacto[] = tareas.map((tarea) => {
    const caso = casosPorId.get(tarea.caso.id);
    return {
      ...tarea,
      caso: {
        ...tarea.caso,
        canal: caso?.origen ?? null,
        contacto: caso?.telefono ? formatearTelefono(caso.telefono) : (caso?.email ?? null),
      },
      responsable: tarea.responsable
        ? { ...tarea.responsable, avatarUrl: avatares.get(tarea.responsable.id) ?? null }
        : null,
    };
  });

  const pendientes = tareas.filter((t) => t.estado === "pendiente").length;
  const vencidas = tareas.filter((t) => t.vencida).length;

  return (
    <div className={cn(ALTO_VISTA_CRM, "flex flex-col")}>
      <BarraCrm
        titulo="Tareas"
        detalle={
          <>
            {vista === "completadas"
              ? `${tareas.length} ${tareas.length === 1 ? "completada" : "completadas"}`
              : `${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"}`}
            {vencidas ? (
              <span className="font-bold text-crm-contador">
                {" "}
                · {vencidas} {vencidas === 1 ? "vencida" : "vencidas"}
              </span>
            ) : null}
          </>
        }
        centro={
          <FiltrosTareas
            vista={vista}
            responsable={responsable}
            equipo={equipo}
            usuarioId={usuario.id}
          />
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto bg-crm-feed">
        <div className="w-full px-3 py-4 md:px-6 md:py-5">
          <ListaTareas tareas={conContacto} hoy={fechaBogota()} />
        </div>
      </div>
    </div>
  );
}
