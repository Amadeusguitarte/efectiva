import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ListasDiagnostico, ResumenListas } from "@/components/diagnostico/listas-diagnostico";
import { EncabezadoDashboard } from "@/components/diagnostico/matriz/encabezado-dashboard";
import { GuiaClases } from "@/components/diagnostico/matriz/guia-clases";
import { obtenerEncabezadoDiagnostico } from "@/lib/datos/diagnostico";
import { formatearFechaHora } from "@/lib/formato";

import { buscarClientesMatriz } from "../acciones";

export const metadata: Metadata = {
  title: "Listas",
};

/** Hoja «Listas» del Excel: catálogos y parámetros de la matriz, de solo lectura. */
export default async function ListasPage({
  params,
}: PageProps<"/admin/clientes/[id]/diagnostico/listas">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const encabezado = await obtenerEncabezadoDiagnostico(id);
  if (!encabezado) notFound();

  const { cliente, estadoPropuesta, actualizadoAt } = encabezado;

  return (
    <div className="@container grid min-w-0 gap-6">
      <EncabezadoDashboard
        hoja="listas"
        cliente={cliente}
        estadoPropuesta={estadoPropuesta}
        fechaActualizacion={actualizadoAt ? formatearFechaHora(actualizadoAt) : null}
        buscarClientes={buscarClientesMatriz}
        acciones={<GuiaClases />}
        franja={<ResumenListas />}
      />
      <ListasDiagnostico />
    </div>
  );
}
