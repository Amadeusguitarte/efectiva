import { cn } from "cn";

/** Punto con el color de una etapa del pipeline. */
export function PuntoEtapa({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}
