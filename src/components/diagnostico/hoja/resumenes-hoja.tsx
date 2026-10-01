import type { ResultadoDiagnostico } from "@/lib/diagnostico/calcular";
import { CLASES, INFO_CLASE, INFO_MORA } from "@/lib/diagnostico/catalogos";
import { formulasHoja } from "@/lib/diagnostico/hoja";
import { formatearPesos, formatearPorcentaje } from "@/lib/formato";
import { cn } from "cn";

import { CELDA_CALCULADA } from "./celdas";
import { ANCHOS, FONDO_CLASE, anchoRango, type Letra } from "./columnas";

const CELDA = "border border-hoja-texto/70 px-1.5";

function Columnas({ letras }: { letras: readonly Letra[] }) {
  return (
    <colgroup>
      {letras.map((letra) => (
        <col key={letra} style={{ width: ANCHOS[letra] }} />
      ))}
    </colgroup>
  );
}

/** «RESUMEN POR CLASE» (B38:E44 del Excel). */
export function ResumenPorClase({
  resultado,
  filaInicial,
  filasTabla,
}: {
  resultado: ResultadoDiagnostico;
  /** Fila del Excel del encabezado (38 con la tabla de 20 filas). */
  filaInicial: number;
  filasTabla: number;
}) {
  const formulas = formulasHoja(filasTabla);
  return (
    <table
      className="table-fixed border-collapse text-[14px]"
      style={{ width: anchoRango("B", "E") }}
      aria-label="Resumen por clase"
    >
      <Columnas letras={["B", "C", "D", "E"]} />
      <thead>
        <tr className="h-8 bg-hoja-encabezado text-white">
          {["RESUMEN POR CLASE", "N° OBLIGACIONES", "TOTAL", "% PASIVO"].map((titulo) => (
            <th
              key={titulo}
              scope="col"
              className={cn(CELDA, "text-center leading-tight font-bold")}
            >
              {titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CLASES.map((clase, indice) => {
          const fila = filaInicial + 1 + indice;
          const resumen = resultado.resumenPorClase[clase.valor];
          return (
            <tr key={clase.valor} className="h-7 bg-hoja-fondo font-bold">
              <th
                scope="row"
                data-celda={`B${fila}`}
                className={cn(CELDA, "text-left", FONDO_CLASE[clase.valor])}
              >
                {clase.etiquetaPropuesta}
              </th>
              <td
                data-celda={`C${fila}`}
                data-formula={formulas.cantidadClase(fila)}
                tabIndex={-1}
                className={cn(CELDA, CELDA_CALCULADA, "text-center tabular-nums")}
              >
                {resumen.cantidad}
              </td>
              <td
                data-celda={`D${fila}`}
                data-formula={formulas.totalClase(fila)}
                tabIndex={-1}
                className={cn(CELDA, CELDA_CALCULADA, "text-center tabular-nums")}
              >
                {formatearPesos(resumen.total)}
              </td>
              <td
                data-celda={`E${fila}`}
                data-formula={formulas.porcentajeClase(fila)}
                tabIndex={-1}
                className={cn(CELDA, CELDA_CALCULADA, "text-center tabular-nums")}
              >
                {formatearPorcentaje(resumen.porcentajePasivo, 0)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Lista de acreencias para la propuesta (B47:F64 del Excel), con el TOTAL en amarillo. */
export function ListaAcreedores({
  resultado,
  filaInicial,
}: {
  resultado: ResultadoDiagnostico;
  filaInicial: number;
}) {
  const filaTotal = filaInicial + Math.max(resultado.obligaciones.length, 1) + 1;
  return (
    <table
      className="table-fixed border-collapse text-[14px]"
      style={{ width: anchoRango("B", "F") }}
      aria-label="Acreedores para la propuesta"
    >
      <Columnas letras={["B", "C", "D", "E", "F"]} />
      <thead>
        <tr className="h-8 bg-hoja-encabezado text-white">
          {["ACREEDOR", "CLASE", "CONCEPTO", "VR ADEUDADO", "MORA"].map((titulo) => (
            <th key={titulo} scope="col" className={cn(CELDA, "text-center font-bold")}>
              {titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {resultado.obligaciones.length === 0 ? (
          <tr className="h-7 bg-hoja-fondo">
            <td className={CELDA} colSpan={5} />
          </tr>
        ) : null}
        {resultado.obligaciones.map((o, indice) => (
          <tr key={indice} className="h-7 bg-hoja-fondo text-center">
            <td className={CELDA}>{o.acreedor}</td>
            <td className={CELDA}>{INFO_CLASE[o.clase].etiquetaPropuesta}</td>
            <td className={CELDA}>{o.concepto ?? ""}</td>
            <td className={cn(CELDA, "tabular-nums")}>{formatearPesos(o.total)}</td>
            <td className={CELDA}>{INFO_MORA[o.mora].etiquetaPropuesta}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="h-8 bg-hoja-total font-bold">
          <th scope="row" className={cn(CELDA, "text-center")}>
            TOTAL
          </th>
          <td className={CELDA} />
          <td className={CELDA} />
          <td
            data-celda={`E${filaTotal}`}
            data-formula={`=SUMA(E${filaInicial + 1}:E${filaTotal - 1})`}
            tabIndex={-1}
            className={cn(CELDA, CELDA_CALCULADA, "text-center tabular-nums")}
          >
            {formatearPesos(resultado.pasivoTotal)}
          </td>
          <td className={CELDA} />
        </tr>
      </tfoot>
    </table>
  );
}
