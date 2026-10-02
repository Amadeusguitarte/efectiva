import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { HOJAS_DIAGNOSTICO, INFO_HOJA, type HojaDiagnostico } from "@/lib/diagnostico/hojas";
import type { ResultadoBusquedaClientes } from "@/lib/diagnostico/selector-cliente";
import type { EstadoPropuesta } from "@/lib/propuestas/estados";
import { cn } from "cn";

import { PestanasHojas } from "./pestanas-hojas";
import { SelectorCliente } from "./selector-cliente";

type EncabezadoDashboardProps = {
  /** Hoja abierta: da el título, marca su pestaña y es la que se abre al cambiar de cliente. */
  hoja: HojaDiagnostico;
  /** Cliente de la hoja; null en la matriz de un cliente nuevo (se crea al guardar). */
  cliente: { id: string; nombre: string } | null;
  estadoPropuesta: EstadoPropuesta | null;
  /** Fecha del último guardado de la matriz, ya formateada en el servidor; null si no existe. */
  fechaActualizacion: string | null;
  /** Acciones propias de la hoja (a la derecha del título; en pantallas angostas, bajo la franja). */
  acciones?: ReactNode;
  /** Búsqueda de «Cambiar de cliente» (Server Action). */
  buscarClientes: (termino: string) => Promise<ResultadoBusquedaClientes>;
  /** La matriz tiene cambios sin guardar: se confirma antes de cambiar de cliente. */
  hayCambios?: boolean;
  /** Mensaje sobre las pestañas de hojas (p. ej. el error del guardado). */
  aviso?: ReactNode;
  /**
   * Franja azul oscura de la hoja, unida a su pestaña activa. Debe ser un solo elemento con
   * `rounded-xl`: el encabezado le quita la esquina superior izquierda cuando la activa es la
   * primera pestaña.
   */
  franja: ReactNode;
  /** Clases del contenedor (p. ej. `print:hidden` en las hojas con su propia versión impresa). */
  className?: string;
};

/**
 * Encabezado común de las hojas del dashboard de diagnóstico de un cliente, de lo general a lo
 * particular: el cliente (regreso a su ficha y «Cambiar de cliente»), el título de la hoja con el
 * estado de la propuesta y la fecha de la matriz, y una sola fila de pestañas de hojas cuya activa
 * va unida a la franja de resumen. Las acciones de la hoja van a la derecha del título; en
 * contenedores angostos bajan después de la franja, para que las pestañas queden a la misma altura
 * en todas las hojas (cada hoja tiene acciones distintas, o ninguna). Los textos secundarios van en
 * `text-foreground/80`: el gris atenuado, sobre el fondo del panel, no llega a 4,5:1 de contraste.
 */
export function EncabezadoDashboard({
  hoja,
  cliente,
  estadoPropuesta,
  fechaActualizacion,
  acciones,
  buscarClientes,
  hayCambios = false,
  aviso,
  franja,
  className,
}: EncabezadoDashboardProps) {
  const primeraActiva = hoja === HOJAS_DIAGNOSTICO[0].valor;
  return (
    // Las columnas cambian con el ancho real del contenido (container query de la página), que
    // depende del tamaño del menú lateral.
    <div className={cn("grid min-w-0 gap-6 @4xl:grid-cols-[minmax(0,1fr)_auto]", className)}>
      <header className="grid min-w-0 justify-items-start gap-1 @4xl:col-start-1 @4xl:row-start-1">
        <div className="mb-3 flex max-w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href={cliente ? (`/admin/clientes/${cliente.id}` as Route) : "/admin/clientes"}
            className="inline-flex max-w-full min-w-0 items-center gap-1 text-sm text-foreground/80 hover:text-foreground"
          >
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{cliente ? cliente.nombre : "Clientes"}</span>
          </Link>
          <SelectorCliente
            clienteId={cliente?.id ?? ""}
            nombreCliente={cliente?.nombre ?? "Nuevo cliente"}
            hoja={hoja}
            hayCambios={hayCambios}
            buscarClientes={buscarClientes}
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {INFO_HOJA[hoja].titulo}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/80">
          {estadoPropuesta ? (
            <>
              <EstadoBadge estado={estadoPropuesta} />
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
            </>
          ) : null}
          <span>
            {!cliente
              ? "Cliente nuevo: escribe sus datos y su diagnóstico; al guardar se crea el expediente."
              : fechaActualizacion
                ? `Matriz actualizada el ${fechaActualizacion}`
                : "La matriz aún no se ha guardado"}
          </span>
        </p>
      </header>

      {/* Una sola fila de pestañas, con la activa unida a la franja como una pestaña de carpeta. */}
      <div
        className={cn(
          "grid min-w-0 @4xl:col-span-2",
          primeraActiva && "[&>:last-child]:rounded-tl-none",
        )}
      >
        {aviso ? <div className="mb-6">{aviso}</div> : null}
        <PestanasHojas clienteId={cliente?.id ?? null} hoja={hoja} hayCambios={hayCambios} />
        {franja}
      </div>

      {/* Después de la franja en el orden del documento (y en pantalla, si es angosta): actúan
          sobre la hoja elegida. En contenedores anchos suben junto al título. */}
      {acciones ? (
        <div className="flex flex-wrap items-center gap-2 @4xl:col-start-2 @4xl:row-start-1 @4xl:self-end print:hidden">
          {acciones}
        </div>
      ) : null}
    </div>
  );
}
