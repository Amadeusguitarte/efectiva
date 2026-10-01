import type { ResultadoDiagnostico } from "@/lib/diagnostico/calcular";
import { CLASES, INFO_CLASE, INFO_MORA, type ClaseCredito } from "@/lib/diagnostico/catalogos";
import { formatearPesos, formatearPorcentaje } from "@/lib/formato";
import { cn } from "cn";

import { COLOR_INTENSO_CLASE, FONDO_CLASE } from "./colores-clase";
import { FILA_TOTAL, TarjetaMatriz } from "./controles";

const ENCABEZADO =
  "px-3 py-2 text-[11px] leading-tight font-semibold tracking-wide whitespace-nowrap uppercase";
const CELDA = "px-3 py-2";

/**
 * Las dos tarjetas van lado a lado con la misma altura: la tabla ocupa toda la tarjeta y una fila
 * vacía antes del TOTAL absorbe el espacio sobrante, así el TOTAL queda siempre al pie.
 */
const CONTENEDOR_TABLA = "relative flex-1 overflow-x-auto";

function FilaRelleno({ columnas }: { columnas: number }) {
  return (
    <tr aria-hidden className="h-full">
      <td colSpan={columnas} className="p-0" />
    </tr>
  );
}

/** Etiqueta de clase con el color del formato condicional del Excel. */
export function EtiquetaClase({ clase }: { clase: ClaseCredito }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-bold tracking-wide whitespace-nowrap text-hoja-texto",
        FONDO_CLASE[clase],
      )}
    >
      {INFO_CLASE[clase].etiquetaPropuesta}
    </span>
  );
}

/** «Resumen por clase» del Excel, con una barra del peso de cada clase en el pasivo. */
export function ResumenPorClase({ resultado }: { resultado: ResultadoDiagnostico }) {
  return (
    <TarjetaMatriz id="titulo-resumen-clase" titulo="Resumen por clase">
      <div className={CONTENEDOR_TABLA}>
        <table
          className="h-full w-full min-w-[26rem] border-collapse text-sm"
          aria-labelledby="titulo-resumen-clase"
        >
          <thead className="border-b border-hoja-cuadricula bg-hoja-etiqueta text-foreground">
            <tr>
              <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                Clase
              </th>
              <th scope="col" className={cn(ENCABEZADO, "text-center")}>
                N° oblig.
              </th>
              <th scope="col" className={cn(ENCABEZADO, "text-right")}>
                Total
              </th>
              <th scope="col" className={cn(ENCABEZADO, "w-[38%] text-left")}>
                % del pasivo
              </th>
            </tr>
          </thead>
          <tbody>
            {CLASES.map(({ valor: clase }) => {
              const resumen = resultado.resumenPorClase[clase];
              const vacia = resumen.cantidad === 0;
              return (
                <tr
                  key={clase}
                  className={cn(
                    "border-b border-hoja-cuadricula/70",
                    vacia && "text-muted-foreground",
                  )}
                >
                  <th scope="row" className={cn(CELDA, "text-left font-normal")}>
                    <EtiquetaClase clase={clase} />
                  </th>
                  <td className={cn(CELDA, "text-center tabular-nums")}>{resumen.cantidad}</td>
                  <td className={cn(CELDA, "text-right font-semibold tabular-nums")}>
                    {formatearPesos(resumen.total)}
                  </td>
                  <td className={CELDA}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                        aria-hidden
                      >
                        <div
                          className={cn("h-full rounded-full", COLOR_INTENSO_CLASE[clase])}
                          style={{ width: `${Math.min(resumen.porcentajePasivo, 1) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right whitespace-nowrap tabular-nums">
                        {formatearPorcentaje(resumen.porcentajePasivo)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <FilaRelleno columnas={4} />
          </tbody>
          <tfoot>
            <tr className={FILA_TOTAL}>
              <th scope="row" className={cn(CELDA, "text-left tracking-wide uppercase")}>
                Total
              </th>
              <td className={cn(CELDA, "text-center tabular-nums")}>
                {resultado.numeroObligaciones}
              </td>
              <td className={cn(CELDA, "text-right tabular-nums")}>
                {formatearPesos(resultado.pasivoTotal)}
              </td>
              <td className={cn(CELDA, "text-right tabular-nums")}>
                {resultado.pasivoTotal > 0 ? formatearPorcentaje(1) : ""}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </TarjetaMatriz>
  );
}

/** Lista de acreencias que pasa a la propuesta, con el TOTAL en el amarillo del Excel. */
export function ListaAcreedores({ resultado }: { resultado: ResultadoDiagnostico }) {
  return (
    <TarjetaMatriz id="titulo-acreedores" titulo="Acreedores para la propuesta">
      <div className={CONTENEDOR_TABLA}>
        <table
          className="h-full w-full min-w-[34rem] border-collapse text-sm"
          aria-labelledby="titulo-acreedores"
        >
          <thead className="border-b border-hoja-cuadricula bg-hoja-etiqueta text-foreground">
            <tr>
              <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                Acreedor
              </th>
              <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                Clase
              </th>
              <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                Concepto
              </th>
              <th scope="col" className={cn(ENCABEZADO, "text-right")}>
                Vr adeudado
              </th>
              <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                Mora
              </th>
            </tr>
          </thead>
          <tbody>
            {resultado.obligaciones.length === 0 ? (
              <tr className="border-b border-hoja-cuadricula/70">
                <td colSpan={5} className={cn(CELDA, "py-6 text-center text-muted-foreground")}>
                  Aún no hay obligaciones registradas.
                </td>
              </tr>
            ) : null}
            {resultado.obligaciones.map((o) => (
              <tr key={o.numero} className="border-b border-hoja-cuadricula/70">
                <td className={cn(CELDA, "font-medium")}>{o.acreedor}</td>
                <td className={CELDA}>
                  <EtiquetaClase clase={o.clase} />
                </td>
                <td className={cn(CELDA, "text-muted-foreground")}>{o.concepto || "—"}</td>
                <td className={cn(CELDA, "text-right font-semibold tabular-nums")}>
                  {formatearPesos(o.total)}
                </td>
                <td className={cn(CELDA, "whitespace-nowrap")}>
                  {INFO_MORA[o.mora].etiquetaPropuesta}
                </td>
              </tr>
            ))}
            <FilaRelleno columnas={5} />
          </tbody>
          <tfoot>
            <tr className={FILA_TOTAL}>
              <th
                scope="row"
                colSpan={3}
                className={cn(CELDA, "text-left tracking-wide uppercase")}
              >
                Total
              </th>
              <td className={cn(CELDA, "text-right tabular-nums")}>
                {formatearPesos(resultado.pasivoTotal)}
              </td>
              <td className={CELDA} />
            </tr>
          </tfoot>
        </table>
      </div>
    </TarjetaMatriz>
  );
}
