import { Check, Landmark, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { MORA_MAYOR_90 } from "@/lib/diagnostico/calcular";
import {
  CLASE_ESPERADA_POR_GARANTIA,
  CLASES,
  ESTADOS_CIVILES,
  INFO_MORA,
  MORAS,
  SERVICIOS_CON_CENTRO_OBLIGATORIO,
  TIPOS_GARANTIA,
  TIPOS_SERVICIO,
} from "@/lib/diagnostico/catalogos";
import { opcionesCuotas, PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";
import { ETIQUETA_ELEGIBILIDAD } from "@/lib/diagnostico/propuesta";
import {
  formatearPesos,
  formatearPorcentaje,
  formatearPorcentajeHonorarios,
  plural,
} from "@/lib/formato";
import { cn } from "cn";

import {
  CABECERA_TABLA,
  CELDA_TABLA,
  Contador,
  ENCABEZADO_TABLA,
  FILA_TABLA,
  FilaDato,
  TarjetaMatriz,
} from "./matriz/controles";
import {
  FRANJA,
  FRANJA_INDICADORES,
  FRANJA_SUPERIOR,
  Indicador,
  ROTULO,
} from "./matriz/resumen-indicadores";
import { EtiquetaClase } from "./matriz/resumenes";
import { TablaDesplazable } from "./matriz/tabla-desplazable";

/**
 * Hoja «Listas» del Excel: los catálogos de las listas desplegables de la matriz y los parámetros
 * con los que calcula (tarifas del centro, gastos, honorarios y elegibilidad). Solo lectura: todo
 * sale de `catalogos.ts` y `parametros.ts`, los mismos valores que usa el motor.
 */

const { elegibilidad, honorarios, gastosProceso, tarifasCentroConciliacion } =
  PARAMETROS_DIAGNOSTICO;

const NOTA_CONFIGURACION =
  "Estos valores se configuran en el sistema; para cambiarlos contacta al equipo técnico.";

/** «de X a Y» con el menor y el mayor de una lista; vacío si no hay valores. */
function deMenorAMayor(valores: readonly number[], formato: (valor: number) => string) {
  if (valores.length === 0) return "";
  return `de ${formato(Math.min(...valores))} a ${formato(Math.max(...valores))}`;
}

/**
 * Nota al pie de una tarjeta, pegada al contenido. El texto es más oscuro que el gris atenuado,
 * que sobre este fondo no llega a 4,5:1 de contraste.
 */
function Nota({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-hoja-cuadricula/70 bg-surface-soft px-4 py-2.5 text-xs leading-relaxed text-foreground/80">
      {children}
    </p>
  );
}

/**
 * Fila de las tablas: la última no lleva borde inferior, que se sumaría al borde de la nota o de
 * la tarjeta y se vería doble.
 */
const FILA = cn(FILA_TABLA, "last:border-b-0");

/** Columna de tarjetas apiladas, cada una con su alto natural. */
const COLUMNA = "grid min-w-0 gap-6";

/**
 * Fila del dashboard: una columna ancha (3/5) y otra angosta (2/5), cada una con una o varias
 * tarjetas apiladas, repartidas para que las dos columnas midan casi lo mismo. Las columnas se
 * alinean arriba y ninguna tarjeta se estira: según el ancho (y el tamaño del menú) una columna
 * termina antes que la otra, y el espacio sobrante queda fuera de las tarjetas, no como un hueco
 * en blanco dentro de ellas. En contenedores angostos todo va en una sola columna.
 */
function FilaTarjetas({ principal, lateral }: { principal: ReactNode; lateral: ReactNode }) {
  return (
    <div className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className={COLUMNA}>{principal}</div>
      <div className={COLUMNA}>{lateral}</div>
    </div>
  );
}

/** Franja azul oscura de la hoja: aviso de solo lectura y los parámetros clave. */
export function ResumenListas({ className }: { className?: string }) {
  const valoresTarifa = tarifasCentroConciliacion.map((t) => t.valor);
  return (
    <section aria-label="Resumen de las listas" className={cn(FRANJA, className)}>
      <div className={FRANJA_SUPERIOR}>
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className={ROTULO}>Listas y parámetros de la matriz</p>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide">
              <Lock className="size-3.5" aria-hidden />
              SOLO LECTURA
            </p>
          </div>
          <p className="text-[13px] text-white/75">{NOTA_CONFIGURACION}</p>
        </div>
      </div>
      <dl className={FRANJA_INDICADORES}>
        <Indicador
          etiqueta="% honorarios por defecto"
          valor={formatearPorcentajeHonorarios(honorarios.porcentajePorDefecto)}
        >
          Sugeridos {deMenorAMayor(honorarios.porcentajesSugeridos, formatearPorcentajeHonorarios)}
        </Indicador>
        <Indicador etiqueta="Cuotas de honorarios" valor={`1 a ${honorarios.cuotasMaximas}`}>
          Máximo de cuotas por contrato
        </Indicador>
        <Indicador etiqueta="Gastos del proceso" valor={formatearPesos(gastosProceso.fijos)}>
          {gastosProceso.porObligacion > 0
            ? `Fijos, más ${formatearPesos(gastosProceso.porObligacion)} por obligación`
            : "Fijos por proceso"}
        </Indicador>
        <Indicador
          etiqueta="Tarifas del centro"
          valor={plural(tarifasCentroConciliacion.length, "rango", "rangos")}
        >
          Según el pasivo, {deMenorAMayor(valoresTarifa, formatearPesos)}
        </Indicador>
      </dl>
    </section>
  );
}

function TarjetaClases() {
  return (
    <TarjetaMatriz
      id="listas-clases"
      titulo="Clases de crédito"
      extra={<Contador>{plural(CLASES.length, "clase", "clases")}</Contador>}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" aria-labelledby="listas-clases">
          <thead className={CABECERA_TABLA}>
            <tr>
              <th scope="col" className={cn(ENCABEZADO_TABLA, "w-px text-left")}>
                Clase
              </th>
              <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
                Qué incluye
              </th>
            </tr>
          </thead>
          <tbody>
            {CLASES.map((clase) => (
              <tr key={clase.valor} className={FILA}>
                <th scope="row" className={cn(CELDA_TABLA, "text-left align-top font-normal")}>
                  <EtiquetaClase clase={clase.valor} />
                </th>
                <td className={cn(CELDA_TABLA, "align-top")}>
                  <p className="leading-snug text-foreground">{clase.incluye}</p>
                  {clase.baseLegal ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{clase.baseLegal}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Nota>
        La guía completa (ejemplos, clave de clasificación y tratamiento) está en «Guía de clases».
      </Nota>
    </TarjetaMatriz>
  );
}

function TarjetaMora() {
  return (
    <TarjetaMatriz
      id="listas-mora"
      titulo="Mora"
      extra={<Contador>{plural(MORAS.length, "opción", "opciones")}</Contador>}
    >
      <table className="w-full border-collapse text-sm" aria-labelledby="listas-mora">
        <thead className={CABECERA_TABLA}>
          <tr>
            <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
              Mora
            </th>
            <th scope="col" className={cn(ENCABEZADO_TABLA, "text-right")}>
              Cuenta para elegibilidad
            </th>
          </tr>
        </thead>
        <tbody>
          {MORAS.map((mora) => {
            const cuenta = mora.valor === MORA_MAYOR_90;
            return (
              <tr key={mora.valor} className={FILA}>
                {/* El mismo texto de la lista de la matriz y de la propuesta. */}
                <th
                  scope="row"
                  className={cn(CELDA_TABLA, "text-left font-semibold whitespace-nowrap")}
                >
                  {mora.etiquetaPropuesta}
                </th>
                <td className={cn(CELDA_TABLA, "text-right")}>
                  {/* Texto oscuro: el verde sobre su fondo suave no llega a 4,5:1 de contraste. */}
                  {cuenta ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-foreground">
                      <Check className="size-3.5 text-success" aria-hidden />
                      Sí
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TarjetaMatriz>
  );
}

function TarjetaGarantias() {
  return (
    <TarjetaMatriz
      id="listas-garantias"
      titulo="Tipo de garantía"
      extra={<Contador>{plural(TIPOS_GARANTIA.length, "opción", "opciones")}</Contador>}
    >
      <table className="w-full border-collapse text-sm" aria-labelledby="listas-garantias">
        <thead className={CABECERA_TABLA}>
          <tr>
            <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
              Garantía
            </th>
            <th scope="col" className={cn(ENCABEZADO_TABLA, "text-right")}>
              Clase esperada
            </th>
          </tr>
        </thead>
        <tbody>
          {TIPOS_GARANTIA.map((garantia) => {
            const clase = CLASE_ESPERADA_POR_GARANTIA[garantia.valor];
            return (
              <tr key={garantia.valor} className={FILA}>
                <th scope="row" className={cn(CELDA_TABLA, "text-left font-medium")}>
                  {garantia.etiquetaPropuesta}
                </th>
                <td className={cn(CELDA_TABLA, "text-right")}>
                  {clase ? (
                    <EtiquetaClase clase={clase} />
                  ) : (
                    <>
                      <span aria-hidden className="text-muted-foreground">
                        —
                      </span>
                      <span className="sr-only">Sin clase esperada</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Nota>Si la clase de una obligación no coincide con su garantía, la matriz lo avisa.</Nota>
    </TarjetaMatriz>
  );
}

function TarjetaServicios() {
  return (
    <TarjetaMatriz
      id="listas-servicios"
      titulo="Tipos de servicio"
      extra={<Contador>{plural(TIPOS_SERVICIO.length, "servicio", "servicios")}</Contador>}
    >
      <ul aria-labelledby="listas-servicios" className="divide-y divide-hoja-cuadricula/70">
        {TIPOS_SERVICIO.map((servicio) => {
          const obligatorio = SERVICIOS_CON_CENTRO_OBLIGATORIO.includes(servicio.valor);
          return (
            <li key={servicio.valor} className="grid gap-1.5 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h3 className="text-sm font-semibold text-foreground">{servicio.etiqueta}</h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    obligatorio
                      ? "bg-hoja-etiqueta text-hoja-titulo ring-1 ring-hoja-encabezado/25"
                      : "bg-muted text-foreground/80",
                  )}
                >
                  <Landmark className="size-3" aria-hidden />
                  {obligatorio
                    ? "Centro de conciliación obligatorio"
                    : "Centro de conciliación opcional"}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {servicio.descripcion}
              </p>
            </li>
          );
        })}
      </ul>
    </TarjetaMatriz>
  );
}

function TarjetaHonorarios() {
  const { porcentajesSugeridos, porcentajePorDefecto } = honorarios;
  return (
    <TarjetaMatriz
      id="listas-honorarios"
      titulo="% de honorarios"
      extra={<Contador>{plural(porcentajesSugeridos.length, "sugerido", "sugeridos")}</Contador>}
    >
      <div className="grid gap-3 p-4">
        <ul aria-labelledby="listas-honorarios" className="flex flex-wrap gap-2">
          {porcentajesSugeridos.map((porcentaje) => {
            const porDefecto = porcentaje === porcentajePorDefecto;
            return (
              <li
                key={porcentaje}
                className={cn(
                  "inline-flex h-9 min-w-14 items-center justify-center rounded-md border px-3 text-sm font-semibold tabular-nums",
                  porDefecto
                    ? "border-hoja-titulo bg-hoja-titulo text-white"
                    : "border-hoja-cuadricula bg-hoja-etiqueta text-foreground",
                )}
              >
                {formatearPorcentajeHonorarios(porcentaje)}
                {porDefecto ? <span className="sr-only"> (por defecto)</span> : null}
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="size-2.5 shrink-0 rounded-sm bg-hoja-titulo" />
          Por defecto: {formatearPorcentajeHonorarios(porcentajePorDefecto)}. En la matriz también
          se puede escribir otro porcentaje.
        </p>
      </div>
    </TarjetaMatriz>
  );
}

function TarjetaCuotas() {
  const cuotas = opcionesCuotas();
  return (
    <TarjetaMatriz
      id="listas-cuotas"
      titulo="Cuotas de honorarios"
      extra={<Contador>1 a {honorarios.cuotasMaximas}</Contador>}
    >
      <div className="p-4">
        {/* Como la columna de la hoja del Excel: una celda por opción. Las columnas (6, 10, 15 o
            20 según el ancho de la tarjeta, con celdas de unos 32px como mínimo) reparten las 60
            cuotas en filas completas. Cada celda lleva su propio borde (anillo de 1px sobre un
            espacio de 1px, que comparte con la vecina): si el máximo cambia y la última fila
            queda incompleta, la cuadrícula sigue cerrada. */}
        <ol
          aria-labelledby="listas-cuotas"
          className="grid grid-cols-6 gap-px p-px @min-[23rem]/tarjeta:grid-cols-10 @xl/tarjeta:grid-cols-15 @3xl/tarjeta:grid-cols-20"
        >
          {cuotas.map((cuota) => (
            <li
              key={cuota}
              className="bg-card py-1.5 text-center text-[13px] text-foreground tabular-nums ring-1 ring-hoja-cuadricula"
            >
              {cuota}
            </li>
          ))}
        </ol>
      </div>
    </TarjetaMatriz>
  );
}

function TarjetaTarifas() {
  // En tarjetas angostas (celular), menos relleno y letra de 13px para que las tres columnas de
  // pesos quepan sin desplazar la tabla; si aun así no caben, se desplaza (con foco de teclado).
  const ESTRECHA = "@max-md/tarjeta:px-2";
  const ultima = tarifasCentroConciliacion.at(-1);
  return (
    <TarjetaMatriz
      id="listas-tarifas"
      titulo="Tarifas del centro de conciliación"
      extra={<Contador>{plural(tarifasCentroConciliacion.length, "rango", "rangos")}</Contador>}
    >
      <TablaDesplazable etiqueta="Tabla de tarifas del centro">
        <table
          className="w-full min-w-[19rem] border-collapse text-sm @max-sm/tarjeta:text-[13px]"
          aria-labelledby="listas-tarifas"
        >
          <thead className={CABECERA_TABLA}>
            <tr>
              <th scope="col" className={cn(ENCABEZADO_TABLA, ESTRECHA, "text-right")}>
                Pasivo desde
              </th>
              <th scope="col" className={cn(ENCABEZADO_TABLA, ESTRECHA, "text-right")}>
                Hasta
              </th>
              <th scope="col" className={cn(ENCABEZADO_TABLA, ESTRECHA, "text-right")}>
                Tarifa
              </th>
            </tr>
          </thead>
          <tbody>
            {tarifasCentroConciliacion.map((tarifa) => (
              <tr key={tarifa.desde} className={cn(FILA, "even:bg-hoja-franja-suave/40")}>
                <td className={cn(CELDA_TABLA, ESTRECHA, "text-right tabular-nums")}>
                  {formatearPesos(tarifa.desde)}
                </td>
                {/* Sobre la franja de las filas pares el gris atenuado no llega a 4,5:1. */}
                <td
                  className={cn(
                    CELDA_TABLA,
                    ESTRECHA,
                    "text-right text-foreground/80 tabular-nums",
                  )}
                >
                  {formatearPesos(tarifa.hasta)}
                </td>
                <td className={cn(CELDA_TABLA, ESTRECHA, "text-right font-semibold tabular-nums")}>
                  {formatearPesos(tarifa.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablaDesplazable>
      <Nota>
        Se aplica la fila con el mayor «desde» que no supere el pasivo total; el «hasta» no se
        incluye.
        {ultima
          ? ` Desde ${formatearPesos(ultima.hasta)} se cobra la última tarifa y la matriz muestra un aviso.`
          : null}{" "}
        Al valor se le resta el descuento del centro.
      </Nota>
    </TarjetaMatriz>
  );
}

function TarjetaGastos() {
  return (
    <TarjetaMatriz id="listas-gastos" titulo="Gastos del proceso">
      <dl>
        <FilaDato etiqueta="Fijos por proceso" destacado>
          {formatearPesos(gastosProceso.fijos)}
        </FilaDato>
        <FilaDato etiqueta="Por obligación">
          <span className="tabular-nums">{formatearPesos(gastosProceso.porObligacion)}</span>
        </FilaDato>
      </dl>
      <Nota>
        Se suman a los honorarios (y al centro de conciliación, si aplica) en el costo del proceso.
      </Nota>
    </TarjetaMatriz>
  );
}

function TarjetaElegibilidad() {
  return (
    <TarjetaMatriz id="listas-elegibilidad" titulo="Reglas de elegibilidad">
      <dl>
        <FilaDato etiqueta={`Obligaciones con mora ${INFO_MORA[MORA_MAYOR_90].etiquetaPropuesta}`}>
          Mínimo {elegibilidad.minimoObligacionesEnMora}
        </FilaDato>
        <FilaDato etiqueta="Acreedores distintos en mora">
          Mínimo {elegibilidad.minimoAcreedoresEnMora}
        </FilaDato>
        <FilaDato etiqueta="Pasivo en mora">
          Mínimo {formatearPorcentaje(elegibilidad.umbralPasivoEnMora)} del pasivo total
        </FilaDato>
      </dl>
      <Nota>
        Deben cumplirse las tres condiciones para que la matriz marque{" "}
        {ETIQUETA_ELEGIBILIDAD.elegible}.
      </Nota>
    </TarjetaMatriz>
  );
}

function TarjetaEstadoCivil() {
  return (
    <TarjetaMatriz
      id="listas-estado-civil"
      titulo="Estado civil"
      extra={<Contador>{plural(ESTADOS_CIVILES.length, "opción", "opciones")}</Contador>}
    >
      <ul aria-labelledby="listas-estado-civil" className="flex flex-wrap content-start gap-2 p-4">
        {ESTADOS_CIVILES.map((estado) => (
          <li
            key={estado.valor}
            className="rounded-md border border-hoja-cuadricula bg-hoja-etiqueta px-2.5 py-1 text-sm text-foreground"
          >
            {estado.etiqueta}
          </li>
        ))}
      </ul>
    </TarjetaMatriz>
  );
}

/** Tarjetas de la hoja «Listas», en tres filas: obligaciones, servicio y cliente, y cálculos. */
export function ListasDiagnostico() {
  return (
    <div className="grid min-w-0 gap-6">
      <FilaTarjetas
        principal={<TarjetaClases />}
        lateral={
          <>
            <TarjetaMora />
            <TarjetaGarantias />
          </>
        }
      />
      <FilaTarjetas
        principal={
          <>
            <TarjetaServicios />
            <TarjetaEstadoCivil />
          </>
        }
        lateral={
          <>
            <TarjetaHonorarios />
            <TarjetaCuotas />
          </>
        }
      />
      <FilaTarjetas
        principal={<TarjetaTarifas />}
        lateral={
          <>
            <TarjetaGastos />
            <TarjetaElegibilidad />
          </>
        }
      />
    </div>
  );
}
