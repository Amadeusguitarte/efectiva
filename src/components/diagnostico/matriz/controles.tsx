import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "cn";

/**
 * Piezas comunes de la matriz: tarjetas con la cabecera azul de los bloques del Excel, filas
 * etiqueta | valor con el fondo azul claro de sus etiquetas y controles de formulario.
 */

/** Control de formulario de las tarjetas (mismo aspecto que `Input`). */
export const CONTROL_FORMULARIO =
  "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

/**
 * Control compacto dentro de una celda de la tabla: sin borde hasta pasar el cursor y con un
 * foco azul bien visible, para escribir rápido sin perder el aspecto de tabla. El margen superior
 * de desplazamiento evita que la celda enfocada quede bajo el encabezado fijo del panel (por
 * abajo, la matriz reserva el alto de la barra de guardado mientras se ve).
 */
export const CONTROL_TABLA =
  "h-8 w-full min-w-0 scroll-mt-20 rounded-md border border-transparent bg-transparent px-2 text-[13px] shadow-none transition-[color,box-shadow,background-color] outline-none md:text-[13px] placeholder:text-muted-foreground/80 hover:border-hoja-encabezado/30 hover:bg-background/70 focus:border-hoja-encabezado focus:bg-background focus:ring-2 focus:ring-hoja-encabezado/25 focus-visible:border-hoja-encabezado focus-visible:ring-2 focus-visible:ring-hoja-encabezado/25 aria-invalid:border-destructive aria-invalid:bg-danger-soft aria-invalid:ring-destructive/20";

/** Fila TOTAL de las tablas de la matriz: el amarillo del Excel, suavizado. */
export const FILA_TOTAL =
  "border-t-2 border-hoja-total-borde bg-hoja-total font-bold text-foreground";

/**
 * Lista desplegable nativa (rápida con el teclado) con la flecha del sistema de diseño. En la
 * tabla (`compacto`) la flecha aparece, como en Excel, al pasar por la fila o al enfocar la celda.
 */
export function SelectNativo({
  className,
  compacto = false,
  ...props
}: ComponentProps<"select"> & { compacto?: boolean }) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className={cn(
          compacto ? CONTROL_TABLA : CONTROL_FORMULARIO,
          "peer cursor-pointer appearance-none truncate",
          compacto ? "pr-5" : "pr-8",
          className,
        )}
      />
      <ChevronDown
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          compacto
            ? "right-1.5 size-3.5 opacity-0 transition-opacity group-hover/fila:opacity-100 peer-focus:opacity-100"
            : "right-2.5 size-4",
        )}
      />
    </div>
  );
}

/** Tarjeta de sección del panel con la cabecera azul de los bloques del Excel. */
export function TarjetaMatriz({
  id,
  titulo,
  extra,
  tono = "encabezado",
  className,
  children,
}: {
  id: string;
  titulo: string;
  /** Contenido a la derecha del título (contadores, botones). */
  extra?: ReactNode;
  /** "titulo": azul oscuro del título del Excel; "encabezado": azul de sus secciones. */
  tono?: "titulo" | "encabezado";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "@container/tarjeta flex min-w-0 flex-col overflow-hidden rounded-xl border border-hoja-encabezado/20 bg-card shadow-soft",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-white",
          tono === "titulo" ? "bg-hoja-titulo" : "bg-hoja-encabezado",
        )}
      >
        <h2 id={id} className="text-[13px] font-bold tracking-wide uppercase">
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

/**
 * Fila etiqueta | valor: la etiqueta a la izquierda en tarjetas anchas y encima del valor en las
 * angostas (menos de 24rem), para que no se parta en varias líneas.
 */
export const FILA = cn(
  "grid border-b border-hoja-cuadricula/70 last:border-b-0",
  "@sm/tarjeta:grid-cols-[minmax(8.5rem,min(42%,15rem))_minmax(0,1fr)]",
);

export const ETIQUETA_FILA =
  "flex items-center gap-2 bg-hoja-etiqueta px-3 pt-2 pb-1.5 text-[13px] leading-snug font-semibold text-foreground @sm/tarjeta:py-2";

export const VALOR_FILA = "grid min-w-0 content-center gap-1 px-2.5 py-2";

function Vineta() {
  return <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-hoja-vineta" />;
}

/** Atributos que el control de una `FilaCampo` debe llevar para leer su ayuda o su error. */
export type ControlFila = { "aria-describedby": string | undefined };

/**
 * Fila editable de una tarjeta, con la etiqueta azul claro (y la viñeta) del Excel. La ayuda y el
 * error quedan conectados al control con `aria-describedby` cuando `children` es una función.
 */
export function FilaCampo({
  etiqueta,
  htmlFor,
  vineta = false,
  ayuda,
  error,
  children,
}: {
  etiqueta: string;
  /** Campo al que apunta la etiqueta; sin él la fila muestra un valor de solo lectura. */
  htmlFor?: string;
  vineta?: boolean;
  ayuda?: ReactNode;
  error?: string;
  children: ReactNode | ((control: ControlFila) => ReactNode);
}) {
  const id = useId();
  const base = htmlFor ?? id;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;
  const descripcion = error ? idError : ayuda ? idAyuda : undefined;
  const Etiqueta = htmlFor ? "label" : "div";
  return (
    <div className={FILA}>
      <Etiqueta htmlFor={htmlFor} className={ETIQUETA_FILA}>
        {vineta ? <Vineta /> : null}
        {etiqueta}
      </Etiqueta>
      <div className={VALOR_FILA}>
        {typeof children === "function" ? children({ "aria-describedby": descripcion }) : children}
        {error ? (
          <p id={idError} className="text-xs text-destructive">
            {error}
          </p>
        ) : ayuda ? (
          <p id={idAyuda} className="text-xs leading-snug text-muted-foreground">
            {ayuda}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Fila con un valor que calcula el motor (solo lectura). El `<output>` lleva el nombre de su
 * etiqueta y no se anuncia en cada cambio: se lee al recorrer la tarjeta.
 */
export function FilaCalculada({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className={FILA}>
      <div id={`${id}-etiqueta`} className={ETIQUETA_FILA}>
        {etiqueta}
      </div>
      <div className={VALOR_FILA}>
        <output
          aria-labelledby={`${id}-etiqueta`}
          aria-live="off"
          className="flex h-9 items-center justify-end rounded-md bg-muted/70 px-3 text-sm font-semibold text-foreground tabular-nums"
        >
          {children}
        </output>
      </div>
    </div>
  );
}
