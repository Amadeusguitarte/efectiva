"use client";

import { CalendarClock, FileText, ListTodo, PhoneCall, X, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cambiarEstadoTarea } from "@/app/admin/crm/acciones";
import { AvatarEquipo } from "@/components/crm/avatar-equipo";
import {
  INFO_TIPO_TAREA,
  type CanalCrm,
  type EstadoTarea,
  type TipoTarea,
} from "@/lib/crm/catalogos";
import { agruparTareasPorPlazo, vencimientoRelativo, type TonoVencimiento } from "@/lib/crm/plazos";
import type { TareaLista } from "@/lib/datos/crm";
import { cn } from "cn";

import { AvatarContacto } from "./avatar-contacto";

export type TareaConContacto = TareaLista & {
  caso: TareaLista["caso"] & { canal: CanalCrm | null; contacto: string | null };
  responsable: (TareaLista["responsable"] & { avatarUrl: string | null }) | null;
};

const ICONO_TIPO: Record<TipoTarea, LucideIcon> = {
  documentos: FileText,
  recontacto: PhoneCall,
  seguimiento: CalendarClock,
  otra: ListTodo,
};

const TONO_FECHA: Record<TonoVencimiento, string> = {
  vencida: "font-bold text-crm-contador",
  hoy: "font-bold text-success",
  pronto: "text-crm-texto",
  normal: "text-crm-texto",
  sin_fecha: "text-crm-hora",
};

/** Cambio de estado optimista: vale mientras el servidor siga mostrando el estado de origen. */
type Cambio = { desde: EstadoTarea; hacia: EstadoTarea };

function FilaTarea({
  tarea,
  hoy,
  onCambiar,
  ocupada,
}: {
  tarea: TareaConContacto;
  hoy: string;
  onCambiar: (estado: EstadoTarea) => void;
  ocupada: boolean;
}) {
  const pendiente = tarea.estado === "pendiente";
  const completada = tarea.estado === "completada";
  const vencimiento = vencimientoRelativo(tarea.venceAt, hoy, pendiente);
  const Icono = ICONO_TIPO[tarea.tipo];

  return (
    <li
      className={cn(
        "group flex items-start gap-3 border-b border-crm-borde px-3 py-2.5 transition-colors last:border-b-0 hover:bg-crm-seleccion-suave/40 md:px-4",
        !pendiente && "bg-crm-feed/60",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-crm-seleccion disabled:cursor-default md:mt-1"
        checked={completada}
        disabled={ocupada || tarea.estado === "cancelada"}
        onChange={(evento) => onCambiar(evento.target.checked ? "completada" : "pendiente")}
        aria-label={`Marcar «${tarea.titulo}» como ${completada ? "pendiente" : "completada"}`}
      />

      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 md:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,15rem)_9rem] md:items-center md:gap-x-5 xl:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,18rem)_13rem]">
        <p
          className={cn(
            "order-3 self-center text-right text-xs md:order-0 md:text-left md:text-sm",
            TONO_FECHA[vencimiento.tono],
          )}
        >
          {tarea.venceAt ? (
            <time dateTime={tarea.venceAt}>{vencimiento.texto}</time>
          ) : (
            vencimiento.texto
          )}
        </p>

        <div className="order-1 col-span-2 min-w-0 md:order-0 md:col-span-1">
          <p
            className={cn(
              "flex min-w-0 items-baseline gap-1.5 text-sm text-crm-texto",
              !pendiente && "text-crm-hora line-through",
            )}
          >
            <Icono className="size-3.5 shrink-0 translate-y-0.5 text-crm-hora" aria-hidden />
            <span className="shrink-0 font-bold">{INFO_TIPO_TAREA[tarea.tipo].etiqueta}:</span>
            <span className="line-clamp-2 min-w-0 break-words md:line-clamp-1">{tarea.titulo}</span>
          </p>
          {tarea.descripcion ? (
            <p className="truncate pl-5 text-xs text-crm-texto-suave" title={tarea.descripcion}>
              {tarea.descripcion}
            </p>
          ) : null}
          {tarea.estado === "cancelada" ? (
            <p className="pl-5 text-xs text-crm-hora">Cancelada</p>
          ) : null}
        </div>

        <Link
          href={`/admin/crm/casos/${tarea.caso.id}` as Route}
          className="order-2 flex min-w-0 items-center gap-2 rounded-[3px] focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none md:order-0"
        >
          <AvatarContacto
            nombre={tarea.caso.nombre}
            canal={tarea.caso.canal}
            semilla={tarea.caso.id}
            tamano="sm"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-crm-seleccion hover:underline">
              {tarea.caso.nombre}
            </span>
            {tarea.caso.contacto ? (
              <span className="hidden truncate text-xs text-crm-texto-suave md:block">
                {tarea.caso.contacto}
              </span>
            ) : null}
          </span>
        </Link>

        <p className="order-4 col-span-2 flex min-w-0 items-center gap-1.5 text-xs text-crm-texto-suave md:order-0 md:col-span-1">
          {tarea.responsable ? (
            <>
              <AvatarEquipo
                nombre={tarea.responsable.nombre}
                avatarUrl={tarea.responsable.avatarUrl}
                className="size-5"
              />
              <span className="truncate">{tarea.responsable.nombre}</span>
            </>
          ) : (
            <span className="text-crm-hora">Sin asignar</span>
          )}
        </p>
      </div>

      {pendiente ? (
        <button
          type="button"
          disabled={ocupada}
          onClick={() => onCambiar("cancelada")}
          aria-label={`Cancelar la tarea «${tarea.titulo}»`}
          title="Cancelar tarea"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-[3px] text-crm-hora opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-crm-feed hover:text-crm-contador focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none [@media(hover:none)]:opacity-100"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : (
        <span className="size-6 shrink-0" aria-hidden />
      )}
    </li>
  );
}

/**
 * Lista de tareas como la de Kommo: agrupada por plazo (vencidas en rojo, hoy, mañana, esta
 * semana, más adelante y sin fecha), con casilla para completarlas al instante.
 */
export function ListaTareas({
  tareas: tareasServidor,
  hoy,
}: {
  tareas: TareaConContacto[];
  hoy: string;
}) {
  const router = useRouter();
  const [cambios, setCambios] = useState<Record<string, Cambio>>({});
  const [ocupadas, setOcupadas] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();

  // Se agrupa con el estado del servidor: la fila marcada se queda en su sitio (tachada) hasta
  // que llega la lista nueva, como en Kommo.
  const grupos = agruparTareasPorPlazo(tareasServidor, hoy);
  function conCambio(tarea: TareaConContacto): TareaConContacto {
    const cambio = cambios[tarea.id];
    return cambio && cambio.desde === tarea.estado ? { ...tarea, estado: cambio.hacia } : tarea;
  }

  /** `tarea` es la del servidor: su estado es el de origen del cambio. */
  function cambiar(tarea: TareaConContacto, estado: EstadoTarea) {
    setCambios((actuales) => ({ ...actuales, [tarea.id]: { desde: tarea.estado, hacia: estado } }));
    setOcupadas((actuales) => new Set(actuales).add(tarea.id));
    startTransition(async () => {
      const resultado = await cambiarEstadoTarea(tarea.id, estado);
      setOcupadas((actuales) => {
        const siguientes = new Set(actuales);
        siguientes.delete(tarea.id);
        return siguientes;
      });
      if (!resultado.ok) {
        setCambios((actuales) => {
          const resto = { ...actuales };
          delete resto[tarea.id];
          return resto;
        });
        toast.error(resultado.mensaje ?? "No se pudo actualizar la tarea.");
        return;
      }
      if (estado === "completada") toast.success(`Tarea completada: ${tarea.titulo}`);
      else if (estado === "cancelada") toast.success(`Tarea cancelada: ${tarea.titulo}`);
      router.refresh();
    });
  }

  if (grupos.length === 0) {
    return (
      <div className="rounded-[3px] border border-crm-borde bg-background px-4 py-14 text-center text-sm text-crm-hora">
        No hay tareas en esta vista.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div
        aria-hidden
        className="hidden grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,15rem)_9rem] gap-x-5 pr-13 pl-11 text-[11px] font-bold tracking-wider text-crm-hora uppercase md:grid xl:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,18rem)_13rem]"
      >
        <span>Fecha</span>
        <span>Tarea</span>
        <span>Caso</span>
        <span>Responsable</span>
      </div>
      {grupos.map((grupo) => {
        const vencidas = grupo.clave === "vencidas";
        return (
          <section key={grupo.clave} aria-labelledby={`grupo-${grupo.clave}`}>
            <h2
              id={`grupo-${grupo.clave}`}
              className={cn(
                "mb-1.5 flex items-center gap-2 px-1 text-xs font-bold tracking-wider uppercase",
                vencidas ? "text-crm-contador" : "text-crm-texto-suave",
              )}
            >
              {grupo.etiqueta}
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums",
                  vencidas ? "bg-crm-contador text-white" : "bg-crm-borde text-crm-texto-suave",
                )}
              >
                {grupo.tareas.length}
              </span>
            </h2>
            <ul
              className={cn(
                "overflow-hidden rounded-[3px] border border-crm-borde bg-background",
                vencidas && "border-l-[3px] border-l-crm-contador",
              )}
            >
              {grupo.tareas.map((tarea) => (
                <FilaTarea
                  key={tarea.id}
                  tarea={conCambio(tarea)}
                  hoy={hoy}
                  ocupada={ocupadas.has(tarea.id)}
                  onCambiar={(estado) => cambiar(tarea, estado)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
