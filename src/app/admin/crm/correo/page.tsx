import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { Bandeja } from "@/components/crm/bandeja";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Badge } from "@/components/ui/badge";
import { listarConversaciones, obtenerAjustes, obtenerCaso } from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "Correo",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function BandejaCorreoPage({ searchParams }: PageProps<"/admin/crm/correo">) {
  const parametros = await searchParams;
  const busqueda = texto(parametros.q) ?? "";
  const casoId = texto(parametros.caso);

  const [conversaciones, ajustes, caso] = await Promise.all([
    listarConversaciones("correo", busqueda),
    obtenerAjustes(),
    casoId && z.uuid().safeParse(casoId).success ? obtenerCaso(casoId) : Promise.resolve(null),
  ]);
  const activo = ajustes.correo.activo && ajustes.correo.tieneContrasena;

  return (
    <>
      <EncabezadoPagina
        titulo="Correo"
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={activo ? "secondary" : "outline"}>
              {activo ? "Cuenta conectada" : "Sin configurar"}
            </Badge>
            {activo ? <span>{ajustes.correo.remitenteEmail}</span> : null}
            {ajustes.correo.ultimoError ? (
              <span className="text-destructive">Último error: {ajustes.correo.ultimoError}</span>
            ) : null}
            {!activo ? (
              <Link
                href="/admin/configuracion/correo"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Conectar en Configuración
              </Link>
            ) : null}
          </span>
        }
      />
      <Bandeja
        canal="correo"
        conversaciones={conversaciones}
        caso={caso}
        busqueda={busqueda}
        whatsappConectado={ajustes.whatsapp?.estado === "conectado"}
        correoActivo={activo}
      />
    </>
  );
}
