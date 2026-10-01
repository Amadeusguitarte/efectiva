import type { CSSProperties, ReactNode } from "react";

import { cn } from "cn";

/**
 * Piezas visuales de la hoja de cálculo: encabezados, etiquetas, celdas editables y celdas
 * calculadas con el aspecto de la hoja «Diagnóstico Cliente» del Excel.
 */

/** Controles dentro de una celda: sin bordes propios; la celda activa se marca en verde. */
export const CONTROL_CELDA =
  "h-full w-full min-w-0 rounded-none border-0 bg-transparent px-1.5 text-[length:inherit] shadow-none outline-none md:text-[length:inherit] placeholder:text-hoja-texto/35 focus:outline-2 focus:-outline-offset-2 focus:outline-hoja-seleccion focus-visible:ring-0 aria-invalid:outline-2 aria-invalid:-outline-offset-2 aria-invalid:outline-destructive aria-invalid:ring-0 disabled:cursor-not-allowed disabled:opacity-100";

/** Lista desplegable de celda (como la validación de datos del Excel). */
export const SELECT_CELDA = cn(
  CONTROL_CELDA,
  "cursor-pointer appearance-none bg-[length:10px] bg-[right_4px_center] bg-no-repeat pr-4",
  // Flecha pequeña al estilo del desplegable de Excel.
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M0 0h10L5 6z' fill='%23595959'/%3E%3C/svg%3E\")]",
);

/** Celda calculada: se puede seleccionar para ver su fórmula, pero no editar. */
export const CELDA_CALCULADA =
  "outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-hoja-seleccion";

/** Borde fino negro de las celdas con formato del Excel. */
export const BORDE = "border border-hoja-texto/70";

export function Encabezado({
  children,
  style,
  className,
  comentario,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** Nota de la celda en el Excel (se muestra al pasar el cursor, con el triángulo rojo). */
  comentario?: string;
}) {
  return (
    <div
      style={style}
      title={comentario}
      className={cn(
        "relative flex items-center justify-center border border-hoja-texto/70 bg-hoja-encabezado px-2 text-center font-bold text-white",
        className,
      )}
    >
      {children}
      {comentario ? <IndicadorComentario /> : null}
    </div>
  );
}

/** Triángulo rojo de la esquina, como las celdas con comentario en Excel. */
export function IndicadorComentario() {
  return (
    <span
      aria-hidden
      className="absolute top-0 right-0 size-0 border-t-[7px] border-l-[7px] border-t-hoja-comentario border-l-transparent"
    />
  );
}

/** Etiqueta de dato (columna B, E o H) con la viñeta azul del Excel. */
export function Etiqueta({
  children,
  htmlFor,
  style,
  vineta = false,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  style?: CSSProperties;
  vineta?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={style}
      className={cn(
        BORDE,
        "relative flex items-center justify-center bg-hoja-etiqueta px-2 text-center text-[13px] leading-tight font-bold",
        vineta && "pl-5",
        className,
      )}
    >
      {vineta ? (
        <span
          aria-hidden
          className="absolute top-1/2 left-1.5 size-2.5 -translate-y-1/2 rounded-full bg-hoja-vineta"
        />
      ) : null}
      {children}
    </label>
  );
}

/** Contenedor de una celda de valor en la parte superior de la hoja. */
export function Celda({
  celda,
  formula,
  style,
  className,
  children,
  calculada = false,
}: {
  /** Referencia de la celda en el Excel (C5, F9…), para la barra de fórmulas. */
  celda: string;
  formula?: string;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
  calculada?: boolean;
}) {
  return (
    <div
      data-celda={celda}
      data-formula={formula}
      style={style}
      // Las celdas calculadas se pueden seleccionar con el ratón para ver su fórmula.
      tabIndex={calculada ? -1 : undefined}
      className={cn(BORDE, "flex min-w-0 bg-hoja-fondo", calculada && CELDA_CALCULADA, className)}
    >
      {children}
    </div>
  );
}
