import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { Bandeja } from "@/components/crm/bandeja";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Badge } from "@/components/ui/badge";
import { INFO_ESTADO_WHATSAPP } from "@/lib/crm/catalogos";
import { listarConversaciones, obtenerAjustes, obtenerCaso } from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "WhatsApp",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function BandejaWhatsAppPage({
  searchParams,
}: PageProps<"/admin/crm/whatsapp">) {
  const parametros = await searchParams;
  const busqueda = texto(parametros.q) ?? "";
  const casoId = texto(parametros.caso);

  const [conversaciones, ajustes, caso] = await Promise.all([
    listarConversaciones("whatsapp", busqueda),
    obtenerAjustes(),
    casoId && z.uuid().safeParse(casoId).success ? obtenerCaso(casoId) : Promise.resolve(null),
  ]);
  const estado = ajustes.whatsapp?.estado ?? "desconectado";
  const conectado = estado === "conectado";

  return (
    <>
      <EncabezadoPagina
        titulo="WhatsApp"
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={conectado ? "secondary" : "outline"}>
              {INFO_ESTADO_WHATSAPP[estado].etiqueta}
            </Badge>
            {ajustes.whatsapp?.telefono ? <span>+{ajustes.whatsapp.telefono}</span> : null}
            {!conectado ? (
              <Link
                href="/admin/configuracion/whatsapp"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Conectar en Configuración
              </Link>
            ) : null}
          </span>
        }
      />
      <Bandeja
        canal="whatsapp"
        conversaciones={conversaciones}
        caso={caso}
        busqueda={busqueda}
        whatsappConectado={conectado}
        correoActivo={ajustes.correo.activo}
      />
    </>
  );
}
