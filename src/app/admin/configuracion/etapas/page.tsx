import type { Metadata } from "next";

import { ListaEtapas } from "@/components/configuracion/lista-etapas";
import { obtenerEtapas } from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "Etapas",
};

export default async function EtapasPage() {
  const etapas = await obtenerEtapas();
  return (
    <>
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Cada etapa del pipeline puede crear tareas para el responsable (documentos solicitados,
        recontacto, seguimiento) y enviar un correo automático al contacto cuando un caso entra en
        ella.
      </p>
      <ListaEtapas etapas={etapas} />
    </>
  );
}
