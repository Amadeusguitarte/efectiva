import { Check } from "lucide-react";

import { ETAPAS_PROCESO, INFO_ESTADO } from "@/lib/propuestas/estados";
import { cn } from "cn";

type ProgresoPropuestaProps = {
  /** Índice de la etapa actual dentro de ETAPAS_PROCESO. */
  etapaActual: number;
  /** En pausa (requiere información o cancelada) la etapa actual no se muestra como activa. */
  enPausa?: boolean;
};

/** Línea de etapas del proceso, legible también sin color (número, check y texto). */
export function ProgresoPropuesta({ etapaActual, enPausa }: ProgresoPropuestaProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2">
      {ETAPAS_PROCESO.map((etapa, indice) => {
        const completada =
          indice < etapaActual || (etapa === "finalizada" && indice === etapaActual);
        const actual = indice === etapaActual && !completada;
        return (
          <li
            key={etapa}
            aria-current={actual ? "step" : undefined}
            className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2"
          >
            <div className="flex items-center gap-2 sm:w-full">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  completada && "border-primary bg-primary text-primary-foreground",
                  actual &&
                    !enPausa &&
                    "border-primary bg-background text-primary ring-4 ring-primary/15",
                  actual && enPausa && "border-warning bg-background text-warning",
                  !completada && !actual && "border-border bg-background text-muted-foreground",
                )}
              >
                {completada ? <Check className="size-4" aria-hidden /> : indice + 1}
              </span>
              {indice < ETAPAS_PROCESO.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-0.5 flex-1 rounded-full sm:block",
                    indice < etapaActual ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "text-sm",
                actual || completada ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {INFO_ESTADO[etapa].etiqueta}
              <span className="sr-only">
                {completada ? " (completada)" : actual ? " (etapa actual)" : " (pendiente)"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
