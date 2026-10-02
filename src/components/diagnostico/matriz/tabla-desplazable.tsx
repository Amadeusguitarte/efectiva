"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { cn } from "cn";

/** Sombreado que avisa de columnas ocultas a un lado (visible según `data-desborde-*`). */
export const SOMBRA_DESBORDE =
  "pointer-events-none absolute inset-y-0 z-20 w-8 from-hoja-titulo/15 to-transparent opacity-0 transition-opacity duration-200 print:hidden";

/**
 * Marca en `marco` (`data-desborde-izquierda` / `data-desborde-derecha`) si quedan columnas
 * ocultas a cada lado de `desplazable`, para mostrar el sombreado de ese lado. Se escribe en el DOM
 * (sin estado) al desplazar o redimensionar; `alMedir` recibe si la tabla desborda.
 */
export function useDesborde(
  refMarco: RefObject<HTMLElement | null>,
  refDesplazable: RefObject<HTMLElement | null>,
  alMedir?: (desborda: boolean) => void,
) {
  useEffect(() => {
    const marco = refMarco.current;
    const desplazable = refDesplazable.current;
    if (!marco || !desplazable) return;
    const medir = () => {
      const { scrollLeft, clientWidth, scrollWidth } = desplazable;
      marco.dataset.desbordeIzquierda = String(scrollLeft > 1);
      marco.dataset.desbordeDerecha = String(scrollLeft + clientWidth < scrollWidth - 1);
      alMedir?.(scrollWidth > clientWidth + 1);
    };
    desplazable.addEventListener("scroll", medir, { passive: true });
    // El observador también mide al empezar a observar.
    const observador = new ResizeObserver(medir);
    observador.observe(desplazable);
    if (desplazable.firstElementChild) observador.observe(desplazable.firstElementChild);
    return () => {
      desplazable.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [refMarco, refDesplazable, alMedir]);
}

/**
 * Contenedor de una tabla de solo lectura más ancha que su tarjeta: solo la tabla se desplaza en
 * horizontal, un sombreado marca el lado con columnas ocultas y, mientras desborda, el contenedor
 * recibe el foco (con un nombre propio) para desplazarlo con las flechas del teclado.
 */
export function TablaDesplazable({
  etiqueta,
  className,
  children,
}: {
  /** Nombre de la región desplazable, distinto del de la tarjeta (p. ej. «Tabla de deudas»). */
  etiqueta: string;
  /** Clases del contenedor que se desplaza (p. ej. `print:overflow-visible`). */
  className?: string;
  children: ReactNode;
}) {
  const refMarco = useRef<HTMLDivElement>(null);
  const refDesplazable = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);
  useDesborde(refMarco, refDesplazable, setDesborda);

  return (
    <div ref={refMarco} className="group/tabla relative">
      <div
        aria-hidden
        className={cn(
          SOMBRA_DESBORDE,
          "left-0 bg-linear-to-r group-data-[desborde-izquierda=true]/tabla:opacity-100",
        )}
      />
      <div
        aria-hidden
        className={cn(
          SOMBRA_DESBORDE,
          "right-0 bg-linear-to-l group-data-[desborde-derecha=true]/tabla:opacity-100",
        )}
      />
      <div
        ref={refDesplazable}
        role={desborda ? "region" : undefined}
        aria-label={desborda ? etiqueta : undefined}
        tabIndex={desborda ? 0 : undefined}
        // Contorno y no anillo: el anillo interior quedaría bajo el fondo de las celdas.
        className={cn(
          "relative overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
