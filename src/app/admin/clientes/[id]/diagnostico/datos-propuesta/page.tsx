import { ChevronLeft, Pencil } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { BotonesDatosPropuesta } from "@/components/diagnostico/botones-datos-propuesta";
import { DatosPropuesta } from "@/components/diagnostico/datos-propuesta";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { datosPropuestaComoTexto } from "@/lib/diagnostico/propuesta";

export const metadata: Metadata = {
  title: "Datos para la propuesta",
};

export default async function DatosPropuestaPage({
  params,
}: PageProps<"/admin/clientes/[id]/diagnostico/datos-propuesta">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const diagnostico = await obtenerDiagnosticoCliente(id);
  if (!diagnostico) notFound();

  const { cliente, datosPropuesta } = diagnostico;
  const rutaMatriz = `/admin/clientes/${cliente.id}/diagnostico` as Route;

  return (
    <>
      <div className="print:hidden">
        <Link
          href={rutaMatriz}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Matriz de diagnóstico
        </Link>

        <EncabezadoPagina
          titulo="Datos para la propuesta"
          descripcion={
            diagnostico.existe
              ? "Resumen del diagnóstico con el formato que usa el prompt de la propuesta. Imprímelo o cópialo como texto."
              : "Primero registra la matriz de diagnóstico del cliente."
          }
          acciones={
            <>
              <Button asChild variant="outline">
                <Link href={rutaMatriz}>
                  <Pencil />
                  Editar matriz
                </Link>
              </Button>
              {diagnostico.existe ? (
                <BotonesDatosPropuesta texto={datosPropuestaComoTexto(datosPropuesta)} />
              ) : null}
            </>
          }
        />
      </div>

      {diagnostico.existe ? (
        <Card className="print:border-0 print:shadow-none">
          <CardContent className="print:px-0">
            <DatosPropuesta datos={datosPropuesta} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Este cliente todavía no tiene diagnóstico.
          </CardContent>
        </Card>
      )}
    </>
  );
}
