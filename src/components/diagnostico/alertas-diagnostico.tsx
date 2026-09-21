import { CircleAlert, TriangleAlert } from "lucide-react";

import type { Alerta } from "@/lib/diagnostico/calcular";
import { cn } from "cn";

/** Lista de inconsistencias detectadas por el motor: errores (bloquean la propuesta) y avisos. */
export function AlertasDiagnostico({
  alertas,
  className,
}: {
  alertas: readonly Alerta[];
  className?: string;
}) {
  if (alertas.length === 0) return null;
  return (
    <ul className={cn("grid gap-2", className)} aria-label="Alertas del diagnóstico">
      {alertas.map((alerta, indice) => {
        const esError = alerta.nivel === "error";
        const Icono = esError ? CircleAlert : TriangleAlert;
        return (
          <li
            key={`${alerta.codigo}-${alerta.obligacion ?? indice}`}
            className={cn(
              "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
              esError
                ? "border-destructive/20 bg-danger-soft text-destructive"
                : "border-warning/25 bg-warning-soft text-warning",
            )}
          >
            <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">{esError ? "Error: " : "Aviso: "}</span>
              {alerta.mensaje}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
