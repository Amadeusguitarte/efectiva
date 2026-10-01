import type { DatosPropuesta as Datos } from "@/lib/diagnostico/propuesta";
import { TEXTO_REQUIERE_REVISION } from "@/lib/diagnostico/propuesta";
import { formatearFecha, formatearPesos, formatearPorcentajeHonorarios } from "@/lib/formato";
import { cn } from "cn";

import { AlertasDiagnostico } from "./alertas-diagnostico";
import { FONDO_CLASE } from "./hoja/columnas";

const sinDato = "—";
const pesosONada = (valor: number | null) => (valor === null ? sinDato : formatearPesos(valor));

const CELDA = "border border-hoja-texto/70 px-2 py-1.5 break-words";

/** Encabezado azul de sección, como en la hoja DATOS PROPUESTA del Excel. */
function FilaSeccion({ children }: { children: React.ReactNode }) {
  return (
    <tr className="break-inside-avoid">
      <th
        scope="colgroup"
        colSpan={6}
        className={cn(CELDA, "bg-hoja-encabezado text-center text-[17px] font-bold text-white")}
      >
        {children}
      </th>
    </tr>
  );
}

function FilaDato({
  etiqueta,
  valor,
  claseValor,
}: {
  etiqueta: string;
  valor: React.ReactNode;
  claseValor?: string;
}) {
  return (
    <tr className="break-inside-avoid">
      <th scope="row" className={cn(CELDA, "text-left font-bold")}>
        {etiqueta}
      </th>
      <td colSpan={5} className={cn(CELDA, "text-center whitespace-pre-line", claseValor)}>
        {valor}
      </td>
    </tr>
  );
}

function FilaTexto({ texto }: { texto: string | null }) {
  return (
    <tr className="break-inside-avoid">
      <td
        colSpan={6}
        className={cn(
          CELDA,
          "min-h-16 bg-hoja-etiqueta px-3 py-2 font-semibold whitespace-pre-line",
        )}
      >
        {texto ?? sinDato}
      </td>
    </tr>
  );
}

/**
 * Equivalente a la hoja DATOS PROPUESTA del Excel: todo lo que necesita el abogado (o la IA)
 * para redactar la propuesta. Preparado para imprimir o guardar como PDF.
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
  return (
    <article className={cn("grid min-w-0 gap-8", className)}>
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

      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[44rem] table-fixed border-collapse font-hoja text-[15px] text-hoja-texto print:min-w-0 print:text-[11px]">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
          </colgroup>
          <tbody>
            <FilaSeccion>1. DATOS DEL CLIENTE</FilaSeccion>
            <FilaDato etiqueta="Nombre" valor={cliente.nombre} />
            <FilaDato etiqueta="Ocupación" valor={cliente.ocupacion ?? sinDato} />
            <FilaDato etiqueta="Ingresos mensuales" valor={pesosONada(cliente.ingresosMensuales)} />
            <FilaDato
              etiqueta="Gastos mensuales aproximados"
              valor={pesosONada(cliente.gastosMensuales)}
            />
            <FilaDato etiqueta="Bienes a nombre del deudor" valor={cliente.bienes ?? sinDato} />
            <FilaDato etiqueta="Estado civil" valor={cliente.estadoCivil ?? sinDato} />
            <FilaDato etiqueta="Pasivo total" valor={formatearPesos(datos.pasivoTotal)} />
            <FilaDato
              etiqueta="Elegibilidad del deudor"
              valor={datos.elegibilidad.etiqueta}
              claseValor={cn(
                "font-bold",
                datos.elegibilidad.estado === "elegible" && "bg-hoja-elegible text-white",
                datos.elegibilidad.estado === "no_elegible" && "bg-danger-soft text-destructive",
              )}
            />

            <FilaSeccion>2. DEUDAS DEL CLIENTE</FilaSeccion>
            <tr className="bg-hoja-encabezado text-white">
              {["CLASE", "ACREEDOR", "CONCEPTO", "VR ADEUDADO", "TIPO DE GARANTÍA", "MORA"].map(
                (titulo) => (
                  <th key={titulo} scope="col" className={cn(CELDA, "text-center font-bold")}>
                    {titulo}
                  </th>
                ),
              )}
            </tr>
            {datos.acreencias.length === 0 ? (
              <tr>
                <td colSpan={6} className={cn(CELDA, "text-center text-hoja-texto/60")}>
                  Sin obligaciones registradas.
                </td>
              </tr>
            ) : null}
            {datos.acreencias.map((a, indice) => (
              <tr key={indice} className="text-center">
                <td className={cn(CELDA, FONDO_CLASE[a.codigoClase])}>{a.clase}</td>
                <td className={CELDA}>{a.acreedor}</td>
                <td className={CELDA}>{a.concepto || sinDato}</td>
                <td className={cn(CELDA, "tabular-nums")}>{formatearPesos(a.valorAdeudado)}</td>
                <td className={CELDA}>{a.tipoGarantia}</td>
                <td className={CELDA}>{a.mora}</td>
              </tr>
            ))}
            <tr className="bg-hoja-banda text-center font-bold">
              <td className={CELDA} />
              <th scope="row" className={CELDA}>
                TOTAL
              </th>
              <td className={CELDA} />
              <td className={cn(CELDA, "tabular-nums")}>{formatearPesos(datos.pasivoTotal)}</td>
              <td className={cn(CELDA, "text-[13px] font-normal")} colSpan={2}>
                Mora &gt; 90 días: {datos.obligacionesConMoraMayor90} de {datos.acreencias.length}
              </td>
            </tr>

            <FilaSeccion>Observaciones Jurídicas</FilaSeccion>
            <FilaTexto texto={datos.observacionesJuridicas} />
            <FilaSeccion>Situación/urgencia del cliente</FilaSeccion>
            <FilaTexto texto={datos.situacionUrgencia} />
            <FilaSeccion>Objetivo del cliente</FilaSeccion>
            <FilaTexto texto={datos.objetivoCliente} />

            <FilaSeccion>Honorarios y datos del contrato</FilaSeccion>
            <FilaDato etiqueta="Tipo de servicio" valor={contrato.tipoServicio ?? sinDato} />
            <FilaDato
              etiqueta="% Honorarios"
              valor={formatearPorcentajeHonorarios(contrato.porcentajeHonorarios)}
            />
            <FilaDato etiqueta="$ Honorarios" valor={formatearPesos(contrato.valorHonorarios)} />
            <FilaDato etiqueta="Costo del proceso" valor={formatearPesos(contrato.costoProceso)} />
            <FilaDato etiqueta="Cuotas de honorarios" valor={String(contrato.cuotasHonorarios)} />
            <FilaDato etiqueta="Valor de la cuota" valor={formatearPesos(contrato.valorCuota)} />
            <FilaDato
              etiqueta="Requiere centro de conciliación"
              valor={contrato.requiereCentroConciliacion ? "SI" : "NO"}
            />
            {contrato.requiereCentroConciliacion ? (
              <FilaDato
                etiqueta="Valor del centro de conciliación"
                valor={formatearPesos(contrato.valorCentroConciliacion)}
              />
            ) : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}
