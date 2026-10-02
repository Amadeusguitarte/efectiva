"use client";

import { ChevronLeft, ExternalLink, FolderOpen, MoreHorizontal, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  aplicarEtapaSugerida,
  asignarResponsableCaso,
  eliminarCaso,
  moverEtapaCaso,
} from "@/app/admin/crm/acciones";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INFO_CANAL } from "@/lib/crm/catalogos";
import { fechaNumerica } from "@/lib/crm/linea-tiempo";
import type { CasoDetalle, Etapa, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import type { ModoCompositor } from "./compositor";
import { ContactoCaso } from "./contacto-caso";
import { ExpedientePanel } from "./expediente-panel";
import { PestanaAnalisis } from "./pestana-analisis";
import { PestanaTareas } from "./pestana-tareas";
import { BOTON_CRM, BotonLinea, CONTROL_CRM, FilaDato } from "./piezas";
import { ProximaAccion } from "./proxima-accion";
import { SelectorEtapa } from "./selector-etapa";

type Pestana = "principal" | "analisis" | "tareas";

/** Cambio de etapa en espera de confirmación (la etapa nueva envía un correo automático). */
type CambioEtapa = { etapa: Etapa; desde: "selector" | "ia" };

export type VolverPanel = { etiqueta: string } & ({ href: Route } | { alPulsar: () => void });

type PanelCasoProps = {
  caso: CasoDetalle;
  etapas: Etapa[];
  equipo: MiembroEquipo[];
  iaActiva: boolean;
  ahora: string;
  /** Flecha «‹» de la cabecera: en la ficha vuelve al pipeline; en el inbox pliega el panel. */
  volver: VolverPanel;
  /** En el inbox, el menú «…» ofrece abrir la ficha completa del caso. */
  enlaceFicha?: boolean;
  /** Lleva al compositor del feed en el modo pedido («Agregar nota», «Nueva tarea»). */
  alPedirCompositor: (modo: ModoCompositor) => void;
  className?: string;
};

/**
 * Panel del caso con la estética de la ficha de un lead en Kommo: cabecera azul petróleo con el
 * código, las etiquetas, la etapa con su barra de progreso y las pestañas; debajo, en blanco,
 * los datos del caso, el contacto y las acciones.
 */
export function PanelCaso({
  caso,
  etapas,
  equipo,
  iaActiva,
  ahora,
  volver,
  enlaceFicha = false,
  alPedirCompositor,
  className,
}: PanelCasoProps) {
  const idPestanas = useId();
  const [pestana, setPestana] = useState<Pestana>("principal");
  const [cambioPendiente, setCambioPendiente] = useState<CambioEtapa | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [moviendo, startMover] = useTransition();
  const [asignando, startAsignar] = useTransition();
  const [eliminando, startEliminar] = useTransition();

  const tareasPendientes = caso.tareas.filter((t) => t.estado === "pendiente").length;

  function ejecutarCambio({ etapa, desde }: CambioEtapa) {
    setCambioPendiente(null);
    startMover(async () => {
      const resultado =
        desde === "ia"
          ? await aplicarEtapaSugerida(caso.id)
          : await moverEtapaCaso(caso.id, etapa.id);
      if (!resultado.ok) {
        toast.error(resultado.mensaje ?? "No pudimos mover el caso.");
        return;
      }
      const tareas = etapa.tareasAutomaticas.length;
      toast.success(
        `El caso pasó a «${etapa.nombre}».${tareas ? ` Se ${tareas === 1 ? "creó 1 tarea" : `crearon ${tareas} tareas`}.` : ""}`,
      );
    });
  }

  /** Si la etapa envía un correo automático (y el caso tiene correo), se pide confirmación antes. */
  function pedirCambio(etapa: Etapa, desde: CambioEtapa["desde"]) {
    if (etapa.id === caso.etapa.id) return;
    if (etapa.correoAutomatico && caso.email) setCambioPendiente({ etapa, desde });
    else ejecutarCambio({ etapa, desde });
  }

  function cambiarResponsable(responsableId: string) {
    startAsignar(async () => {
      const resultado = await asignarResponsableCaso(caso.id, responsableId || null);
      if (resultado.ok) toast.success(resultado.mensaje ?? "Responsable actualizado.");
      else toast.error(resultado.mensaje ?? "No pudimos asignar el responsable.");
    });
  }

  const etiquetas: { texto: string; tono?: "alerta" | "aviso" }[] = [];
  if (caso.analisis) {
    etiquetas.push({
      texto: `Prioridad ${caso.analisis.prioridad}`,
      tono:
        caso.analisis.prioridad === "alta"
          ? "alerta"
          : caso.analisis.prioridad === "media"
            ? "aviso"
            : undefined,
    });
  }
  if (caso.origen) etiquetas.push({ texto: INFO_CANAL[caso.origen].etiqueta });
  if (caso.sinResponder) etiquetas.push({ texto: "Sin responder", tono: "alerta" });
  if (caso.cliente) etiquetas.push({ texto: "Con expediente" });

  const claseVolver =
    "mt-1 -ml-1.5 rounded-sm p-0.5 text-crm-panel-suave transition-colors hover:text-white focus-visible:text-white";

  return (
    <section
      aria-label={`Caso ${caso.nombre}`}
      className={cn("flex min-h-0 flex-col bg-background", className)}
    >
      <div className="shrink-0 bg-crm-panel text-white">
        <div className="flex items-start gap-1.5 px-5 pt-4">
          {"href" in volver ? (
            <Link href={volver.href} className={claseVolver} aria-label={volver.etiqueta}>
              <ChevronLeft className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={volver.alPulsar}
              className={claseVolver}
              aria-label={volver.etiqueta}
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[22px] leading-tight font-bold tracking-tight">
              Caso #{caso.codigo}
            </h2>
            <p className="truncate text-sm text-crm-panel-suave">{caso.nombre}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="mt-1 rounded-sm p-1 text-white/90 outline-none hover:bg-white/10 focus-visible:bg-white/10"
              aria-label="Más acciones del caso"
            >
              <MoreHorizontal className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 font-crm text-crm-texto">
              {enlaceFicha ? (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/crm/casos/${caso.id}` as Route}>
                    <ExternalLink />
                    Abrir ficha completa
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {caso.cliente ? (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/clientes/${caso.cliente.id}` as Route}>
                    <FolderOpen />
                    Abrir expediente del cliente
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {enlaceFicha || caso.cliente ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmarEliminar(true)}>
                <Trash2 />
                Eliminar caso
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {etiquetas.length > 0 ? (
          <ul className="flex flex-wrap gap-1 px-5 pt-3" aria-label="Etiquetas">
            {etiquetas.map((etiqueta) => (
              <li
                key={etiqueta.texto}
                className={cn(
                  "rounded-sm border px-1.5 text-[10px] leading-4 tracking-wide uppercase",
                  etiqueta.tono === "alerta"
                    ? "border-crm-contador bg-crm-contador text-white"
                    : etiqueta.tono === "aviso"
                      ? "border-warning bg-warning text-white"
                      : "border-crm-panel-suave text-crm-panel-suave",
                )}
              >
                {etiqueta.texto}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-2">
          <SelectorEtapa
            etapas={etapas}
            etapaActualId={caso.etapa.id}
            diasEnEtapa={caso.diasEnEtapa}
            pendiente={moviendo}
            alElegir={(etapa) => pedirCambio(etapa, "selector")}
          />
        </div>

        <div role="tablist" aria-label="Secciones del caso" className="flex gap-5 px-5">
          {(
            [
              ["principal", "Principal"],
              ["analisis", "Análisis IA"],
              ["tareas", tareasPendientes ? `Tareas (${tareasPendientes})` : "Tareas"],
            ] as const
          ).map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              id={`${idPestanas}-pestana-${valor}`}
              aria-selected={pestana === valor}
              aria-controls={`${idPestanas}-panel-${valor}`}
              onClick={() => setPestana(valor)}
              className={cn(
                "border-b-2 pt-1 pb-2 text-[15px] font-bold whitespace-nowrap transition-colors",
                pestana === valor
                  ? "border-white text-white"
                  : "border-transparent text-crm-panel-suave hover:text-white",
              )}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${idPestanas}-panel-${pestana}`}
        aria-labelledby={`${idPestanas}-pestana-${pestana}`}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {pestana === "principal" ? (
          <>
            <div className="border-b border-crm-borde px-5 py-3 text-[15px]">
              <dl>
                <FilaDato etiqueta="Usuario resp.">
                  <select
                    aria-label="Usuario responsable"
                    value={caso.responsable?.id ?? ""}
                    disabled={asignando}
                    onChange={(evento) => cambiarResponsable(evento.target.value)}
                    className={cn(CONTROL_CRM, "-ml-1.5")}
                  >
                    <option value="">Sin asignar</option>
                    {equipo.map((miembro) => (
                      <option key={miembro.id} value={miembro.id}>
                        {miembro.nombre}
                      </option>
                    ))}
                  </select>
                </FilaDato>
              </dl>
              <ProximaAccion
                key={`${caso.proximaAccion}-${caso.proximaAccionFecha}`}
                casoId={caso.id}
                proximaAccion={caso.proximaAccion}
                proximaAccionFecha={caso.proximaAccionFecha}
                ahora={ahora}
              />
              <ExpedientePanel caso={caso} />
              <dl>
                <FilaDato etiqueta="Creado">
                  <span className="text-crm-texto-suave">{fechaNumerica(caso.createdAt)}</span>
                </FilaDato>
              </dl>
            </div>
            <ContactoCaso caso={caso} />
            <BotonLinea onClick={() => alPedirCompositor("nota")}>Agregar nota</BotonLinea>
            <BotonLinea onClick={() => alPedirCompositor("tarea")}>Agregar tarea</BotonLinea>
          </>
        ) : null}

        {pestana === "analisis" ? (
          <PestanaAnalisis
            casoId={caso.id}
            analisis={caso.analisis}
            etapaActualId={caso.etapa.id}
            iaActiva={iaActiva}
            hayMensajes={caso.mensajes.length > 0}
            ahora={ahora}
            moviendoEtapa={moviendo}
            alAplicarEtapa={(etapaId) => {
              const etapa = etapas.find((e) => e.id === etapaId);
              if (etapa) pedirCambio(etapa, "ia");
            }}
          />
        ) : null}

        {pestana === "tareas" ? (
          <PestanaTareas
            tareas={caso.tareas}
            ahora={ahora}
            alNuevaTarea={() => alPedirCompositor("tarea")}
          />
        ) : null}
      </div>

      <AlertDialog
        open={cambioPendiente !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setCambioPendiente(null);
        }}
      >
        <AlertDialogContent className="font-crm text-crm-texto">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pasar el caso a «{cambioPendiente?.etapa.nombre}»?</AlertDialogTitle>
            <AlertDialogDescription className="text-crm-texto-suave">
              Al entrar en esta etapa se envía un correo automático a{" "}
              <strong className="text-crm-texto">{caso.email}</strong>
              {cambioPendiente?.etapa.correoAutomatico
                ? ` con el asunto «${cambioPendiente.etapa.correoAutomatico.asunto}»`
                : ""}
              .
              {cambioPendiente?.etapa.tareasAutomaticas.length
                ? ` También se crean ${cambioPendiente.etapa.tareasAutomaticas.length} ${cambioPendiente.etapa.tareasAutomaticas.length === 1 ? "tarea" : "tareas"}.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <button
              type="button"
              className={BOTON_CRM}
              onClick={() => {
                if (cambioPendiente) ejecutarCambio(cambioPendiente);
              }}
            >
              Mover y enviar el correo
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent className="font-crm text-crm-texto">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el caso de {caso.nombre}?</AlertDialogTitle>
            <AlertDialogDescription className="text-crm-texto-suave">
              Se borran también sus mensajes, tareas, notas e historial. No se puede deshacer. El
              expediente del cliente, si lo tiene, no se toca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <button
              type="button"
              disabled={eliminando}
              className={cn(BOTON_CRM, "bg-destructive")}
              onClick={() =>
                startEliminar(async () => {
                  const resultado = await eliminarCaso(caso.id);
                  if (!resultado.ok) toast.error(resultado.mensaje ?? "No se pudo eliminar.");
                })
              }
            >
              <Trash2 />
              Eliminar caso
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
