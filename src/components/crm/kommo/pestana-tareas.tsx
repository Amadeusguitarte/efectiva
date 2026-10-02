"use client";

import { Check, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { cambiarEstadoTarea } from "@/app/admin/crm/acciones";
import { INFO_TIPO_TAREA, type EstadoTarea } from "@/lib/crm/catalogos";
import { claveDia, textoFechaDia } from "@/lib/crm/linea-tiempo";
import type { TareaCaso } from "@/lib/datos/crm";
import { cn } from "cn";

import { BotonLinea } from "./piezas";

/**
 * Pestaña «Tareas» del panel: las pendientes del caso con su plazo y responsable, y las cerradas
 * plegadas. Las tareas nuevas se crean desde el compositor del feed (modo Tarea), como en Kommo.
 */
export function PestanaTareas({
  tareas,
  ahora,
  alNuevaTarea,
}: {
  tareas: TareaCaso[];
  ahora: string;
  alNuevaTarea: () => void;
}) {
  const hoy = claveDia(ahora);
  const pendientes = tareas
    .filter((t) => t.estado === "pendiente")
    .sort((a, b) => (a.venceAt ?? "9999").localeCompare(b.venceAt ?? "9999"));
  const cerradas = tareas.filter((t) => t.estado !== "pendiente");

  return (
    <div>
      <BotonLinea onClick={alNuevaTarea}>Nueva tarea</BotonLinea>
      {pendientes.length === 0 ? (
        <p className="px-5 py-4 text-[15px] text-crm-hora">No hay tareas pendientes.</p>
      ) : (
        <ul>
          {pendientes.map((tarea) => (
            <FilaTareaPanel key={tarea.id} tarea={tarea} hoy={hoy} ahora={ahora} />
          ))}
        </ul>
      )}
      {cerradas.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer px-5 py-3 text-sm text-crm-hora hover:text-crm-texto">
            {cerradas.length} {cerradas.length === 1 ? "tarea cerrada" : "tareas cerradas"}
          </summary>
          <ul>
            {cerradas.map((tarea) => (
              <FilaTareaPanel key={tarea.id} tarea={tarea} hoy={hoy} ahora={ahora} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function FilaTareaPanel({ tarea, hoy, ahora }: { tarea: TareaCaso; hoy: string; ahora: string }) {
  const [pendiente, startTransition] = useTransition();
  const completada = tarea.estado === "completada";
  const abierta = tarea.estado === "pendiente";
  const vencida = abierta && tarea.venceAt !== null && tarea.venceAt < hoy;

  function cambiar(estado: EstadoTarea) {
    startTransition(async () => {
      const resultado = await cambiarEstadoTarea(tarea.id, estado);
      if (!resultado.ok) toast.error(resultado.mensaje ?? "No se pudo actualizar la tarea.");
    });
  }

  return (
    <li className="group/tarea flex items-start gap-3 border-b border-crm-borde px-5 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={completada}
        aria-label={`Marcar «${tarea.titulo}» como ${completada ? "pendiente" : "completada"}`}
        disabled={pendiente || tarea.estado === "cancelada"}
        onClick={() => cambiar(completada ? "pendiente" : "completada")}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
          completada
            ? "border-crm-etiqueta bg-crm-etiqueta text-white"
            : "border-crm-borde-fuerte text-transparent hover:border-crm-etiqueta hover:text-crm-etiqueta",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[15px] leading-snug text-crm-texto",
            !abierta && "text-crm-hora line-through",
          )}
        >
          {tarea.titulo}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-1.5 text-xs text-crm-hora">
          <span>{INFO_TIPO_TAREA[tarea.tipo].etiqueta}</span>
          {tarea.venceAt ? (
            <span className={cn(vencida && "font-bold text-crm-contador")}>
              · {vencida ? "Venció" : "Vence"} {textoFechaDia(tarea.venceAt, ahora).toLowerCase()}
            </span>
          ) : null}
          {tarea.responsable ? <span>· {tarea.responsable.nombre}</span> : null}
          {tarea.estado === "cancelada" ? <span>· Cancelada</span> : null}
        </p>
      </div>
      {abierta ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => cambiar("cancelada")}
          className="rounded-sm p-1 text-crm-hora transition-opacity hover:bg-crm-feed hover:text-crm-texto focus-visible:opacity-100 lg:opacity-0 lg:group-hover/tarea:opacity-100"
          aria-label={`Cancelar la tarea «${tarea.titulo}»`}
          title="Cancelar tarea"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </li>
  );
}
