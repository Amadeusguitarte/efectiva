import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { MatrizDiagnostico } from "@/components/diagnostico/matriz/matriz-diagnostico";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { obtenerDiagnosticoCliente } from "@/lib/datos/diagnostico";
import { formatearFechaHora } from "@/lib/formato";

import { buscarClientesMatriz, guardarDiagnostico } from "./acciones";

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
      clienteId={cliente.id}
      nombreCliente={cliente.nombre}
      rutaCliente={`/admin/clientes/${cliente.id}` as Route}
      buscarClientes={buscarClientesMatriz}
      estadoPropuesta={
        cliente.propuesta ? <EstadoBadge estado={cliente.propuesta.estado} /> : undefined
      }
      rutaDatosPropuesta={
        diagnostico.existe
          ? (`/admin/clientes/${cliente.id}/diagnostico/datos-propuesta` as Route)
          : null
      }
    />
  );
}
