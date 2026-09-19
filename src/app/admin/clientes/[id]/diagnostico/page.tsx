import { ChevronLeft, FileText } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { FormularioDiagnostico } from "@/components/diagnostico/formulario-diagnostico";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { Button } from "@/components/ui/button";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { formatearFechaHora } from "@/lib/formato";

import { guardarDiagnostico } from "./acciones";

export const metadata: Metadata = {
  title: "Matriz de diagnóstico",
};

export default async function DiagnosticoPage({
  params,
}: PageProps<"/admin/clientes/[id]/diagnostico">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const diagnostico = await obtenerDiagnosticoCliente(id);
  if (!diagnostico) notFound();

  const { cliente } = diagnostico;
  const accion = guardarDiagnostico.bind(null, cliente.id);

  return (
    <>
      <Link
        href={`/admin/clientes/${cliente.id}` as Route}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {cliente.nombre}
      </Link>

      <EncabezadoPagina
        titulo="Matriz de diagnóstico"
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            {cliente.propuesta ? <EstadoBadge estado={cliente.propuesta.estado} /> : null}
            <span>
              {diagnostico.existe && diagnostico.actualizadoAt
                ? `Actualizada el ${formatearFechaHora(diagnostico.actualizadoAt)}. Los indicadores se recalculan mientras escribes.`
                : "Sin registrar. Los indicadores se calculan mientras escribes y se guardan al final."}
            </span>
          </span>
        }
        acciones={
          diagnostico.existe ? (
            <Button asChild variant="outline">
              <Link href={`/admin/clientes/${cliente.id}/diagnostico/datos-propuesta` as Route}>
                <FileText />
                Datos para la propuesta
              </Link>
            </Button>
          ) : null
        }
      />

      <FormularioDiagnostico
        accion={accion}
        inicial={diagnostico.entrada}
        actualizadoAt={diagnostico.actualizadoAt}
      />
    </>
  );
}
