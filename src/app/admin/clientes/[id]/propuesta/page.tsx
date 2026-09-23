import { ChevronLeft, CircleAlert, ClipboardList, FileDown, FileText } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { guardarRedaccion } from "@/app/admin/clientes/[id]/propuesta/acciones";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { FormularioRedaccion } from "@/components/propuestas/formulario-redaccion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { obtenerRedaccionPropuesta } from "@/lib/datos/redaccion";
import { formatearFechaHora } from "@/lib/formato";
import { REDACCION_VACIA, redactarBorrador } from "@/lib/propuestas/contenido";

export const metadata: Metadata = {
  title: "Propuesta legal",
};

export default async function PropuestaPage({
  params,
}: PageProps<"/admin/clientes/[id]/propuesta">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [diagnostico, guardada] = await Promise.all([
    obtenerDiagnosticoCliente(id),
    obtenerRedaccionPropuesta(id),
  ]);
  if (!diagnostico) notFound();

  const { cliente, datosPropuesta, existe } = diagnostico;
  const rutaCliente = `/admin/clientes/${cliente.id}` as Route;
  const rutaMatriz = `/admin/clientes/${cliente.id}/diagnostico` as Route;
  const rutaDatos = `/admin/clientes/${cliente.id}/diagnostico/datos-propuesta` as Route;
  const rutaPdf = `/admin/clientes/${cliente.id}/propuesta/pdf`;

  const errores = datosPropuesta.alertas.filter((a) => a.nivel === "error");
  const lista = existe && errores.length === 0;
  const redaccion = guardada?.redaccion ?? REDACCION_VACIA;
  const borradores = {
    senor: redactarBorrador(datosPropuesta, "senor"),
    senora: redactarBorrador(datosPropuesta, "senora"),
  };

  return (
    <>
      <Link
        href={rutaCliente}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {cliente.nombre}
      </Link>

      <EncabezadoPagina
        titulo="Propuesta legal en PDF"
        descripcion={
          guardada
            ? `Redacción guardada el ${formatearFechaHora(guardada.actualizadoAt)}${guardada.actualizadoPor ? ` por ${guardada.actualizadoPor.nombre_completo ?? guardada.actualizadoPor.email}` : ""}.`
            : "Se genera con el formato oficial a partir de la matriz de diagnóstico y la redacción del equipo."
        }
        acciones={
          <>
            <Button asChild variant="outline">
              <Link href={rutaDatos}>
                <FileText />
                Datos para la propuesta
              </Link>
            </Button>
            {lista ? (
              <Button asChild size="lg">
                <a href={rutaPdf} target="_blank" rel="noopener">
                  <FileDown />
                  Generar PDF
                </a>
              </Button>
            ) : (
              <Button size="lg" disabled>
                <FileDown />
                Generar PDF
              </Button>
            )}
          </>
        }
      />

      {!existe ? (
        <Card>
          <CardHeader>
            <CardTitle>Falta la matriz de diagnóstico</CardTitle>
            <CardDescription>
              La propuesta toma las obligaciones, la elegibilidad y los honorarios de la matriz.
              Regístrala primero.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={rutaMatriz}>
                <ClipboardList />
                Registrar diagnóstico
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {errores.length > 0 ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Requiere revisión antes de generar la propuesta</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errores.map((alerta, indice) => (
                    <li key={indice}>{alerta.mensaje}</li>
                  ))}
                </ul>
                <Link href={rutaMatriz} className="mt-2 inline-block font-medium underline">
                  Corregir en la matriz
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Redacción de la propuesta</CardTitle>
              <CardDescription>
                Los puntos 1 a 4 parten de un texto sugerido con los datos de la matriz. Ajústalos,
                guarda y genera el PDF. Si cambias la matriz, los textos sugeridos se actualizan
                solos; los editados se conservan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioRedaccion
                key={guardada?.actualizadoAt ?? "nueva"}
                accion={guardarRedaccion.bind(null, cliente.id)}
                redaccion={redaccion}
                borradores={borradores}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lo que el PDF agrega por su cuenta</CardTitle>
              <CardDescription>Contenido fijo de la plantilla oficial.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-1.5 text-sm text-muted-foreground">
                <li>Encabezado y pie con la marca, el teléfono, el correo y la dirección.</li>
                <li>Fecha del día, tratamiento y nombre del cliente en mayúsculas.</li>
                <li>
                  Pasivo total, tabla de acreencias (clase, acreedor, concepto, valor, garantía y
                  mora) y análisis de mora y elegibilidad.
                </li>
                <li>
                  Párrafo fijo del punto 3 sobre la designación de la abogada como liquidadora.
                </li>
                <li>Puntos 5 (Gestión) y 6 (Idoneidad), cierre y firma.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
