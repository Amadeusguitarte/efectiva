import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { BotonesDatosPropuesta } from "@/components/diagnostico/botones-datos-propuesta";
import { DatosPropuesta, DatosPropuestaSinMatriz } from "@/components/diagnostico/datos-propuesta";
import { EncabezadoDashboard } from "@/components/diagnostico/matriz/encabezado-dashboard";
import { ResumenIndicadores } from "@/components/diagnostico/matriz/resumen-indicadores";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { rutaHoja } from "@/lib/diagnostico/hojas";
import { datosPropuestaComoTexto } from "@/lib/diagnostico/propuesta";
import { formatearFechaHora } from "@/lib/formato";

import { buscarClientesMatriz } from "../acciones";

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

  const { cliente, datosPropuesta, existe } = diagnostico;

  return (
    <div className="@container grid min-w-0 gap-6">
      {/* Al imprimir solo sale la hoja, con su propio encabezado. */}
      <EncabezadoDashboard
        hoja="datos-propuesta"
        cliente={{ id: cliente.id, nombre: cliente.nombre }}
        estadoPropuesta={cliente.propuesta?.estado ?? null}
        fechaActualizacion={
          existe && diagnostico.actualizadoAt ? formatearFechaHora(diagnostico.actualizadoAt) : null
        }
        buscarClientes={buscarClientesMatriz}
        acciones={
          existe ? (
            <BotonesDatosPropuesta texto={datosPropuestaComoTexto(datosPropuesta)} />
          ) : undefined
        }
        franja={
          existe ? (
            <ResumenIndicadores
              resultado={diagnostico.resultado}
              tipoServicio={diagnostico.entrada.tipoServicio}
            />
          ) : (
            <DatosPropuestaSinMatriz rutaDiagnostico={rutaHoja(cliente.id, "diagnostico")} />
          )
        }
        className="print:hidden"
      />

      {existe ? <DatosPropuesta datos={datosPropuesta} /> : null}
    </div>
  );
}
