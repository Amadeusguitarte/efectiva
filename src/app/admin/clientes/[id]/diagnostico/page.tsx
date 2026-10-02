import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { MatrizDiagnostico } from "@/components/diagnostico/matriz/matriz-diagnostico";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { formatearFechaHora } from "@/lib/formato";

import { buscarClientesMatriz, guardarDiagnostico } from "./acciones";

export const metadata: Metadata = {
  title: "Matriz de diagnóstico",
};

export default async function DiagnosticoPage({
  params,
  searchParams,
}: PageProps<"/admin/clientes/[id]/diagnostico">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [diagnostico, { creado }] = await Promise.all([
    obtenerDiagnosticoCliente(id),
    searchParams,
  ]);
  if (!diagnostico) notFound();

  const { cliente } = diagnostico;
  const accion = guardarDiagnostico.bind(null, cliente.id);

  return (
    <MatrizDiagnostico
      // Al cambiar de cliente desde la pestaña, la matriz empieza de cero con los datos nuevos.
      key={cliente.id}
      accion={accion}
      inicial={diagnostico.entrada}
      actualizadoAt={diagnostico.actualizadoAt}
      fechaActualizacion={
        diagnostico.existe && diagnostico.actualizadoAt
          ? formatearFechaHora(diagnostico.actualizadoAt)
          : null
      }
      cliente={{ id: cliente.id, nombre: cliente.nombre }}
      valoresCliente={diagnostico.valoresCliente}
      // Viene de crear el cliente desde la matriz («Nuevo cliente»).
      avisoCreado={creado === "1"}
      buscarClientes={buscarClientesMatriz}
      estadoPropuesta={cliente.propuesta?.estado ?? null}
    />
  );
}
