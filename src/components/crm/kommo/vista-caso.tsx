"use client";

import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { CanalCrm } from "@/lib/crm/catalogos";
import { textoDiasEnEtapa } from "@/lib/crm/linea-tiempo";
import type { CasoDetalle, Etapa, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import { AvatarContacto } from "./avatar-contacto";
import type { ModoCompositor } from "./compositor";
import { FeedCaso } from "./feed-caso";
import { PanelCaso } from "./panel-caso";

// Panel plegado en el inbox: preferencia de cada navegador (localStorage), leída sin romper la
// hidratación (el servidor y el primer render lo muestran abierto).
const CLAVE_PANEL = "crm:panel-caso";
const oyentesPanel = new Set<() => void>();

function suscribirPanel(oyente: () => void) {
  oyentesPanel.add(oyente);
  window.addEventListener("storage", oyente);
  return () => {
    oyentesPanel.delete(oyente);
    window.removeEventListener("storage", oyente);
  };
}

function panelPlegado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_PANEL) === "plegado";
  } catch {
    return false;
  }
}

function guardarPanelPlegado(plegado: boolean) {
  try {
    if (plegado) window.localStorage.setItem(CLAVE_PANEL, "plegado");
    else window.localStorage.removeItem(CLAVE_PANEL);
  } catch {
    // Sin almacenamiento (modo privado): el estado dura lo que dure la página.
  }
  for (const oyente of oyentesPanel) oyente();
}

type VistaCasoProps = {
  caso: CasoDetalle;
  etapas: Etapa[];
  equipo: MiembroEquipo[];
  ajustes: { whatsappConectado: boolean; correoActivo: boolean; iaActiva: boolean };
  ahora: string;
  canalInicial: CanalCrm;
  /** En el inbox el panel se pliega; en la ficha la flecha vuelve al pipeline. */
  contexto: "bandeja" | "ficha";
  /** A dónde lleva «‹» en móvil (la lista del inbox o el pipeline). */
  hrefVolver: Route;
  className?: string;
};

/**
 * Caso abierto como en Kommo: el panel del lead (azul petróleo) y, a su derecha, el feed con el
 * compositor. En pantallas pequeñas se ve el feed y el panel abre como hoja lateral.
 */
export function VistaCaso({
  caso,
  etapas,
  equipo,
  ajustes,
  ahora,
  canalInicial,
  contexto,
  hrefVolver,
  className,
}: VistaCasoProps) {
  const [modo, setModo] = useState<ModoCompositor>("chat");
  const [foco, setFoco] = useState(0);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const plegadoGuardado = useSyncExternalStore(suscribirPanel, panelPlegado, () => false);
  const plegado = contexto === "bandeja" && plegadoGuardado;

  function pedirCompositor(nuevo: ModoCompositor) {
    setModo(nuevo);
    setFoco((valor) => valor + 1);
    setHojaAbierta(false);
  }

  const propsPanel = {
    caso,
    etapas,
    equipo,
    iaActiva: ajustes.iaActiva,
    ahora,
    enlaceFicha: contexto === "bandeja",
    alPedirCompositor: pedirCompositor,
  };

  return (
    <div className={cn("relative flex min-h-0 min-w-0", className)}>
      {/* Escritorio: panel fijo a la izquierda del feed (plegable en el inbox). */}
      {!plegado ? (
        <div className="relative hidden w-[21rem] shrink-0 lg:flex xl:w-[22rem] 2xl:w-[24rem]">
          <PanelCaso
            {...propsPanel}
            className="w-full border-r border-crm-borde"
            volver={
              contexto === "bandeja"
                ? {
                    etiqueta: "Plegar el panel del caso",
                    alPulsar: () => guardarPanelPlegado(true),
                  }
                : { etiqueta: "Volver al pipeline", href: hrefVolver }
            }
          />
          {contexto === "bandeja" ? (
            <button
              type="button"
              onClick={() => guardarPanelPlegado(true)}
              className="absolute top-3 -right-4 z-10 flex h-8 w-4 items-center justify-center rounded-r-sm bg-crm-panel text-white hover:bg-crm-panel-hondo"
              aria-label="Plegar el panel del caso"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => guardarPanelPlegado(false)}
          className="absolute top-3 left-0 z-10 hidden h-8 w-4 items-center justify-center rounded-r-sm bg-crm-panel text-white hover:bg-crm-panel-hondo lg:flex"
          aria-label="Mostrar el panel del caso"
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}

      <FeedCaso
        caso={caso}
        equipo={equipo}
        canalInicial={canalInicial}
        whatsappConectado={ajustes.whatsappConectado}
        correoActivo={ajustes.correoActivo}
        ahora={ahora}
        modo={modo}
        foco={foco}
        alPedirModo={pedirCompositor}
        className="flex-1"
        encabezado={
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-crm-borde bg-background px-2 lg:hidden">
            <Link
              href={hrefVolver}
              className="rounded-sm p-1.5 text-crm-hora hover:bg-crm-feed hover:text-crm-texto"
              aria-label={contexto === "bandeja" ? "Volver a la lista" : "Volver al pipeline"}
            >
              <ChevronLeft className="size-5" />
            </Link>
            <AvatarContacto nombre={caso.nombre} canal={caso.origen} semilla={caso.id} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-crm-texto">{caso.nombre}</p>
              <p className="truncate text-xs text-crm-hora">
                {caso.etapa.nombre} ({textoDiasEnEtapa(caso.diasEnEtapa)})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHojaAbierta(true)}
              className="flex items-center gap-1.5 rounded-sm bg-crm-panel px-2.5 py-1.5 text-sm font-bold text-white"
            >
              <PanelLeft className="size-4" aria-hidden />
              Caso #{caso.codigo}
            </button>
          </div>
        }
      />

      {/* Móvil y tableta: el panel abre como hoja lateral. */}
      <Sheet open={hojaAbierta} onOpenChange={setHojaAbierta}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(24rem,92vw)] gap-0 p-0 font-crm text-crm-texto sm:max-w-none lg:hidden"
        >
          <SheetTitle className="sr-only">Caso #{caso.codigo}</SheetTitle>
          <SheetDescription className="sr-only">Datos, etapa y tareas del caso.</SheetDescription>
          <PanelCaso
            {...propsPanel}
            className="h-full"
            volver={{ etiqueta: "Cerrar el panel del caso", alPulsar: () => setHojaAbierta(false) }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
