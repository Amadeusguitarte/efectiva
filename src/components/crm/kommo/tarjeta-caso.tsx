"use client";

import { CalendarClock, Check, MoreHorizontal, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { AvatarEquipo } from "@/components/crm/avatar-equipo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INFO_CANAL, type Prioridad } from "@/lib/crm/catalogos";
import type { IndicadorTareas } from "@/lib/crm/pipeline";
import { fechaTarjeta, vencimientoRelativo } from "@/lib/crm/plazos";
import { formatearTelefono } from "@/lib/crm/telefono";
import type { CasoResumen, Etapa } from "@/lib/datos/crm";
import { cn } from "cn";

import { AvatarContacto } from "./avatar-contacto";

const TONO_INDICADOR: Record<IndicadorTareas["tono"], { punto: string; texto: string }> = {
  vencida: { punto: "bg-crm-contador", texto: "font-bold text-crm-contador" },
  hoy: { punto: "bg-success", texto: "font-bold text-success" },
  pendiente: { punto: "bg-crm-hora", texto: "text-crm-texto" },
  sin_tareas: { punto: "bg-warning", texto: "text-warning" },
};

const ETIQUETA_PRIORIDAD: Record<Prioridad, { texto: string; clase: string }> = {
  alta: { texto: "Prioridad alta", clase: "bg-crm-contador text-white" },
  media: { texto: "Prioridad media", clase: "bg-warning-soft text-warning" },
  baja: { texto: "Prioridad baja", clase: "bg-crm-feed text-crm-texto-suave" },
};

/** Etiqueta pequeña de las tarjetas, como las de Kommo. */
function Etiqueta({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center rounded-[3px] px-1 text-[10px] leading-none font-bold",
        className,
      )}
    >
      {children}
    </span>
  );
}

type TarjetaCasoProps = {
  caso: CasoResumen;
  etapas: Etapa[];
  indicador: IndicadorTareas;
  hoy: string;
  avatarResponsable: string | null;
  arrastrando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMover: (etapaId: string) => void;
};

/**
 * Tarjeta de un caso en el tablero, al estilo de las de Kommo: nombre en azul, contacto y
 * fecha, etiquetas, próxima acción y, abajo, el indicador de tareas y el responsable. Se
 * arrastra a otra columna o se mueve con su menú (teclado y pantallas táctiles).
 */
export function TarjetaCaso({
  caso,
  etapas,
  indicador,
  hoy,
  avatarResponsable,
  arrastrando,
  onDragStart,
  onDragEnd,
  onMover,
}: TarjetaCasoProps) {
  const contacto = caso.telefono ? formatearTelefono(caso.telefono) : caso.email;
  const proxima = caso.proximaAccionFecha
    ? vencimientoRelativo(caso.proximaAccionFecha, hoy)
    : null;
  const tono = TONO_INDICADOR[indicador.tono];

  return (
    <li
      draggable
      onDragStart={(evento) => {
        evento.dataTransfer.effectAllowed = "move";
        evento.dataTransfer.setData("text/plain", caso.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative cursor-grab rounded-[3px] border border-crm-borde bg-background px-2.5 pt-2 pb-1.5 shadow-xs transition-[opacity,border-color,box-shadow] hover:border-crm-borde-fuerte hover:shadow-sm active:cursor-grabbing",
        arrastrando && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        <AvatarContacto
          nombre={caso.nombre}
          canal={caso.origen}
          semilla={caso.id}
          tamano="sm"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          {/* Como en Kommo: arriba el contacto en gris y la fecha; debajo, el nombre en azul. */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate text-[11px] text-crm-texto-suave">
              {contacto || "Sin contacto"}
            </p>
            {caso.ultimoMensajeAt ? (
              <time
                dateTime={caso.ultimoMensajeAt}
                className="shrink-0 text-[11px] whitespace-nowrap text-crm-hora"
              >
                {fechaTarjeta(caso.ultimoMensajeAt, hoy)}
              </time>
            ) : null}
          </div>
          <Link
            href={`/admin/crm/casos/${caso.id}` as Route}
            draggable={false}
            className="line-clamp-2 text-[13px] leading-[1.15rem] font-bold break-words text-crm-seleccion after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:rounded-[3px] focus-visible:after:ring-2 focus-visible:after:ring-crm-seleccion"
          >
            {caso.nombre}
          </Link>
        </div>
      </div>

      {caso.origen || caso.sinResponder || caso.prioridad || caso.clienteId ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {caso.sinResponder ? (
            <span className="mr-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-crm-contador">
              <span aria-hidden className="size-1.5 rounded-full bg-crm-contador" />
              Sin responder
            </span>
          ) : null}
          {caso.origen ? (
            <Etiqueta className="bg-crm-etiqueta text-white">
              {INFO_CANAL[caso.origen].etiqueta}
            </Etiqueta>
          ) : null}
          {caso.prioridad ? (
            <Etiqueta className={ETIQUETA_PRIORIDAD[caso.prioridad].clase}>
              {ETIQUETA_PRIORIDAD[caso.prioridad].texto}
            </Etiqueta>
          ) : null}
          {caso.clienteId ? (
            <Etiqueta className="bg-crm-seleccion-suave text-crm-seleccion">Expediente</Etiqueta>
          ) : null}
        </div>
      ) : null}

      {caso.proximaAccion ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-crm-texto">
          <CalendarClock className="mt-0.5 size-3 shrink-0 text-crm-hora" aria-hidden />
          <span className="line-clamp-2 min-w-0">
            {caso.proximaAccion}
            {proxima ? (
              <span
                className={cn(
                  "whitespace-nowrap",
                  proxima.tono === "vencida" ? "font-bold text-crm-contador" : "text-crm-hora",
                )}
              >
                {" "}
                · {proxima.texto}
              </span>
            ) : null}
          </span>
        </p>
      ) : null}

      <div className="mt-1.5 flex items-center gap-2 border-t border-crm-borde pt-1.5">
        <p
          className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px]"
          title={indicador.detalle ? `${indicador.texto}: ${indicador.detalle}` : undefined}
        >
          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", tono.punto)} />
          <span className={cn("shrink-0", tono.texto)}>{indicador.texto}</span>
          {indicador.detalle ? (
            <span className="min-w-0 truncate text-crm-texto-suave">{indicador.detalle}</span>
          ) : null}
          {indicador.mas > 0 ? (
            <span className="shrink-0 text-crm-hora">+{indicador.mas}</span>
          ) : null}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mover a ${caso.nombre} de etapa`}
            className="relative z-10 inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] text-crm-hora opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-crm-feed hover:text-crm-texto focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-crm text-crm-texto">
            <DropdownMenuLabel className="text-xs font-normal text-crm-hora">
              Mover a la etapa
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {etapas.map((etapa) => {
              const actual = etapa.id === caso.etapaId;
              return (
                <DropdownMenuItem
                  key={etapa.id}
                  disabled={actual}
                  onSelect={() => onMover(etapa.id)}
                  className="gap-2"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: etapa.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{etapa.nombre}</span>
                  {actual ? <Check className="size-3.5" aria-label="Etapa actual" /> : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {caso.responsable ? (
          <AvatarEquipo
            nombre={caso.responsable.nombre}
            avatarUrl={avatarResponsable}
            className="relative z-10 size-5"
          />
        ) : (
          <span
            title="Sin responsable"
            className="relative z-10 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-crm-borde-fuerte text-crm-hora"
          >
            <UserRound className="size-3" aria-hidden />
            <span className="sr-only">Sin responsable</span>
          </span>
        )}
      </div>
    </li>
  );
}
