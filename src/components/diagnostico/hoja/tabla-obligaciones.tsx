"use client";

import { X } from "lucide-react";
import type { ClipboardEvent, KeyboardEvent } from "react";

import { InputPesos } from "@/components/formularios/input-pesos";
import {
  moraSegunDias,
  type ObligacionCalculada,
  type ObligacionEntrada,
} from "@/lib/diagnostico/calcular";
import {
  CLASES,
  CLASE_ESPERADA_POR_GARANTIA,
  MORAS,
  TIPOS_GARANTIA,
  type ClaseCredito,
  type MoraObligacion,
  type TipoGarantia,
} from "@/lib/diagnostico/catalogos";
import {
  COLUMNAS_TABLA,
  esPegadoDeHoja,
  filaExcel,
  formulasHoja,
  leerPortapapeles,
  type FilaHoja,
} from "@/lib/diagnostico/hoja";
import { formatearPesos, formatearPorcentaje } from "@/lib/formato";
import { cn } from "cn";

import { CELDA_CALCULADA, CONTROL_CELDA, SELECT_CELDA } from "./celdas";
import { ANCHOS, FONDO_CLASE, LETRAS } from "./columnas";

type TablaObligacionesProps = {
  filas: readonly FilaHoja[];
  /** Resultado del motor para cada fila incluida, por clave de fila. */
  calculadas: ReadonlyMap<number, ObligacionCalculada>;
  error: (clave: number, campo: keyof ObligacionEntrada) => string | undefined;
  onCambiar: (clave: number, cambios: Partial<ObligacionEntrada>) => void;
  onEliminar: (clave: number) => void;
  onPegar: (fila: number, columna: number, bloque: string[][]) => void;
};

const ES_EDITABLE = COLUMNAS_TABLA.map((c) => c.editable);

function esValor<T extends string>(valores: readonly { valor: T }[], valor: string): valor is T {
  return valores.some((v) => v.valor === valor);
}

/** Busca la celda editable vecina en la dirección indicada (salta las calculadas). */
function celdaVecina(
  tabla: HTMLElement,
  fila: number,
  columna: number,
  dFila: number,
  dColumna: number,
): HTMLElement | null {
  let c = columna + dColumna;
  while (dColumna !== 0 && c >= 0 && c < ES_EDITABLE.length && !ES_EDITABLE[c]) c += dColumna;
  return tabla.querySelector<HTMLElement>(`[data-fila="${fila + dFila}"][data-col="${c}"]`);
}

/** Tabla de obligaciones (B15:M35 del Excel) con navegación y pegado de hoja de cálculo. */
export function TablaObligaciones({
  filas,
  calculadas,
  error,
  onCambiar,
  onEliminar,
  onPegar,
}: TablaObligacionesProps) {
  const formulas = formulasHoja(filas.length);

  // Enter, flechas y Mayús+Enter se mueven entre celdas como en Excel.
  function alPresionarTecla(evento: KeyboardEvent<HTMLTableSectionElement>) {
    const objetivo = evento.target as HTMLElement;
    const { fila, col } = objetivo.dataset;
    if (fila === undefined || col === undefined) return;
    const esTexto = objetivo instanceof HTMLInputElement;
    let dFila = 0;
    let dColumna = 0;
    switch (evento.key) {
      case "Enter":
        dFila = evento.shiftKey ? -1 : 1;
        break;
      case "ArrowDown":
        if (evento.altKey) return; // Alt+↓ abre la lista desplegable.
        dFila = 1;
        break;
      case "ArrowUp":
        dFila = -1;
        break;
      case "ArrowLeft":
      case "ArrowRight": {
        const haciaLaDerecha = evento.key === "ArrowRight";
        if (esTexto) {
          const input = objetivo as HTMLInputElement;
          const enBorde = haciaLaDerecha
            ? input.selectionStart === input.value.length &&
              input.selectionEnd === input.value.length
            : input.selectionStart === 0 && input.selectionEnd === 0;
          if (!enBorde) return;
        }
        dColumna = haciaLaDerecha ? 1 : -1;
        break;
      }
      default:
        return;
    }
    // Enter nunca envía el formulario desde una celda: solo cambia de fila.
    if (evento.key === "Enter") evento.preventDefault();
    const tabla = evento.currentTarget;
    const destino = celdaVecina(tabla, Number(fila), Number(col), dFila, dColumna);
    if (!destino) return;
    evento.preventDefault();
    destino.focus();
    if (destino instanceof HTMLInputElement) destino.select();
  }

  // Pegar un bloque copiado de Excel reparte las celdas a partir de la celda activa.
  function alPegar(evento: ClipboardEvent<HTMLTableSectionElement>) {
    const objetivo = evento.target as HTMLElement;
    const { fila, col } = objetivo.dataset;
    if (fila === undefined || col === undefined) return;
    const texto = evento.clipboardData.getData("text/plain");
    if (!esPegadoDeHoja(texto)) return;
    evento.preventDefault();
    onPegar(Number(fila), Number(col), leerPortapapeles(texto));
  }

  return (
    <table
      className="table-fixed border-collapse border border-hoja-borde text-[13px]"
      style={{ width: LETRAS.reduce((t, l) => t + ANCHOS[l], 0) }}
      aria-label="Obligaciones del cliente"
    >
      <colgroup>
        {LETRAS.map((letra) => (
          <col key={letra} style={{ width: ANCHOS[letra] }} />
        ))}
      </colgroup>
      <thead>
        <tr className="h-14 bg-hoja-titulo text-white">
          {COLUMNAS_TABLA.map((columna) => (
            <th
              key={columna.clave}
              scope="col"
              data-celda={`${columna.letra}15`}
              className="border-x border-hoja-borde px-1 text-center leading-tight font-bold"
            >
              {columna.titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody onKeyDown={alPresionarTecla} onPaste={alPegar}>
        {filas.map(({ clave, obligacion, enUso }, indice) => {
          const numeroFila = filaExcel(indice);
          const calculada = calculadas.get(clave);
          const ref = (letra: string) => `${letra}${numeroFila}`;
          const control = (columna: number) => ({
            "data-fila": indice,
            "data-col": columna,
          });
          const errorDe = (campo: keyof ObligacionEntrada) => {
            const mensaje = error(clave, campo);
            return mensaje
              ? { "aria-invalid": true as const, title: mensaje }
              : { "aria-invalid": undefined };
          };
          const nombreFila = `fila ${indice + 1}`;
          return (
            <tr
              key={clave}
              className={cn(
                "h-7 border-b border-hoja-cuadricula",
                indice % 2 === 0 ? "bg-hoja-franja" : "bg-hoja-fondo",
              )}
            >
              <td
                data-celda={ref("B")}
                className="group relative border-x border-hoja-cuadricula p-0 text-center"
              >
                <span className="group-focus-within:invisible group-hover:invisible">
                  {indice + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onEliminar(clave)}
                  className="absolute inset-0 m-auto flex size-6 items-center justify-center rounded-sm text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-hoja-seleccion"
                  aria-label={`Eliminar ${nombreFila}`}
                  title="Eliminar fila"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </td>
              <td data-celda={ref("C")} className="border-x border-hoja-cuadricula p-0">
                <input
                  {...control(1)}
                  {...errorDe("acreedor")}
                  data-campo="acreedor"
                  value={obligacion.acreedor}
                  onChange={(e) => onCambiar(clave, { acreedor: e.target.value })}
                  maxLength={160}
                  aria-label={`Acreedor, ${nombreFila}`}
                  className={cn(CONTROL_CELDA, "text-center")}
                />
              </td>
              <td data-celda={ref("D")} className="border-x border-hoja-cuadricula p-0">
                <input
                  {...control(2)}
                  {...errorDe("concepto")}
                  value={obligacion.concepto ?? ""}
                  onChange={(e) => onCambiar(clave, { concepto: e.target.value })}
                  maxLength={160}
                  aria-label={`Concepto o producto, ${nombreFila}`}
                  className={cn(CONTROL_CELDA, "text-center")}
                />
              </td>
              <td data-celda={ref("E")} className="border-x border-hoja-cuadricula p-0">
                <InputPesos
                  {...control(3)}
                  {...errorDe("capital")}
                  valor={obligacion.capital === 0 ? null : obligacion.capital}
                  onCambio={(valor) => onCambiar(clave, { capital: valor ?? 0 })}
                  ocultarSimboloVacio
                  aria-label={`Capital, ${nombreFila}`}
                  className={cn(CONTROL_CELDA, "h-7 pl-4")}
                  classNameSimbolo="left-1 text-[13px] text-hoja-texto"
                />
              </td>
              <td data-celda={ref("F")} className="border-x border-hoja-cuadricula p-0">
                <InputPesos
                  {...control(4)}
                  {...errorDe("intereses")}
                  valor={obligacion.intereses === 0 ? null : obligacion.intereses}
                  onCambio={(valor) => onCambiar(clave, { intereses: valor ?? 0 })}
                  ocultarSimboloVacio
                  aria-label={`Intereses y otros, ${nombreFila}`}
                  className={cn(CONTROL_CELDA, "h-7 pl-4")}
                  classNameSimbolo="left-1 text-[13px] text-hoja-texto"
                />
              </td>
              <td
                data-celda={ref("G")}
                data-formula={formulas.total(numeroFila)}
                tabIndex={-1}
                className={cn(
                  CELDA_CALCULADA,
                  "border-x border-hoja-cuadricula px-1.5 text-right tabular-nums",
                )}
              >
                {calculada && calculada.total > 0 ? formatearPesos(calculada.total) : ""}
              </td>
              <td data-celda={ref("H")} className="border-x border-hoja-cuadricula p-0">
                <select
                  {...control(6)}
                  {...errorDe("mora")}
                  value={enUso ? obligacion.mora : ""}
                  onChange={(e) => {
                    if (esValor(MORAS, e.target.value))
                      onCambiar(clave, { mora: e.target.value as MoraObligacion });
                  }}
                  aria-label={`Mora, ${nombreFila}`}
                  className={cn(SELECT_CELDA, "text-center")}
                >
                  {enUso ? null : <option value="" />}
                  {MORAS.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiquetaPropuesta}
                    </option>
                  ))}
                </select>
              </td>
              <td data-celda={ref("I")} className="border-x border-hoja-cuadricula p-0">
                <input
                  {...control(7)}
                  {...errorDe("diasMora")}
                  type="text"
                  inputMode="numeric"
                  value={obligacion.diasMora ?? ""}
                  onChange={(e) => {
                    const digitos = e.target.value.replace(/\D/g, "").slice(0, 5);
                    if (digitos === "") {
                      onCambiar(clave, { diasMora: null });
                      return;
                    }
                    const dias = Number(digitos);
                    onCambiar(clave, { diasMora: dias, mora: moraSegunDias(dias) });
                  }}
                  aria-label={`Días de mora, ${nombreFila}`}
                  className={cn(CONTROL_CELDA, "text-center tabular-nums")}
                />
              </td>
              <td
                data-celda={ref("J")}
                data-formula={formulas.porcentaje(numeroFila)}
                tabIndex={-1}
                className={cn(
                  CELDA_CALCULADA,
                  "border-x border-hoja-cuadricula px-1 text-center tabular-nums",
                )}
              >
                {calculada && calculada.total > 0
                  ? formatearPorcentaje(calculada.porcentajePasivo, 0)
                  : ""}
              </td>
              <td data-celda={ref("K")} className="border-x border-hoja-cuadricula p-0">
                <select
                  {...control(9)}
                  value={enUso ? (obligacion.descuentoNomina ? "si" : "no") : ""}
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    onCambiar(clave, { descuentoNomina: e.target.value === "si" });
                  }}
                  aria-label={`Descuento de nómina activo, ${nombreFila}`}
                  className={cn(SELECT_CELDA, "text-center")}
                >
                  {enUso ? null : <option value="" />}
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </td>
              <td data-celda={ref("L")} className="border-x border-hoja-cuadricula p-0">
                <select
                  {...control(10)}
                  {...errorDe("tipoGarantia")}
                  value={enUso ? obligacion.tipoGarantia : ""}
                  onChange={(e) => {
                    if (!esValor(TIPOS_GARANTIA, e.target.value)) return;
                    const tipoGarantia = e.target.value as TipoGarantia;
                    // Como antes: la garantía real sugiere su clase (hipoteca → tercera, prenda →
                    // segunda) y quitarla devuelve a quinta una clase que dependía de ella.
                    const claseEsperada = CLASE_ESPERADA_POR_GARANTIA[tipoGarantia];
                    const claseActual = obligacion.clase;
                    const clase: ClaseCredito =
                      claseEsperada ??
                      (claseActual === "segunda" || claseActual === "tercera"
                        ? "quinta"
                        : claseActual);
                    onCambiar(clave, { tipoGarantia, clase });
                  }}
                  aria-label={`Tipo de garantía, ${nombreFila}`}
                  className={cn(SELECT_CELDA, "text-center")}
                >
                  {enUso ? null : <option value="" />}
                  {TIPOS_GARANTIA.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiquetaPropuesta}
                    </option>
                  ))}
                </select>
              </td>
              <td
                data-celda={ref("M")}
                className={cn(
                  "border-x border-hoja-cuadricula p-0",
                  enUso && FONDO_CLASE[obligacion.clase],
                )}
              >
                <select
                  {...control(11)}
                  {...errorDe("clase")}
                  value={enUso ? obligacion.clase : ""}
                  onChange={(e) => {
                    if (esValor(CLASES, e.target.value))
                      onCambiar(clave, { clase: e.target.value as ClaseCredito });
                  }}
                  aria-label={`Clase, ${nombreFila}`}
                  className={cn(SELECT_CELDA, "text-center")}
                >
                  {enUso ? null : <option value="" />}
                  {CLASES.map((o) => (
                    <option key={o.valor} value={o.valor} title={o.ejemplos}>
                      {o.etiquetaPropuesta}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
