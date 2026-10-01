import type { ReactNode } from "react";

import type { DatosPropuesta as Datos } from "@/lib/diagnostico/propuesta";
import { TEXTO_REQUIERE_REVISION } from "@/lib/diagnostico/propuesta";
import { formatearFecha, formatearPesos, formatearPorcentajeHonorarios } from "@/lib/formato";
import { cn } from "cn";

import { AlertasDiagnostico } from "./alertas-diagnostico";
import { ETIQUETA_FILA, FILA, FILA_TOTAL, TarjetaMatriz, VALOR_FILA } from "./matriz/controles";
import { EtiquetaClase } from "./matriz/resumenes";

const sinDato = "—";
const pesosONada = (valor: number | null) => (valor === null ? sinDato : formatearPesos(valor));

/** Las tarjetas van dentro de la tarjeta de la página: sin sombra y sin partirse al imprimir. */
const TARJETA = "break-inside-avoid shadow-none";

const ENCABEZADO =
  "px-3 py-2 text-[11px] leading-tight font-semibold tracking-wide whitespace-nowrap uppercase";
const CELDA = "px-3 py-2";

const ESTILO_ELEGIBILIDAD: Record<Datos["elegibilidad"]["estado"], string> = {
  elegible: "bg-hoja-elegible text-hoja-texto",
  no_elegible: "bg-danger-soft text-destructive",
  sin_datos: "bg-muted text-muted-foreground",
};

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className={FILA}>
      <dt className={ETIQUETA_FILA}>{etiqueta}</dt>
      <dd className={cn(VALOR_FILA, "px-3 text-sm break-words whitespace-pre-line")}>{children}</dd>
    </div>
  );
}

/**
 * Equivalente a la hoja DATOS PROPUESTA del Excel: todo lo que necesita el abogado (o la IA)
 * para redactar la propuesta, con las mismas piezas de la matriz. Preparado para imprimir o
 * guardar como PDF.
 */
export function DatosPropuesta({
  datos,
  fecha = new Date(),
  className,
}: {
  datos: Datos;
  fecha?: Date;
  className?: string;
}) {
  const { cliente, contrato } = datos;
  const errores = datos.alertas.filter((a) => a.nivel === "error");
  const avisos = datos.alertas.filter((a) => a.nivel !== "error");
  const notas = [
    { titulo: "Observaciones jurídicas", texto: datos.observacionesJuridicas },
    { titulo: "Situación / urgencia del cliente", texto: datos.situacionUrgencia },
    { titulo: "Objetivo del cliente", texto: datos.objetivoCliente },
  ];
  return (
    <article className={cn("@container grid min-w-0 gap-6", className)}>
      {errores.length > 0 ? (
        <div
          role="alert"
          className="break-inside-avoid rounded-md border border-destructive/30 bg-danger-soft p-4 text-sm text-destructive"
        >
          <p className="font-semibold">{TEXTO_REQUIERE_REVISION}</p>
          <ul className="mt-1 list-disc pl-5">
            {errores.map((a, indice) => (
              <li key={indice}>{a.mensaje}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <AlertasDiagnostico alertas={avisos} className="print:hidden" />

      <header className="grid gap-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Insolvencia Efectiva · Datos para la propuesta
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{cliente.nombre}</h1>
        <p className="text-sm text-muted-foreground">Generado el {formatearFecha(fecha)}</p>
      </header>

      <div className="grid gap-6 @3xl:grid-cols-2">
        <TarjetaMatriz
          id="datos-propuesta-cliente"
          titulo="1. Datos del cliente"
          className={TARJETA}
        >
          <dl>
            <Dato etiqueta="Nombre">{cliente.nombre}</Dato>
            <Dato etiqueta="Ocupación">{cliente.ocupacion ?? sinDato}</Dato>
            <Dato etiqueta="Ingresos mensuales">{pesosONada(cliente.ingresosMensuales)}</Dato>
            <Dato etiqueta="Gastos mensuales aproximados">
              {pesosONada(cliente.gastosMensuales)}
            </Dato>
            <Dato etiqueta="Bienes a nombre del deudor">{cliente.bienes ?? sinDato}</Dato>
            <Dato etiqueta="Estado civil">{cliente.estadoCivil ?? sinDato}</Dato>
            <Dato etiqueta="Pasivo total">
              <span className="font-semibold tabular-nums">
                {formatearPesos(datos.pasivoTotal)}
              </span>
            </Dato>
            <Dato etiqueta="Elegibilidad del deudor">
              <span
                className={cn(
                  "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
                  ESTILO_ELEGIBILIDAD[datos.elegibilidad.estado],
                )}
              >
                {datos.elegibilidad.etiqueta}
              </span>
            </Dato>
          </dl>
        </TarjetaMatriz>

        <TarjetaMatriz
          id="datos-propuesta-contrato"
          titulo="Honorarios y datos del contrato"
          className={TARJETA}
        >
          <dl>
            <Dato etiqueta="Tipo de servicio">{contrato.tipoServicio ?? sinDato}</Dato>
            <Dato etiqueta="% Honorarios">
              {formatearPorcentajeHonorarios(contrato.porcentajeHonorarios)}
            </Dato>
            <Dato etiqueta="$ Honorarios">{formatearPesos(contrato.valorHonorarios)}</Dato>
            <Dato etiqueta="Costo del proceso">{formatearPesos(contrato.costoProceso)}</Dato>
            <Dato etiqueta="Cuotas de honorarios">{String(contrato.cuotasHonorarios)}</Dato>
            <Dato etiqueta="Valor de la cuota">{formatearPesos(contrato.valorCuota)}</Dato>
            <Dato etiqueta="Requiere centro de conciliación">
              {/* Texto exacto del prompt, igual que la copia como texto. */}
              {contrato.requiereCentroConciliacion ? "SI" : "NO"}
            </Dato>
            {contrato.requiereCentroConciliacion ? (
              <Dato etiqueta="Valor del centro de conciliación">
                {formatearPesos(contrato.valorCentroConciliacion)}
              </Dato>
            ) : null}
          </dl>
        </TarjetaMatriz>
      </div>

      <TarjetaMatriz id="datos-propuesta-deudas" titulo="2. Deudas del cliente" className={TARJETA}>
        <div className="relative overflow-x-auto print:overflow-visible">
          <table
            className="w-full min-w-[40rem] border-collapse text-sm print:min-w-0"
            aria-labelledby="datos-propuesta-deudas"
          >
            <thead className="border-b border-hoja-cuadricula bg-hoja-etiqueta text-foreground">
              <tr>
                <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                  Clase
                </th>
                <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                  Acreedor
                </th>
                <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                  Concepto
                </th>
                <th scope="col" className={cn(ENCABEZADO, "text-right")}>
                  Vr adeudado
                </th>
                <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                  Tipo de garantía
                </th>
                <th scope="col" className={cn(ENCABEZADO, "text-left")}>
                  Mora
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.acreencias.length === 0 ? (
                <tr className="border-b border-hoja-cuadricula/70">
                  <td colSpan={6} className={cn(CELDA, "py-6 text-center text-muted-foreground")}>
                    Sin obligaciones registradas.
                  </td>
                </tr>
              ) : null}
              {datos.acreencias.map((a, indice) => (
                <tr key={indice} className="break-inside-avoid border-b border-hoja-cuadricula/70">
                  <td className={CELDA}>
                    <EtiquetaClase clase={a.codigoClase} />
                  </td>
                  <td className={cn(CELDA, "font-medium")}>{a.acreedor}</td>
                  <td className={cn(CELDA, "text-muted-foreground")}>{a.concepto || sinDato}</td>
                  <td
                    className={cn(CELDA, "text-right font-semibold whitespace-nowrap tabular-nums")}
                  >
                    {formatearPesos(a.valorAdeudado)}
                  </td>
                  <td className={CELDA}>{a.tipoGarantia}</td>
                  <td className={cn(CELDA, "whitespace-nowrap")}>{a.mora}</td>
                </tr>
              ))}
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
                <td className={cn(CELDA, "text-right whitespace-nowrap tabular-nums")}>
                  {formatearPesos(datos.pasivoTotal)}
                </td>
                <td colSpan={2} className={cn(CELDA, "text-xs font-medium")}>
                  Mora &gt; 90 días: {datos.obligacionesConMoraMayor90} de {datos.acreencias.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </TarjetaMatriz>

      <TarjetaMatriz id="datos-propuesta-notas" titulo="Notas del caso" className={TARJETA}>
        <div className="grid gap-4 p-4 @3xl:grid-cols-3">
          {notas.map(({ titulo, texto }) => (
            <section key={titulo} className="grid content-start gap-1.5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-hoja-titulo">
                <span aria-hidden className="size-1.5 rounded-full bg-hoja-vineta" />
                {titulo}
              </h3>
              <p
                className={cn(
                  "min-h-16 rounded-md bg-hoja-etiqueta px-3 py-2 text-sm whitespace-pre-line",
                  !texto && "text-muted-foreground",
                )}
              >
                {texto ?? sinDato}
              </p>
            </section>
          ))}
        </div>
      </TarjetaMatriz>
    </article>
  );
}
