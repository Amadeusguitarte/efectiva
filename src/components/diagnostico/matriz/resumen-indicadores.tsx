import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import type { ReactNode } from "react";

import type { ResultadoDiagnostico } from "@/lib/diagnostico/calcular";
import { INFO_TIPO_SERVICIO, type TipoServicio } from "@/lib/diagnostico/catalogos";
import { PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";
import {
  formatearPesos,
  formatearPorcentaje,
  formatearPorcentajeHonorarios,
  plural,
} from "@/lib/formato";
import { cn } from "cn";

/** Rótulo en mayúsculas de la franja. */
export const ROTULO = "text-[11px] font-semibold tracking-wider text-white/70 uppercase";

/**
 * Piezas de la franja azul oscura (el azul del título del Excel) que encabeza cada hoja del
 * dashboard: el contenedor, la fila superior y la cuadrícula de indicadores.
 */
export const FRANJA = "@container overflow-hidden rounded-xl bg-hoja-titulo text-white shadow-soft";
export const FRANJA_SUPERIOR =
  "grid gap-x-6 gap-y-3 border-b border-white/15 px-4 py-3.5 @4xl:grid-cols-[minmax(0,1fr)_auto] @6xl:px-5";
export const FRANJA_LATERAL = "grid content-center gap-1 border-white/15 @4xl:border-l @4xl:pl-6";
export const FRANJA_INDICADORES = "grid grid-cols-2 gap-px bg-white/15 @4xl:grid-cols-4";

/**
 * Porcentaje del pasivo en mora con un decimal, truncado (no redondeado) para que nunca muestre
 * el umbral cuando no se alcanza: 29,96 % se lee «29,9 %», no «30,0 %». La tolerancia es la misma
 * del motor, que da por cumplido un 30 % exacto aunque el cálculo binario quede un pelo debajo.
 */
function porcentajeTruncado(fraccion: number): string {
  return formatearPorcentaje(Math.floor((fraccion + 1e-9) * 1000) / 1000, 1);
}

/** Texto oscuro sobre el verde del Excel: el blanco no llega al contraste mínimo (2,9:1). */
const PASTILLA = {
  elegible: { texto: "ELEGIBLE", clase: "bg-hoja-elegible text-hoja-texto", Icono: CircleCheck },
  no_elegible: { texto: "NO ELEGIBLE", clase: "bg-destructive text-white", Icono: CircleX },
  sin_datos: { texto: "SIN DATOS", clase: "bg-white/15 text-white", Icono: CircleDashed },
} as const;

/** Indicador de la franja: rótulo, valor grande y una línea de detalle. */
export function Indicador({
  etiqueta,
  valor,
  children,
}: {
  etiqueta: string;
  valor: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-hoja-titulo px-4 py-3.5 @6xl:px-5 @6xl:py-4">
      <dt className={ROTULO}>{etiqueta}</dt>
      <dd className="text-lg leading-tight font-bold tracking-tight [overflow-wrap:anywhere] tabular-nums @sm:text-xl @4xl:text-2xl">
        {valor}
      </dd>
      {children ? <dd className="text-xs leading-snug text-white/75">{children}</dd> : null}
    </div>
  );
}

/**
 * Franja de resumen en el azul oscuro del título del Excel: elegibilidad preliminar con sus tres
 * condiciones, tipo de servicio y los indicadores que calcula el motor.
 */
export function ResumenIndicadores({
  resultado,
  tipoServicio,
  className,
}: {
  resultado: ResultadoDiagnostico;
  tipoServicio: TipoServicio | null;
  className?: string;
}) {
  const { elegibilidad, honorarios, centroConciliacion } = resultado;
  const minimos = PARAMETROS_DIAGNOSTICO.elegibilidad;
  const sinDatos = elegibilidad.estado === "sin_datos";
  const pastilla = PASTILLA[elegibilidad.estado];
  const condiciones = [
    {
      cumple: elegibilidad.cumple.obligaciones,
      texto: `${plural(elegibilidad.obligacionesEnMora, "obligación", "obligaciones")} con mora > 90 días`,
      minimo: `mín. ${minimos.minimoObligacionesEnMora}`,
    },
    {
      cumple: elegibilidad.cumple.acreedores,
      texto: `${plural(elegibilidad.acreedoresEnMora, "acreedor distinto", "acreedores distintos")} en mora`,
      minimo: `mín. ${minimos.minimoAcreedoresEnMora}`,
    },
    {
      cumple: elegibilidad.cumple.porcentaje,
      texto: `${porcentajeTruncado(elegibilidad.porcentajeEnMora)} del pasivo en mora`,
      minimo: `mín. ${formatearPorcentaje(minimos.umbralPasivoEnMora)}`,
    },
  ];

  return (
    <section aria-label="Resumen del diagnóstico" className={cn(FRANJA, className)}>
      <div className={FRANJA_SUPERIOR}>
        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className={ROTULO}>Elegibilidad preliminar</p>
            <p
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tracking-wide",
                pastilla.clase,
              )}
            >
              <pastilla.Icono className="size-4" aria-hidden />
              {pastilla.texto}
            </p>
          </div>
          <ul
            className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]"
            aria-label="Condiciones de elegibilidad"
          >
            {condiciones.map(({ cumple, texto, minimo }) => {
              const Icono = sinDatos ? CircleDashed : cumple ? CircleCheck : CircleX;
              return (
                <li key={texto} className="flex items-center gap-1.5">
                  <Icono
                    className={cn(
                      "size-4 shrink-0",
                      sinDatos ? "text-white/50" : cumple ? "text-hoja-elegible" : "text-white/60",
                    )}
                    aria-hidden
                  />
                  <span>
                    <span className="sr-only">
                      {sinDatos ? "Sin datos: " : cumple ? "Cumple: " : "No cumple: "}
                    </span>
                    {texto} <span className="text-white/60">({minimo})</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className={FRANJA_LATERAL}>
          <span className={ROTULO}>Tipo de servicio</span>
          <span className={cn("text-base font-semibold", !tipoServicio && "text-white/60 italic")}>
            {tipoServicio ? INFO_TIPO_SERVICIO[tipoServicio].etiqueta : "Sin definir"}
          </span>
        </p>
      </div>

      <dl className={FRANJA_INDICADORES}>
        <Indicador etiqueta="Pasivo total" valor={formatearPesos(resultado.pasivoTotal)}>
          {plural(resultado.numeroObligaciones, "obligación", "obligaciones")}
        </Indicador>
        <Indicador etiqueta="Honorarios" valor={formatearPesos(honorarios.valor)}>
          {formatearPorcentajeHonorarios(honorarios.porcentaje)} del pasivo total
        </Indicador>
        <Indicador etiqueta="Valor de la cuota" valor={formatearPesos(honorarios.valorCuota)}>
          {plural(honorarios.cuotas, "cuota", "cuotas")} de honorarios
        </Indicador>
        <Indicador etiqueta="Costo del proceso" valor={formatearPesos(resultado.costoProceso)}>
          Honorarios + gastos {formatearPesos(resultado.gastosProceso)}
          {centroConciliacion.aplica
            ? ` + centro ${formatearPesos(centroConciliacion.valor)}`
            : " (sin centro de conciliación)"}
        </Indicador>
      </dl>
    </section>
  );
}
