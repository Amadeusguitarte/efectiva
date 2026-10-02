"use client";

import { FileText, ListChecks, Loader2, Table2, type LucideIcon } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";

import { HOJAS_DIAGNOSTICO, rutaHoja, type HojaDiagnostico } from "@/lib/diagnostico/hojas";
import { cn } from "cn";

const ICONO_HOJA: Record<HojaDiagnostico, LucideIcon> = {
  diagnostico: Table2,
  "datos-propuesta": FileText,
  listas: ListChecks,
};

/** Curva entre la pestaña activa y el borde superior de la franja, como una pestaña de carpeta. */
const CURVA =
  "pointer-events-none absolute bottom-0 size-3 bg-hoja-titulo [mask-image:radial-gradient(circle_at_var(--centro),transparent_0.75rem,black_calc(0.75rem_+_0.5px))]";

/**
 * Icono de la pestaña; mientras se abre la hoja elegida se convierte en un indicador de carga. En
 * pantallas angostas solo se ve mientras carga, para que las tres pestañas quepan en una fila.
 */
function IconoPestana({ hoja, activa }: { hoja: HojaDiagnostico; activa: boolean }) {
  const { pending } = useLinkStatus();
  const Icono = pending ? Loader2 : ICONO_HOJA[hoja];
  return (
    <Icono
      aria-hidden
      className={cn(
        "size-4 shrink-0 transition-colors",
        pending ? "animate-spin" : "max-sm:hidden",
        activa ? "text-hoja-franja" : "text-muted-foreground group-hover:text-hoja-encabezado",
      )}
    />
  );
}

/**
 * Pestañas con las hojas del diagnóstico del cliente, como las hojas del libro de Excel: la activa
 * es una pestaña de carpeta en el azul oscuro de la franja, unida a ella (la franja va justo
 * debajo, sin espacio, y sin la esquina superior izquierda redondeada si la activa es la primera).
 * Son enlaces reales: la guarda de cambios sin guardar de la matriz los intercepta. Si no caben,
 * la fila se desplaza en horizontal y la pestaña activa queda a la vista.
 */
export function PestanasHojas({
  clienteId,
  hoja,
  hayCambios = false,
}: {
  clienteId: string;
  hoja: HojaDiagnostico;
  /** La matriz tiene cambios sin guardar: su pestaña lleva un punto ámbar. */
  hayCambios?: boolean;
}) {
  const refLista = useRef<HTMLUListElement>(null);

  // Sin `scrollIntoView`, que también desplazaría la página en vertical.
  useEffect(() => {
    const lista = refLista.current;
    const activa = lista?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!lista || !activa) return;
    const caja = lista.getBoundingClientRect();
    const pestana = activa.getBoundingClientRect();
    if (pestana.left < caja.left || pestana.right > caja.right) {
      lista.scrollLeft += pestana.left - caja.left - 16;
    }
  }, [hoja, clienteId]);

  return (
    <nav aria-label="Hojas del diagnóstico" className="min-w-0 print:hidden">
      <ul
        ref={refLista}
        className="flex [scrollbar-width:none] items-end gap-1 overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
      >
        {HOJAS_DIAGNOSTICO.map(({ valor, etiqueta, etiquetaCorta }, indice) => {
          const activa = valor === hoja;
          const sinGuardar = hayCambios && valor === "diagnostico";
          return (
            <li key={valor} className="shrink-0">
              <Link
                href={rutaHoja(clienteId, valor)}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-2 rounded-t-xl px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset sm:px-4",
                  activa
                    ? "z-10 bg-hoja-titulo font-semibold text-white focus-visible:ring-hoja-franja"
                    : "font-medium text-foreground/80 hover:bg-hoja-etiqueta hover:text-hoja-titulo focus-visible:ring-ring",
                )}
              >
                <IconoPestana hoja={valor} activa={activa} />
                <span className="sm:hidden">{etiquetaCorta}</span>
                <span className="max-sm:hidden">{etiqueta}</span>
                {sinGuardar ? (
                  <span
                    title="Cambios sin guardar"
                    className="size-2 shrink-0 rounded-full bg-warning"
                  >
                    <span className="sr-only">(cambios sin guardar)</span>
                  </span>
                ) : null}
                {activa ? (
                  <>
                    {indice > 0 ? (
                      <span aria-hidden className={cn(CURVA, "right-full [--centro:0_0]")} />
                    ) : null}
                    <span aria-hidden className={cn(CURVA, "left-full [--centro:100%_0]")} />
                  </>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
