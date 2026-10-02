"use client";

import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { moverEtapaCaso } from "@/app/admin/crm/acciones";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { indicadorTareas, totalesPorColumna } from "@/lib/crm/pipeline";
import type { CasoResumen, Etapa, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import { TarjetaCaso } from "./kommo/tarjeta-caso";

export type ProximaTarea = { titulo: string; venceAt: string | null };

type TableroPipelineProps = {
  /** Ya ordenadas: en curso y, al final, las de cierre. */
  etapas: Etapa[];
  casos: CasoResumen[];
  /** Tarea pendiente que vence antes, por id de caso. */
  proximasTareas: Record<string, ProximaTarea>;
  equipo: MiembroEquipo[];
  /** Fecha de hoy en Bogotá (AAAA-MM-DD), calculada en el servidor. */
  hoy: string;
  className?: string;
};

/** Movimiento optimista: se aplica mientras el servidor aún muestre la etapa de origen. */
type Movimiento = { desde: string; hacia: string };

/** Movimiento que espera confirmación (correo automático o descarte). */
type Confirmacion = { caso: CasoResumen; etapa: Etapa; tipo: "correo" | "perdido" };

/**
 * Tablero del pipeline como la vista «Leads» de Kommo: una columna por etapa con su línea de
 * color, el conteo y «Agregar rápido»; cada columna con su propio scroll. Las tarjetas se
 * arrastran entre columnas (o se mueven con su menú) y el cambio se ve al instante.
 */
export function TableroPipeline({
  etapas,
  casos: casosServidor,
  proximasTareas,
  equipo,
  hoy,
  className,
}: TableroPipelineProps) {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState<Record<string, Movimiento>>({});
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [columnaActiva, setColumnaActiva] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [motivo, setMotivo] = useState("");
  const [, startTransition] = useTransition();

  const casos = casosServidor.map((c) => {
    const movimiento = movimientos[c.id];
    return movimiento && movimiento.desde === c.etapaId ? { ...c, etapaId: movimiento.hacia } : c;
  });
  const totales = totalesPorColumna(etapas, casos);
  const avatares = new Map(equipo.map((m) => [m.id, m.avatarUrl]));

  function mover(casoId: string, etapaId: string, motivoCambio?: string) {
    const enServidor = casosServidor.find((c) => c.id === casoId);
    if (!enServidor) return;
    setMovimientos((actuales) => ({
      ...actuales,
      [casoId]: { desde: enServidor.etapaId, hacia: etapaId },
    }));
    startTransition(async () => {
      // El esquema acepta texto o nada (no null).
      const resultado = await moverEtapaCaso(casoId, etapaId, motivoCambio || undefined);
      if (!resultado.ok) {
        setMovimientos((actuales) => {
          const resto = { ...actuales };
          delete resto[casoId];
          return resto;
        });
        toast.error(resultado.mensaje ?? "No pudimos mover el caso.");
        return;
      }
      const etapa = etapas.find((e) => e.id === etapaId);
      toast.success(etapa ? `Movido a «${etapa.nombre}».` : "Caso movido.");
      router.refresh();
    });
  }

  /** Mueve en el acto o pide confirmación si la etapa envía un correo o descarta el caso. */
  function solicitarMovimiento(casoId: string, etapaId: string) {
    const caso = casos.find((c) => c.id === casoId);
    const etapa = etapas.find((e) => e.id === etapaId);
    if (!caso || !etapa || caso.etapaId === etapaId) return;
    if (etapa.correoAutomatico && caso.email) {
      setConfirmacion({ caso, etapa, tipo: "correo" });
      return;
    }
    if (etapa.cierre === "perdido") {
      setMotivo("");
      setConfirmacion({ caso, etapa, tipo: "perdido" });
      return;
    }
    mover(casoId, etapaId);
  }

  function confirmar() {
    if (!confirmacion) return;
    mover(
      confirmacion.caso.id,
      confirmacion.etapa.id,
      confirmacion.tipo === "perdido" ? motivo.trim() : undefined,
    );
    setConfirmacion(null);
  }

  return (
    <div className={cn("min-h-0 overflow-x-auto overflow-y-hidden bg-crm-feed", className)}>
      <ol className="grid h-full auto-cols-[minmax(14.5rem,1fr)] grid-flow-col grid-rows-[minmax(0,1fr)]">
        {etapas.map((etapa) => {
          const enEtapa = casos.filter((c) => c.etapaId === etapa.id);
          const total = totales[etapa.id];
          return (
            <li
              key={etapa.id}
              aria-label={`${etapa.nombre}: ${total?.casos ?? 0} casos`}
              onDragOver={(evento) => {
                if (!arrastrando) return;
                evento.preventDefault();
                evento.dataTransfer.dropEffect = "move";
                if (columnaActiva !== etapa.id) setColumnaActiva(etapa.id);
              }}
              onDragLeave={(evento) => {
                if (evento.currentTarget.contains(evento.relatedTarget as Node | null)) return;
                setColumnaActiva((actual) => (actual === etapa.id ? null : actual));
              }}
              onDrop={(evento) => {
                evento.preventDefault();
                const casoId = evento.dataTransfer.getData("text/plain");
                setColumnaActiva(null);
                setArrastrando(null);
                if (casoId) solicitarMovimiento(casoId, etapa.id);
              }}
              className={cn(
                "flex h-full min-h-0 flex-col border-r border-crm-borde transition-colors last:border-r-0",
                columnaActiva === etapa.id && "bg-crm-seleccion-suave",
              )}
            >
              <header
                className="shrink-0 px-3 pt-3 text-center"
                title={etapa.descripcion ?? undefined}
              >
                <h2 className="truncate text-xs font-bold tracking-wider text-crm-texto uppercase">
                  {etapa.nombre}
                </h2>
                <div
                  aria-hidden
                  className="mt-2 h-[3px] rounded-full"
                  style={{ backgroundColor: etapa.color }}
                />
                <p className="mt-1.5 text-xs text-crm-hora">
                  {total?.casos ?? 0} {total?.casos === 1 ? "caso" : "casos"}
                  {total?.sinResponder ? (
                    <span className="text-crm-contador"> · {total.sinResponder} sin responder</span>
                  ) : null}
                </p>
              </header>

              <Link
                href={`/admin/crm/nuevo?etapa=${etapa.id}` as Route}
                className="mx-2 mt-2 inline-flex shrink-0 items-center justify-center gap-1 rounded-[3px] border border-dashed border-crm-borde-fuerte py-1 text-xs text-crm-hora transition-colors hover:border-crm-seleccion hover:bg-background hover:text-crm-seleccion focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none"
              >
                <Plus className="size-3" aria-hidden />
                Agregar rápido
                <span className="sr-only"> en {etapa.nombre}</span>
              </Link>

              <ul className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-1.5 overflow-y-auto px-2 pt-2 pb-4">
                {enEtapa.map((caso) => (
                  <TarjetaCaso
                    key={caso.id}
                    caso={caso}
                    etapas={etapas}
                    indicador={indicadorTareas(caso, proximasTareas[caso.id] ?? null, hoy)}
                    hoy={hoy}
                    avatarResponsable={
                      caso.responsable ? (avatares.get(caso.responsable.id) ?? null) : null
                    }
                    arrastrando={arrastrando === caso.id}
                    onDragStart={() => setArrastrando(caso.id)}
                    onDragEnd={() => {
                      setArrastrando(null);
                      setColumnaActiva(null);
                    }}
                    onMover={(etapaId) => solicitarMovimiento(caso.id, etapaId)}
                  />
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <AlertDialog
        open={confirmacion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setConfirmacion(null);
        }}
      >
        <AlertDialogContent className="font-crm text-crm-texto sm:max-w-md">
          {confirmacion?.tipo === "correo" ? (
            <AlertDialogHeader>
              <AlertDialogTitle>¿Mover a «{confirmacion.etapa.nombre}»?</AlertDialogTitle>
              <AlertDialogDescription className="text-crm-texto-suave">
                Al entrar en esta etapa se envía automáticamente el correo «
                {confirmacion.etapa.correoAutomatico?.asunto}» a{" "}
                <span className="font-bold text-crm-texto">{confirmacion.caso.email}</span>
                {confirmacion.etapa.tareasAutomaticas.length > 0
                  ? ` y se crean ${confirmacion.etapa.tareasAutomaticas.length} ${confirmacion.etapa.tareasAutomaticas.length === 1 ? "tarea" : "tareas"}`
                  : ""}
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
          ) : confirmacion ? (
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿Mover a {confirmacion.caso.nombre} a «{confirmacion.etapa.nombre}»?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-crm-texto-suave">
                El caso sale del embudo activo. Puedes anotar el motivo; queda en el historial.
              </AlertDialogDescription>
              <label className="mt-2 grid gap-1.5 text-left text-sm">
                <span className="text-crm-texto-suave">Motivo (opcional)</span>
                <Textarea
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </label>
            </AlertDialogHeader>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[3px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmar}
              className="rounded-[3px] bg-crm-seleccion font-bold text-white hover:bg-crm-seleccion/90"
            >
              {confirmacion?.tipo === "correo" ? "Mover y enviar correo" : "Mover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
