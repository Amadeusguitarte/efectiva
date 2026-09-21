import { CircleCheck, CircleHelp, CircleX, type LucideIcon } from "lucide-react";

import type { EstadoElegibilidad } from "@/lib/diagnostico/calcular";
import { cn } from "cn";

const INFO: Record<EstadoElegibilidad, { etiqueta: string; clase: string; Icono: LucideIcon }> = {
  elegible: {
    etiqueta: "Elegible",
    clase: "border-success/25 bg-success-soft text-success",
    Icono: CircleCheck,
  },
  no_elegible: {
    etiqueta: "No elegible",
    clase: "border-destructive/20 bg-danger-soft text-destructive",
    Icono: CircleX,
  },
  sin_datos: {
    etiqueta: "Sin datos",
    clase: "border-border bg-secondary text-secondary-foreground",
    Icono: CircleHelp,
  },
};

export function ElegibilidadBadge({
  estado,
  className,
}: {
  estado: EstadoElegibilidad;
  className?: string;
}) {
  const { etiqueta, clase, Icono } = INFO[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        clase,
        className,
      )}
    >
      <Icono className="size-3.5" aria-hidden />
      {etiqueta}
    </span>
  );
}
