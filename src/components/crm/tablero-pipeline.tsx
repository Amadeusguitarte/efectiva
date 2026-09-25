"use client";

import { AlertTriangle, CalendarClock, CheckSquare, Mail, Phone } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { moverEtapaCaso } from "@/app/admin/crm/acciones";
import { formatearTelefono } from "@/lib/crm/telefono";
import type { CasoResumen, Etapa } from "@/lib/datos/crm";
import { formatearFecha } from "@/lib/formato";
import { cn } from "cn";

import { AvatarEquipo } from "./avatar-equipo";
import { IconoCanal, InsigniaPrioridad, PuntoEtapa } from "./insignias";

type TableroPipelineProps = { etapas: Etapa[]; casos: CasoResumen[] };

function TarjetaCaso({
  caso,
  arrastrando,
  onDragStart,
  onDragEnd,
}: {
  caso: CasoResumen;
  arrastrando: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
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
        "relative grid cursor-grab gap-2 rounded-lg border bg-background p-3 shadow-xs transition-opacity active:cursor-grabbing",
        arrastrando && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/crm/casos/${caso.id}` as Route}
          className="min-w-0 truncate text-sm font-medium text-foreground after:absolute after:inset-0 hover:text-primary"
        >
          {caso.nombre}
        </Link>
        {caso.responsable ? (
          <AvatarEquipo nombre={caso.responsable.nombre} className="relative z-10" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {caso.telefono ? (
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3" aria-hidden />
            {formatearTelefono(caso.telefono)}
          </span>
        ) : null}
        {caso.email ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{caso.email}</span>
          </span>
        ) : null}
      </div>

      {caso.proximaAccion ? (
        <p className="flex items-start gap-1.5 text-xs text-foreground">
          <CalendarClock className="mt-0.5 size-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            {caso.proximaAccion}
            {caso.proximaAccionFecha ? (
              <span className="text-muted-foreground">
                {" "}
                · {formatearFecha(caso.proximaAccionFecha)}
              </span>
            ) : null}
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {caso.origen ? (
          <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
            <IconoCanal canal={caso.origen} className="size-3" />
            {caso.origen === "whatsapp" ? "WhatsApp" : "Correo"}
          </span>
        ) : null}
        {caso.sinResponder ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
            <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
            Sin responder
          </span>
        ) : null}
        {caso.prioridad ? <InsigniaPrioridad prioridad={caso.prioridad} /> : null}
        {caso.tareasPendientes > 0 ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]",
              caso.tareasVencidas > 0 ? "border-warning/40 text-warning" : "text-muted-foreground",
            )}
          >
            {caso.tareasVencidas > 0 ? (
              <AlertTriangle className="size-3" aria-hidden />
            ) : (
              <CheckSquare className="size-3" aria-hidden />
            )}
            {caso.tareasPendientes} {caso.tareasPendientes === 1 ? "tarea" : "tareas"}
            {caso.tareasVencidas > 0 ? ` (${caso.tareasVencidas} vencidas)` : ""}
          </span>
        ) : null}
      </div>
    </li>
  );
}

/** Tablero kanban: una columna por etapa; arrastra las tarjetas para moverlas de etapa. */
type Movimiento = { desde: string; hacia: string };

export function TableroPipeline({ etapas, casos: casosServidor }: TableroPipelineProps) {
  const router = useRouter();
  // Movimientos optimistas: se aplican mientras el servidor aún muestre la etapa de origen.
  const [movimientos, setMovimientos] = useState<Record<string, Movimiento>>({});
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [columnaActiva, setColumnaActiva] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const casos = casosServidor.map((c) => {
    const movimiento = movimientos[c.id];
    return movimiento && movimiento.desde === c.etapaId ? { ...c, etapaId: movimiento.hacia } : c;
  });

  function soltar(etapaId: string, casoId: string) {
    const caso = casos.find((c) => c.id === casoId);
    const enServidor = casosServidor.find((c) => c.id === casoId);
    if (!caso || !enServidor || caso.etapaId === etapaId) return;
    setMovimientos((actuales) => ({
      ...actuales,
      [casoId]: { desde: enServidor.etapaId, hacia: etapaId },
    }));
    startTransition(async () => {
      const resultado = await moverEtapaCaso(casoId, etapaId);
      if (!resultado.ok) {
        setMovimientos((actuales) => {
          const resto = { ...actuales };
          delete resto[casoId];
          return resto;
        });
        toast.error(resultado.mensaje ?? "No pudimos mover el caso.");
        return;
      }
      toast.success(resultado.mensaje ?? "Caso movido.");
      router.refresh();
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
      <ol className="flex min-h-[60vh] gap-4" style={{ minWidth: `${etapas.length * 18}rem` }}>
        {etapas.map((etapa) => {
          const enEtapa = casos.filter((c) => c.etapaId === etapa.id);
          return (
            <li
              key={etapa.id}
              onDragOver={(evento) => {
                evento.preventDefault();
                evento.dataTransfer.dropEffect = "move";
                if (columnaActiva !== etapa.id) setColumnaActiva(etapa.id);
              }}
              onDragLeave={() =>
                setColumnaActiva((actual) => (actual === etapa.id ? null : actual))
              }
              onDrop={(evento) => {
                evento.preventDefault();
                const casoId = evento.dataTransfer.getData("text/plain");
                setColumnaActiva(null);
                setArrastrando(null);
                if (casoId) soltar(etapa.id, casoId);
              }}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-surface-soft/70 transition-colors",
                columnaActiva === etapa.id && "border-primary bg-primary/5",
              )}
            >
              <header className="flex items-center gap-2 border-b px-3 py-2.5">
                <PuntoEtapa color={etapa.color} />
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {etapa.nombre}
                </h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                  {enEtapa.length}
                </span>
              </header>
              {etapa.descripcion ? (
                <p className="px-3 pt-2 text-xs text-muted-foreground">{etapa.descripcion}</p>
              ) : null}
              <ul className="grid flex-1 content-start gap-2 p-2">
                {enEtapa.map((caso) => (
                  <TarjetaCaso
                    key={caso.id}
                    caso={caso}
                    arrastrando={arrastrando === caso.id}
                    onDragStart={() => setArrastrando(caso.id)}
                    onDragEnd={() => {
                      setArrastrando(null);
                      setColumnaActiva(null);
                    }}
                  />
                ))}
                {enEtapa.length === 0 ? (
                  <li className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                    Sin casos
                  </li>
                ) : null}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
