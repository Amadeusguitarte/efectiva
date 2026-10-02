"use client";

import { Check, ChevronDown, Loader2, Mail } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { textoDiasEnEtapa } from "@/lib/crm/linea-tiempo";
import type { Etapa } from "@/lib/datos/crm";
import { cn } from "cn";

/**
 * Etapa del caso como en la ficha de un lead de Kommo: el nombre con los días que lleva en ella y
 * debajo la barra segmentada del pipeline, rellena hasta la etapa actual con su color. Al pulsar
 * se despliegan las etapas para mover el caso.
 */
export function SelectorEtapa({
  etapas,
  etapaActualId,
  diasEnEtapa,
  pendiente,
  alElegir,
}: {
  etapas: Etapa[];
  etapaActualId: string;
  diasEnEtapa: number;
  pendiente: boolean;
  alElegir: (etapa: Etapa) => void;
}) {
  const indiceActual = etapas.findIndex((e) => e.id === etapaActualId);
  const actual = etapas[indiceActual];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pendiente}
        className="group block w-full px-5 pt-3 pb-3.5 text-left outline-none hover:bg-crm-panel-hondo/40 focus-visible:bg-crm-panel-hondo/60"
        aria-label={`Etapa: ${actual?.nombre ?? "sin etapa"}. Cambiar etapa`}
      >
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[15px]">
            <span className="font-bold text-white">{actual?.nombre ?? "Sin etapa"}</span>{" "}
            <span className="text-crm-panel-suave">({textoDiasEnEtapa(diasEnEtapa)})</span>
          </span>
          {pendiente ? (
            <Loader2 className="size-4 animate-spin text-crm-panel-suave" aria-hidden />
          ) : (
            <ChevronDown
              className="size-4 text-crm-panel-suave transition-transform group-data-[state=open]:rotate-180"
              aria-hidden
            />
          )}
        </span>
        <span aria-hidden className="mt-2 flex gap-0.5">
          {etapas.map((etapa, indice) => (
            <span
              key={etapa.id}
              className={cn(
                "h-1 flex-1 first:rounded-l-full last:rounded-r-full",
                indice > indiceActual && "bg-crm-panel-hondo",
              )}
              style={
                indice <= indiceActual && actual ? { backgroundColor: actual.color } : undefined
              }
            />
          ))}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) font-crm text-crm-texto"
      >
        {etapas.map((etapa) => {
          const esActual = etapa.id === etapaActualId;
          return (
            <DropdownMenuItem
              key={etapa.id}
              disabled={esActual}
              onSelect={() => alElegir(etapa)}
              className="gap-2.5 py-2 text-[15px]"
            >
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: etapa.color }}
              />
              <span className="min-w-0 flex-1 truncate">{etapa.nombre}</span>
              {etapa.correoAutomatico ? (
                <Mail className="size-3.5 text-crm-hora" aria-label="Envía un correo automático" />
              ) : null}
              {esActual ? <Check className="size-4 text-crm-seleccion" aria-hidden /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
