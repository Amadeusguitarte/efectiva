import { ArrowRight, FileText } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { INFO_TIPO_SERVICIO } from "@/lib/diagnostico/catalogos";
import type { DatosPropuesta as Datos } from "@/lib/diagnostico/propuesta";
import { TEXTO_REQUIERE_REVISION } from "@/lib/diagnostico/propuesta";
import {
  formatearFecha,
  formatearPesos,
  formatearPorcentajeHonorarios,
  plural,
} from "@/lib/formato";
import { cn } from "cn";

import { AlertasDiagnostico } from "./alertas-diagnostico";
import {
  CABECERA_TABLA,
  CELDA_TABLA,
  Contador,
  ENCABEZADO_TABLA,
  FILA_TABLA,
  FILA_TOTAL,
  FilaDato,
  TarjetaMatriz,
} from "./matriz/controles";
import { FRANJA, ROTULO } from "./matriz/resumen-indicadores";
import { EtiquetaClase } from "./matriz/resumenes";
import { TablaDesplazable } from "./matriz/tabla-desplazable";

const sinDato = "—";
const pesosONada = (valor: number | null) => (valor === null ? sinDato : formatearPesos(valor));

/**
 * Valor con dos textos: en pantalla, el del panel (igual que la franja y la hoja Diagnóstico); al
 * imprimir, el texto exacto del prompt, el mismo de «Copiar como texto» y de la hoja del Excel.
 */
function TextoPanelOPropuesta({ panel, propuesta }: { panel: string; propuesta: string }) {
  if (panel === propuesta) return panel;
  return (
    <>
      <span className="print:hidden">{panel}</span>
      <span className="hidden print:inline">{propuesta}</span>
    </>
  );
}

/** Al imprimir, las tarjetas pequeñas no se parten entre dos páginas y no llevan sombra. */
const TARJETA = "print:break-inside-avoid print:shadow-none";

const ESTILO_ELEGIBILIDAD: Record<Datos["elegibilidad"]["estado"], string> = {
  elegible: "bg-hoja-elegible text-hoja-texto",
  no_elegible: "bg-danger-soft text-destructive",
  sin_datos: "bg-muted text-foreground/80",
};

/**
 * Título de tarjeta con el número de su sección en la hoja DATOS PROPUESTA (y en la copia como
 * texto). En pantalla las tarjetas se reparten en columnas y el número sobraría; al imprimir van
 * en el orden del Excel, numeradas.
 */
function Titulo({ numero, children }: { numero: number; children: ReactNode }) {
  return (
    <>
      <span className="hidden print:inline">{numero}. </span>
      {children}
    </>
  );
}

/**
 * Equivalente a la hoja DATOS PROPUESTA del Excel con el diseño del dashboard: todo lo que
 * necesita el abogado (o la IA) para redactar la propuesta, en tarjetas con la cabecera azul de la
 * matriz. El encabezado y la franja de resumen los pone la página; al imprimir o guardar como PDF
 * se ocultan y esta vista lleva su propio encabezado, con las secciones numeradas en el orden del
 * Excel y sus colores.
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
    {
      id: "datos-propuesta-observaciones",
      numero: 3,
      titulo: "Observaciones jurídicas",
      texto: datos.observacionesJuridicas,
    },
    {
      id: "datos-propuesta-situacion",
      numero: 4,
      titulo: "Situación / urgencia del cliente",
      texto: datos.situacionUrgencia,
    },
    {
      id: "datos-propuesta-objetivo",
      numero: 5,
      titulo: "Objetivo del cliente",
      texto: datos.objetivoCliente,
    },
  ];
  const obligaciones = datos.acreencias.length;

  return (
    <article
      className={cn(
        "@container grid min-w-0 gap-6",
        // Los colores del Excel (cabeceras, clases, TOTAL) también en papel y en PDF.
        "print:gap-5 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]",
        className,
      )}
    >
      {/* Primero, también al imprimir: el prompt exige empezar por este aviso. */}
      {errores.length > 0 ? (
        <div
          role="alert"
          className="break-inside-avoid rounded-xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive"
        >
          <p className="font-semibold">{TEXTO_REQUIERE_REVISION}</p>
          <ul className="mt-1 list-disc pl-5">
            {errores.map((a, indice) => (
              <li key={indice}>{a.mensaje}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <AlertasDiagnostico alertas={avisos} className="@4xl:grid-cols-2 print:hidden" />

      {/* Solo al imprimir: en pantalla el título y el cliente están en el encabezado del dashboard. */}
      <header className="hidden gap-1 border-b-2 border-hoja-titulo pb-3 print:grid">
        <p className="text-xs font-semibold tracking-wide text-hoja-encabezado uppercase">
          Insolvencia Efectiva · Datos para la propuesta
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-hoja-titulo">{cliente.nombre}</h1>
        <p className="text-sm text-muted-foreground">Generado el {formatearFecha(fecha)}</p>
      </header>

      {/* Seis columnas: dos tarjetas por fila arriba, la tabla a todo el ancho y las tres notas
          lado a lado. Al imprimir, una sola columna en el orden de la hoja del Excel (1 a 6). */}
      <div className="grid gap-6 @4xl:grid-cols-6 print:flex print:flex-col print:gap-5">
        <TarjetaMatriz
          id="datos-propuesta-cliente"
          titulo={<Titulo numero={1}>Datos del cliente</Titulo>}
          className={cn(TARJETA, "@4xl:col-span-3")}
        >
          <dl>
            <FilaDato etiqueta="Nombre">{cliente.nombre}</FilaDato>
            <FilaDato etiqueta="Ocupación">{cliente.ocupacion ?? sinDato}</FilaDato>
            <FilaDato etiqueta="Ingresos mensuales">
              {pesosONada(cliente.ingresosMensuales)}
            </FilaDato>
            <FilaDato etiqueta="Gastos mensuales aproximados">
              {pesosONada(cliente.gastosMensuales)}
            </FilaDato>
            <FilaDato etiqueta="Bienes a nombre del deudor">{cliente.bienes ?? sinDato}</FilaDato>
            <FilaDato etiqueta="Estado civil">{cliente.estadoCivil ?? sinDato}</FilaDato>
            <FilaDato etiqueta="Pasivo total" destacado>
              {formatearPesos(datos.pasivoTotal)}
            </FilaDato>
            <FilaDato etiqueta="Elegibilidad del deudor">
              <span
                className={cn(
                  "inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
                  ESTILO_ELEGIBILIDAD[datos.elegibilidad.estado],
                )}
              >
                {datos.elegibilidad.etiqueta}
              </span>
            </FilaDato>
          </dl>
        </TarjetaMatriz>

        <TarjetaMatriz
          id="datos-propuesta-contrato"
          titulo={<Titulo numero={6}>Honorarios y datos del contrato</Titulo>}
          className={cn(TARJETA, "@4xl:col-span-3 print:order-last")}
        >
          <dl>
            <FilaDato etiqueta="Tipo de servicio">
              {contrato.codigoServicio && contrato.tipoServicio ? (
                <TextoPanelOPropuesta
                  panel={INFO_TIPO_SERVICIO[contrato.codigoServicio].etiqueta}
                  propuesta={contrato.tipoServicio}
                />
              ) : (
                sinDato
              )}
            </FilaDato>
            <FilaDato etiqueta="% Honorarios">
              {formatearPorcentajeHonorarios(contrato.porcentajeHonorarios)}
            </FilaDato>
            <FilaDato etiqueta="$ Honorarios">{formatearPesos(contrato.valorHonorarios)}</FilaDato>
            <FilaDato etiqueta="Costo del proceso" destacado>
              {formatearPesos(contrato.costoProceso)}
            </FilaDato>
            <FilaDato etiqueta="Cuotas de honorarios">{String(contrato.cuotasHonorarios)}</FilaDato>
            <FilaDato etiqueta="Valor de la cuota">{formatearPesos(contrato.valorCuota)}</FilaDato>
            <FilaDato etiqueta="Requiere centro de conciliación">
              {contrato.requiereCentroConciliacion ? (
                <TextoPanelOPropuesta panel="Sí" propuesta="SI" />
              ) : (
                <TextoPanelOPropuesta panel="No" propuesta="NO" />
              )}
            </FilaDato>
            {contrato.requiereCentroConciliacion ? (
              <FilaDato etiqueta="Valor del centro de conciliación">
                {formatearPesos(contrato.valorCentroConciliacion)}
              </FilaDato>
            ) : null}
          </dl>
        </TarjetaMatriz>

        {/* La tabla puede ocupar más de una página al imprimir: se parte entre filas. */}
        <TarjetaMatriz
          id="datos-propuesta-deudas"
          titulo={<Titulo numero={2}>Deudas del cliente</Titulo>}
          tono="titulo"
          extra={<Contador>{plural(obligaciones, "obligación", "obligaciones")}</Contador>}
          className="@4xl:col-span-6 print:shadow-none"
        >
          <TablaDesplazable etiqueta="Tabla de deudas" className="print:overflow-visible">
            <table
              className="w-full min-w-[40rem] border-collapse text-sm print:min-w-0"
              aria-labelledby="datos-propuesta-deudas"
            >
              <thead className={CABECERA_TABLA}>
                <tr>
                  <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
                    Clase
                  </th>
                  <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
                    Acreedor
                  </th>
                  <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
                    Concepto
                  </th>
                  <th scope="col" className={cn(ENCABEZADO_TABLA, "text-right")}>
                    Vr adeudado
                  </th>
                  <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
                    Tipo de garantía
                  </th>
                  <th scope="col" className={cn(ENCABEZADO_TABLA, "text-left")}>
                    Mora
                  </th>
                </tr>
              </thead>
              <tbody>
                {obligaciones === 0 ? (
                  <tr className={FILA_TABLA}>
                    <td
                      colSpan={6}
                      className={cn(CELDA_TABLA, "py-6 text-center text-muted-foreground")}
                    >
                      Sin obligaciones registradas.
                    </td>
                  </tr>
                ) : null}
                {datos.acreencias.map((a, indice) => (
                  <tr
                    key={indice}
                    className={cn(FILA_TABLA, "break-inside-avoid even:bg-hoja-franja-suave/40")}
                  >
                    <td className={CELDA_TABLA}>
                      <EtiquetaClase clase={a.codigoClase} />
                    </td>
                    <td className={cn(CELDA_TABLA, "font-medium")}>{a.acreedor}</td>
                    {/* Sobre la franja de las filas pares el gris atenuado no llega a 4,5:1. */}
                    <td className={cn(CELDA_TABLA, "text-foreground/80")}>
                      {a.concepto || sinDato}
                    </td>
                    <td
                      className={cn(
                        CELDA_TABLA,
                        "text-right font-semibold whitespace-nowrap tabular-nums",
                      )}
                    >
                      {formatearPesos(a.valorAdeudado)}
                    </td>
                    <td className={CELDA_TABLA}>{a.tipoGarantia}</td>
                    <td className={cn(CELDA_TABLA, "whitespace-nowrap")}>{a.mora}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={FILA_TOTAL}>
                  <th
                    scope="row"
                    colSpan={3}
                    className={cn(CELDA_TABLA, "text-left tracking-wide uppercase")}
                  >
                    Total
                  </th>
                  <td className={cn(CELDA_TABLA, "text-right whitespace-nowrap tabular-nums")}>
                    {formatearPesos(datos.pasivoTotal)}
                  </td>
                  <td colSpan={2} className={cn(CELDA_TABLA, "text-xs font-medium")}>
                    Mora &gt; 90 días: {datos.obligacionesConMoraMayor90} de {obligaciones}
                  </td>
                </tr>
              </tfoot>
            </table>
          </TablaDesplazable>
        </TarjetaMatriz>

        {notas.map(({ id, numero, titulo, texto }) => (
          <TarjetaMatriz
            key={id}
            id={id}
            titulo={<Titulo numero={numero}>{titulo}</Titulo>}
            className={cn(TARJETA, "@4xl:col-span-2")}
          >
            <p
              className={cn(
                "flex-1 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-line",
                !texto && "text-muted-foreground",
              )}
            >
              {texto ?? sinDato}
            </p>
          </TarjetaMatriz>
        ))}
      </div>
    </article>
  );
}

/**
 * Estado vacío de la hoja cuando el cliente aún no tiene matriz guardada: ocupa el lugar de la
 * franja de resumen (unido a la pestaña de la hoja) y lleva a la pestaña Diagnóstico.
 */
export function DatosPropuestaSinMatriz({
  rutaDiagnostico,
  className,
}: {
  rutaDiagnostico: Route;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="datos-propuesta-sin-matriz"
      className={cn(
        FRANJA,
        "grid gap-x-6 gap-y-4 px-4 py-6 @2xl:grid-cols-[auto_minmax(0,1fr)] @2xl:items-center @4xl:grid-cols-[auto_minmax(0,1fr)_auto] @6xl:px-6",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full bg-white/10 text-hoja-franja ring-1 ring-white/15"
      >
        <FileText className="size-6" />
      </span>
      <div className="grid gap-1">
        <p className={ROTULO}>Sin matriz de diagnóstico</p>
        <h2 id="datos-propuesta-sin-matriz" className="text-lg font-semibold text-white">
          Este cliente aún no tiene datos para la propuesta
        </h2>
        <p className="max-w-prose text-sm text-white/75">
          Esta hoja se arma con la matriz de diagnóstico guardada. Diligénciala en la pestaña
          Diagnóstico y guárdala para ver aquí los datos del cliente, sus deudas, las notas del caso
          y los honorarios.
        </p>
      </div>
      {/* Foco en el azul claro de la franja: el anillo por defecto casi no se ve sobre el oscuro. */}
      <Button
        asChild
        className="justify-self-start bg-card text-hoja-titulo hover:bg-hoja-franja focus-visible:border-hoja-franja focus-visible:ring-hoja-franja @2xl:col-start-2 @4xl:col-start-auto @4xl:justify-self-end"
      >
        <Link href={rutaDiagnostico}>
          Ir a Diagnóstico
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
