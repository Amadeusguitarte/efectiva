"use client";

import { ClipboardPaste, Keyboard, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { InputPesos } from "@/components/formularios/input-pesos";
import { Button } from "@/components/ui/button";
import {
  moraSegunDias,
  type ObligacionCalculada,
  type ObligacionEntrada,
  type ResultadoDiagnostico,
} from "@/lib/diagnostico/calcular";
import {
  CLASES,
  CLASE_ESPERADA_POR_GARANTIA,
  INFO_TIPO_GARANTIA,
  MORAS,
  TIPOS_GARANTIA,
  type ClaseCredito,
  type MoraObligacion,
  type TipoGarantia,
} from "@/lib/diagnostico/catalogos";
import {
  COLUMNAS_TABLA,
  esPegadoDeHoja,
  filaConContenido,
  leerPortapapeles,
  primeraFilaLibre,
  type ClaveColumna,
  type FilaHoja,
} from "@/lib/diagnostico/hoja";
import { formatearPesos, formatearPorcentaje } from "@/lib/formato";
import { cn } from "cn";

import { FONDO_CLASE } from "./colores-clase";
import { CONTROL_TABLA, FILA_TOTAL, SelectNativo, TarjetaMatriz } from "./controles";

type TablaObligacionesProps = {
  filas: readonly FilaHoja[];
  /** Resultado del motor para cada fila incluida, por clave de fila. */
  calculadas: ReadonlyMap<number, ObligacionCalculada>;
  resultado: ResultadoDiagnostico;
  /** Error de la lista completa (por ejemplo, demasiadas obligaciones). */
  errorGeneral?: string;
  error: (clave: number, campo: keyof ObligacionEntrada) => string | undefined;
  onCambiar: (clave: number, cambios: Partial<ObligacionEntrada>) => void;
  onEliminar: (clave: number) => void;
  onPegar: (fila: number, columna: number, bloque: string[][]) => void;
};

const ES_EDITABLE = COLUMNAS_TABLA.map((c) => c.editable);

/** Posición de cada columna; los controles la llevan en `data-col` para moverse y pegar. */
const INDICE = Object.fromEntries(COLUMNAS_TABLA.map((c, i) => [c.clave, i])) as Record<
  ClaveColumna,
  number
>;

/**
 * Ancho de cada columna: lo justo para un importe de nueve cifras (ocho en intereses) o la opción
 * más larga de cada lista. Acreedor y concepto se reparten el resto, al menos 6rem cada una: la
 * tabla mide como mínimo 54.75rem de columnas fijas + 12rem = 66.75rem.
 */
const COLUMNA: Record<
  ClaveColumna,
  { ancho?: string; /** Alineación (y relleno) del título. */ encabezado: string }
> = {
  numero: { ancho: "w-7", encabezado: "text-center px-1" },
  acreedor: { encabezado: "text-left" },
  concepto: { encabezado: "text-left" },
  capital: { ancho: "w-28", encabezado: "text-right" },
  intereses: { ancho: "w-26", encabezado: "text-right" },
  total: { ancho: "w-27", encabezado: "text-right" },
  mora: { ancho: "w-23", encabezado: "text-left" },
  diasMora: { ancho: "w-11", encabezado: "text-center px-1" },
  porcentaje: { ancho: "w-13", encabezado: "text-right px-1.5" },
  descuentoNomina: { ancho: "w-14", encabezado: "text-left px-1" },
  tipoGarantia: { ancho: "w-31", encabezado: "text-left" },
  clase: { ancho: "w-31", encabezado: "text-left" },
};

/** Celda con un control: el control ya trae su relleno. */
const CELDA_CONTROL = "px-0.5 py-0.5";

/**
 * Con la tarjeta de 42rem o más, CLASE y el botón de eliminar quedan fijos a la derecha mientras
 * la tabla se desplaza en horizontal (en el celular ocuparían media pantalla). El ancho fijo
 * suma w-31 + w-8 = 9.75rem: es el `right` de CLASE, el `scroll-pr` del contenedor (para que el
 * teclado no deje una celda bajo ellas) y la posición del sombreado de desborde.
 */
const FIJA_CLASE =
  "@2xl/tarjeta:sticky @2xl/tarjeta:right-8 @2xl/tarjeta:z-10 @2xl/tarjeta:shadow-[inset_1px_0_0_var(--hoja-cuadricula)]";
const FIJA_ACCIONES = "@2xl/tarjeta:sticky @2xl/tarjeta:right-0 @2xl/tarjeta:z-10";

/** Sombreado que avisa de columnas ocultas a un lado (visible según `data-desborde-*`). */
const SOMBRA_DESBORDE =
  "pointer-events-none absolute inset-y-0 z-20 w-8 from-hoja-titulo/15 to-transparent opacity-0 transition-opacity duration-200";

function esValor<T extends string>(valores: readonly { valor: T }[], valor: string): valor is T {
  return valores.some((v) => v.valor === valor);
}

/** Busca el control editable vecino en la dirección indicada (salta las columnas calculadas). */
function controlVecino(
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

/**
 * Tarjeta «Obligaciones»: la tabla del Excel con edición en línea, navegación con Enter y
 * flechas, pegado de bloques copiados del Excel y la fila TOTAL en amarillo. Siempre deja filas
 * libres al final (`ajustarFilasLibres`) en lugar de las 20 filas fijas de la hoja.
 */
export function TablaObligaciones({
  filas,
  calculadas,
  resultado,
  errorGeneral,
  error,
  onCambiar,
  onEliminar,
  onPegar,
}: TablaObligacionesProps) {
  const refCuerpo = useRef<HTMLTableSectionElement>(null);
  const refMarco = useRef<HTMLDivElement>(null);
  const refDesplazable = useRef<HTMLDivElement>(null);
  const filaLibre = primeraFilaLibre(filas);
  const totalCapital = resultado.obligaciones.reduce((suma, o) => suma + o.capital, 0);
  const totalIntereses = resultado.obligaciones.reduce((suma, o) => suma + o.intereses, 0);

  // Marca en el contenedor si quedan columnas ocultas a la izquierda o a la derecha, para
  // mostrar el sombreado de ese lado. Se escribe en el DOM (sin estado) al desplazar o redimensionar.
  useEffect(() => {
    const marco = refMarco.current;
    const desplazable = refDesplazable.current;
    if (!marco || !desplazable) return;
    const medir = () => {
      const { scrollLeft, clientWidth, scrollWidth } = desplazable;
      marco.dataset.desbordeIzquierda = String(scrollLeft > 1);
      marco.dataset.desbordeDerecha = String(scrollLeft + clientWidth < scrollWidth - 1);
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
  }, []);

  /** «Agregar obligación» lleva a la primera fila libre (siempre hay una al final). */
  function irAFilaLibre() {
    const destino = refCuerpo.current?.querySelector<HTMLElement>(
      `[data-fila="${filaLibre}"][data-col="${INDICE.acreedor}"]`,
    );
    if (!destino) return;
    destino.focus({ preventScroll: true });
    destino.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }

  // Enter, flechas y Mayús+Enter se mueven entre celdas como en Excel.
  function alPresionarTecla(evento: KeyboardEvent<HTMLTableSectionElement>) {
    const objetivo = evento.target as HTMLElement;
    const { fila, col } = objetivo.dataset;
    if (fila === undefined || col === undefined) return;
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
        if (objetivo instanceof HTMLInputElement) {
          const largo = objetivo.value.length;
          const enBorde = haciaLaDerecha
            ? objetivo.selectionStart === largo && objetivo.selectionEnd === largo
            : objetivo.selectionStart === 0 && objetivo.selectionEnd === 0;
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
    const destino = controlVecino(evento.currentTarget, Number(fila), Number(col), dFila, dColumna);
    if (!destino) return;
    evento.preventDefault();
    // Se desplaza a mano para respetar los márgenes de la celda (`scroll-m*` de CONTROL_TABLA) y
    // del contenedor: así no queda bajo el encabezado, la barra de guardado ni las columnas fijas.
    destino.focus({ preventScroll: true });
    destino.scrollIntoView({ block: "nearest", inline: "nearest" });
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
    <TarjetaMatriz
      id="titulo-obligaciones"
      titulo="Obligaciones"
      tono="titulo"
      extra={
        <>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
            {resultado.numeroObligaciones === 1
              ? "1 registrada"
              : `${resultado.numeroObligaciones} registradas`}
          </span>
          <span className="hidden items-center gap-1.5 text-xs text-white/75 md:inline-flex">
            <ClipboardPaste className="size-3.5" aria-hidden />
            Puedes pegar filas copiadas del Excel
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="ml-auto"
            onClick={irAFilaLibre}
          >
            <Plus aria-hidden />
            Agregar obligación
          </Button>
        </>
      }
    >
      {errorGeneral ? (
        <p
          className="border-b border-destructive/20 bg-danger-soft px-4 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorGeneral}
        </p>
      ) : null}

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
            "right-0 bg-linear-to-l group-data-[desborde-derecha=true]/tabla:opacity-100 @2xl/tarjeta:right-39",
          )}
        />
        {/* `relative` hace que el texto sr-only del encabezado quede dentro del desplazamiento
            horizontal; si no, ensancha toda la página en pantallas angostas. */}
        <div ref={refDesplazable} className="relative overflow-x-auto @2xl/tarjeta:scroll-pr-39">
          <table
            className="w-full min-w-[66.75rem] table-fixed border-collapse text-[13px] text-foreground"
            aria-labelledby="titulo-obligaciones"
          >
            <colgroup>
              {COLUMNAS_TABLA.map((columna) => (
                <col key={columna.clave} className={COLUMNA[columna.clave].ancho} />
              ))}
              <col className="w-8" />
            </colgroup>
            <thead className="bg-hoja-titulo text-white">
              <tr className="border-t border-white/15">
                {COLUMNAS_TABLA.map((columna) => (
                  <th
                    key={columna.clave}
                    scope="col"
                    className={cn(
                      "px-2 py-2 align-bottom text-[11px] leading-tight font-semibold tracking-wide uppercase",
                      COLUMNA[columna.clave].encabezado,
                      columna.clave === "clase" && cn(FIJA_CLASE, "bg-hoja-titulo"),
                    )}
                  >
                    {columna.titulo}
                  </th>
                ))}
                <th scope="col" className={cn("px-1 py-2", FIJA_ACCIONES, "bg-hoja-titulo")}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody ref={refCuerpo} onKeyDown={alPresionarTecla} onPaste={alPegar}>
              {filas.map(({ clave, obligacion, enUso }, indice) => {
                const calculada = calculadas.get(clave);
                const conContenido = filaConContenido(obligacion);
                const nombreFila = `fila ${indice + 1}`;
                const control = (columna: ClaveColumna) => ({
                  "data-fila": indice,
                  "data-col": INDICE[columna],
                });
                const errorDe = (campo: keyof ObligacionEntrada) => {
                  const mensaje = error(clave, campo);
                  return mensaje
                    ? { "aria-invalid": true as const, title: mensaje }
                    : { "aria-invalid": undefined };
                };
                return (
                  <tr
                    key={clave}
                    className={cn(
                      "group/fila border-b border-hoja-cuadricula/80",
                      // Fondos opacos: las columnas fijas los heredan al desplazar la tabla.
                      indice % 2 === 0 ? "bg-hoja-franja-suave" : "bg-card",
                    )}
                  >
                    <td className="text-center text-xs text-foreground/80 tabular-nums">
                      {indice + 1}
                    </td>
                    <td className={CELDA_CONTROL}>
                      <input
                        {...control("acreedor")}
                        {...errorDe("acreedor")}
                        data-campo="acreedor"
                        value={obligacion.acreedor}
                        onChange={(e) => onCambiar(clave, { acreedor: e.target.value })}
                        maxLength={160}
                        placeholder={indice === filaLibre ? "Agregar…" : undefined}
                        aria-label={`Acreedor, ${nombreFila}`}
                        className={CONTROL_TABLA}
                      />
                    </td>
                    <td className={CELDA_CONTROL}>
                      <input
                        {...control("concepto")}
                        {...errorDe("concepto")}
                        value={obligacion.concepto ?? ""}
                        onChange={(e) => onCambiar(clave, { concepto: e.target.value })}
                        maxLength={160}
                        aria-label={`Concepto o producto, ${nombreFila}`}
                        className={CONTROL_TABLA}
                      />
                    </td>
                    <td className={CELDA_CONTROL}>
                      <InputPesos
                        {...control("capital")}
                        {...errorDe("capital")}
                        valor={obligacion.capital === 0 ? null : obligacion.capital}
                        onCambio={(valor) => onCambiar(clave, { capital: valor ?? 0 })}
                        ocultarSimboloVacio
                        aria-label={`Capital, ${nombreFila}`}
                        className={cn(CONTROL_TABLA, "pr-1.5 pl-4")}
                        classNameSimbolo="left-1.5 text-[13px]"
                      />
                    </td>
                    <td className={CELDA_CONTROL}>
                      <InputPesos
                        {...control("intereses")}
                        {...errorDe("intereses")}
                        valor={obligacion.intereses === 0 ? null : obligacion.intereses}
                        onCambio={(valor) => onCambiar(clave, { intereses: valor ?? 0 })}
                        ocultarSimboloVacio
                        aria-label={`Intereses y otros, ${nombreFila}`}
                        className={cn(CONTROL_TABLA, "pr-1.5 pl-4")}
                        classNameSimbolo="left-1.5 text-[13px]"
                      />
                    </td>
                    <td className="px-2 text-right font-semibold whitespace-nowrap tabular-nums">
                      {calculada && calculada.total > 0 ? formatearPesos(calculada.total) : ""}
                    </td>
                    <td className={CELDA_CONTROL}>
                      <SelectNativo
                        compacto
                        {...control("mora")}
                        {...errorDe("mora")}
                        value={enUso ? obligacion.mora : ""}
                        onChange={(e) => {
                          if (esValor(MORAS, e.target.value))
                            onCambiar(clave, { mora: e.target.value as MoraObligacion });
                        }}
                        aria-label={`Mora, ${nombreFila}`}
                      >
                        {enUso ? null : <option value="" />}
                        {MORAS.map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.etiquetaPropuesta}
                          </option>
                        ))}
                      </SelectNativo>
                    </td>
                    <td className={CELDA_CONTROL}>
                      <input
                        {...control("diasMora")}
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
                        className={cn(CONTROL_TABLA, "px-1 text-center tabular-nums")}
                      />
                    </td>
                    <td className="px-1.5 text-right whitespace-nowrap text-foreground/80 tabular-nums">
                      {calculada && calculada.total > 0
                        ? formatearPorcentaje(calculada.porcentajePasivo)
                        : ""}
                    </td>
                    <td className={CELDA_CONTROL}>
                      <SelectNativo
                        compacto
                        {...control("descuentoNomina")}
                        value={enUso ? (obligacion.descuentoNomina ? "si" : "no") : ""}
                        onChange={(e) => {
                          if (e.target.value === "") return;
                          onCambiar(clave, { descuentoNomina: e.target.value === "si" });
                        }}
                        aria-label={`Descuento de nómina activo, ${nombreFila}`}
                      >
                        {enUso ? null : <option value="" />}
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </SelectNativo>
                    </td>
                    <td className={CELDA_CONTROL}>
                      <SelectNativo
                        compacto
                        {...control("tipoGarantia")}
                        {...errorDe("tipoGarantia")}
                        value={enUso ? obligacion.tipoGarantia : ""}
                        onChange={(e) => {
                          if (!esValor(TIPOS_GARANTIA, e.target.value)) return;
                          const tipoGarantia = e.target.value as TipoGarantia;
                          // La garantía real sugiere su clase (hipoteca → tercera, prenda →
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
                        title={
                          enUso
                            ? INFO_TIPO_GARANTIA[obligacion.tipoGarantia].etiquetaPropuesta
                            : undefined
                        }
                      >
                        {enUso ? null : <option value="" />}
                        {TIPOS_GARANTIA.map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.etiquetaPropuesta}
                          </option>
                        ))}
                      </SelectNativo>
                    </td>
                    <td
                      className={cn(
                        CELDA_CONTROL,
                        FIJA_CLASE,
                        "bg-inherit",
                        enUso && FONDO_CLASE[obligacion.clase],
                      )}
                    >
                      <SelectNativo
                        compacto
                        {...control("clase")}
                        {...errorDe("clase")}
                        value={enUso ? obligacion.clase : ""}
                        onChange={(e) => {
                          if (esValor(CLASES, e.target.value))
                            onCambiar(clave, { clase: e.target.value as ClaseCredito });
                        }}
                        aria-label={`Clase, ${nombreFila}`}
                        className="pl-1.5 text-xs font-semibold md:text-xs"
                      >
                        {enUso ? null : <option value="" />}
                        {CLASES.map((o) => (
                          <option key={o.valor} value={o.valor} title={o.ejemplos}>
                            {o.etiquetaPropuesta}
                          </option>
                        ))}
                      </SelectNativo>
                    </td>
                    <td className={cn("px-0.5 text-center", FIJA_ACCIONES, "bg-inherit")}>
                      {enUso || conContenido ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEliminar(clave)}
                          aria-label={`Eliminar ${nombreFila}`}
                          title="Eliminar fila"
                          className="size-7 text-muted-foreground hover:bg-danger-soft hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={FILA_TOTAL}>
                <th
                  scope="row"
                  colSpan={3}
                  className="px-3 py-2.5 text-left tracking-wide uppercase"
                >
                  Total
                </th>
                <td className="px-2 text-right whitespace-nowrap tabular-nums">
                  {formatearPesos(totalCapital)}
                </td>
                <td className="px-2 text-right whitespace-nowrap tabular-nums">
                  {formatearPesos(totalIntereses)}
                </td>
                <td className="px-2 text-right whitespace-nowrap tabular-nums">
                  {formatearPesos(resultado.pasivoTotal)}
                </td>
                <td colSpan={2} />
                <td className="px-1.5 text-right whitespace-nowrap tabular-nums">
                  {resultado.pasivoTotal > 0 ? formatearPorcentaje(1) : ""}
                </td>
                <td colSpan={2} />
                <td className={cn(FIJA_CLASE, "bg-inherit")} />
                <td className={cn(FIJA_ACCIONES, "bg-inherit")} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="flex items-center gap-2 border-t border-hoja-cuadricula/70 bg-surface-soft px-4 py-2 text-xs text-muted-foreground">
        <Keyboard className="size-3.5 shrink-0" aria-hidden />
        <span>
          Enter pasa a la fila siguiente y Mayús+Enter a la anterior; las flechas se mueven entre
          celdas. Las filas vacías no se guardan.
        </span>
      </p>
    </TarjetaMatriz>
  );
}
