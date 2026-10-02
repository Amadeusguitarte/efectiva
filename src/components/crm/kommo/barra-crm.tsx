import type { ReactNode } from "react";

import { cn } from "cn";

/**
 * Barra superior de las vistas del CRM, como la de Kommo: título en mayúsculas a la izquierda,
 * un espacio central (búsqueda, filtros, totales) y las acciones a la derecha. Va pegada arriba
 * del área del CRM, que ocupa toda la pantalla.
 */
export function BarraCrm({
  titulo,
  detalle,
  centro,
  acciones,
  className,
}: {
  titulo: ReactNode;
  /** Texto pequeño junto al título (por ejemplo, «12 casos»). */
  detalle?: ReactNode;
  centro?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-crm-borde bg-background px-4 py-2 md:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-base font-bold tracking-wide text-crm-texto uppercase">
          {titulo}
        </h1>
        {detalle ? <span className="text-sm text-crm-hora">{detalle}</span> : null}
      </div>
      {centro ? <div className="flex min-w-0 flex-1 items-center gap-3">{centro}</div> : null}
      {acciones ? (
        <div className={cn("flex items-center gap-2", !centro && "ml-auto")}>{acciones}</div>
      ) : null}
    </div>
  );
}

/** Altura útil de una vista del CRM: toda la pantalla menos la barra superior del panel. */
export const ALTO_VISTA_CRM = "h-[calc(100dvh-4rem)]";
