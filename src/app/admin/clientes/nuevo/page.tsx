import type { Metadata } from "next";

import {
  buscarClientesMatriz,
  crearClienteConMatriz,
} from "@/app/admin/clientes/[id]/diagnostico/acciones";
import { MatrizDiagnostico } from "@/components/diagnostico/matriz/matriz-diagnostico";
import { requerirAdmin } from "@/lib/auth/sesion";
import { diagnosticoVacio } from "@/lib/diagnostico/calcular";
import { valoresClienteVacios } from "@/lib/validaciones/cliente";

export const metadata: Metadata = {
  title: "Nuevo cliente",
};

/**
 * Alta de clientes: no hay formulario aparte. Se abre la matriz de diagnóstico vacía, se
 * escriben los datos del cliente en «Datos del cliente» junto con su diagnóstico y, al guardar,
 * se crea el expediente con su matriz (crearClienteConMatriz).
 */
export default async function NuevoClientePage() {
  await requerirAdmin();

  return (
    <MatrizDiagnostico
      accion={crearClienteConMatriz}
      inicial={diagnosticoVacio()}
      actualizadoAt={null}
      fechaActualizacion={null}
      cliente={null}
      valoresCliente={valoresClienteVacios()}
      buscarClientes={buscarClientesMatriz}
      estadoPropuesta={null}
    />
  );
}
