import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DatosPropuesta as Datos } from "@/lib/diagnostico/propuesta";
import { TEXTO_REQUIERE_REVISION } from "@/lib/diagnostico/propuesta";
import { formatearFecha, formatearPesos, formatearPorcentajeHonorarios } from "@/lib/formato";
import { cn } from "cn";

import { AlertasDiagnostico } from "./alertas-diagnostico";
import { ElegibilidadBadge } from "./elegibilidad-badge";

const sinDato = "—";
const pesosONada = (valor: number | null) => (valor === null ? sinDato : formatearPesos(valor));

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid min-w-0 break-inside-avoid gap-3">
      <h2 className="border-b pb-1 text-sm font-semibold tracking-wide text-primary uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 py-1 text-sm sm:grid-cols-[minmax(0,14rem)_1fr]">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 break-words whitespace-pre-line">{valor}</dd>
    </div>
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

      <Seccion titulo="1. Datos del cliente">
        <dl className="divide-y">
          <Dato etiqueta="Nombre" valor={cliente.nombre} />
          <Dato etiqueta="Ocupación" valor={cliente.ocupacion ?? sinDato} />
          <Dato etiqueta="Ingresos mensuales" valor={pesosONada(cliente.ingresosMensuales)} />
          <Dato
            etiqueta="Gastos mensuales aproximados"
            valor={pesosONada(cliente.gastosMensuales)}
          />
          <Dato etiqueta="Bienes a nombre del deudor" valor={cliente.bienes ?? sinDato} />
          <Dato etiqueta="Estado civil" valor={cliente.estadoCivil ?? sinDato} />
          <Dato etiqueta="Pasivo total" valor={formatearPesos(datos.pasivoTotal)} />
          <Dato
            etiqueta="Elegibilidad del deudor"
            valor={
              <span className="inline-flex flex-wrap items-center gap-2">
                {datos.elegibilidad.etiqueta}
                <ElegibilidadBadge estado={datos.elegibilidad.estado} className="print:hidden" />
              </span>
            }
          />
        </dl>
      </Seccion>

      <Seccion titulo="2. Deudas del cliente">
        {datos.acreencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin obligaciones registradas.</p>
        ) : (
          <div className="w-full overflow-x-auto print:overflow-visible">
            <Table className="min-w-[40rem] print:min-w-0 print:text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Acreedor</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Vr. adeudado</TableHead>
                  <TableHead>Tipo de garantía</TableHead>
                  <TableHead>Mora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.acreencias.map((a, indice) => (
                  <TableRow key={indice}>
                    <TableCell className="font-medium">{a.clase}</TableCell>
                    <TableCell>{a.acreedor}</TableCell>
                    <TableCell>{a.concepto || sinDato}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatearPesos(a.valorAdeudado)}
                    </TableCell>
                    <TableCell>{a.tipoGarantia}</TableCell>
                    <TableCell>{a.mora}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatearPesos(datos.pasivoTotal)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Obligaciones con más de 90 días de mora: {datos.obligacionesConMoraMayor90} de{" "}
          {datos.acreencias.length}.
        </p>
      </Seccion>

      <Seccion titulo="3. Observaciones jurídicas">
        <p className="text-sm whitespace-pre-line">{datos.observacionesJuridicas ?? sinDato}</p>
      </Seccion>

      <Seccion titulo="4. Situación y urgencia del cliente">
        <p className="text-sm whitespace-pre-line">{datos.situacionUrgencia ?? sinDato}</p>
      </Seccion>

      <Seccion titulo="5. Objetivo del cliente">
        <p className="text-sm whitespace-pre-line">{datos.objetivoCliente ?? sinDato}</p>
      </Seccion>

      <Seccion titulo="6. Honorarios y datos del contrato">
        <dl className="divide-y">
          <Dato etiqueta="Tipo de servicio" valor={contrato.tipoServicio ?? sinDato} />
          <Dato
            etiqueta="% Honorarios"
            valor={formatearPorcentajeHonorarios(contrato.porcentajeHonorarios)}
          />
          <Dato etiqueta="$ Honorarios" valor={formatearPesos(contrato.valorHonorarios)} />
          <Dato etiqueta="Cuotas de honorarios" valor={String(contrato.cuotasHonorarios)} />
          <Dato etiqueta="Valor de la cuota" valor={formatearPesos(contrato.valorCuota)} />
          <Dato
            etiqueta="Requiere centro de conciliación"
            valor={contrato.requiereCentroConciliacion ? "SI" : "NO"}
          />
          {contrato.requiereCentroConciliacion ? (
            <Dato
              etiqueta="Valor del centro de conciliación"
              valor={formatearPesos(contrato.valorCentroConciliacion)}
            />
          ) : null}
          <Dato etiqueta="Costo del proceso" valor={formatearPesos(contrato.costoProceso)} />
        </dl>
      </Seccion>
    </article>
  );
}
