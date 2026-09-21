import { INFO_ESTADO, type EstadoPropuesta, type TonoEstado } from "@/lib/propuestas/estados";
import { cn } from "cn";

const ESTILOS_TONO: Record<TonoEstado, string> = {
  neutral: "border-border bg-secondary text-secondary-foreground",
  info: "border-primary/20 bg-info-soft text-info",
  warning: "border-warning/25 bg-warning-soft text-warning",
  success: "border-success/25 bg-success-soft text-success",
  danger: "border-destructive/20 bg-danger-soft text-destructive",
};

const ESTILOS_PUNTO: Record<TonoEstado, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
  danger: "bg-destructive",
};

export function EstadoBadge({
  estado,
  className,
}: {
  estado: EstadoPropuesta;
  className?: string;
}) {
  const { etiqueta, tono } = INFO_ESTADO[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        ESTILOS_TONO[tono],
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", ESTILOS_PUNTO[tono])} />
      {etiqueta}
    </span>
  );
}
