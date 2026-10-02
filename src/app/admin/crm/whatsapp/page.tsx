import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { BandejaEntrada } from "@/components/crm/kommo/bandeja-entrada";
import { leerFiltroBandeja } from "@/lib/crm/bandeja";
import { INFO_ESTADO_WHATSAPP } from "@/lib/crm/catalogos";
import {
  listarConversaciones,
  obtenerAjustes,
  obtenerCaso,
  obtenerEquipo,
  obtenerEtapas,
} from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "Inbox de chat",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function InboxChatPage({ searchParams }: PageProps<"/admin/crm/whatsapp">) {
  const parametros = await searchParams;
  const estado = {
    canal: "whatsapp" as const,
    busqueda: texto(parametros.q)?.slice(0, 80) ?? "",
    filtro: leerFiltroBandeja(texto(parametros.filtro)),
    carpeta: null,
  };
  const casoId = texto(parametros.caso);
  const casoValido = casoId !== undefined && z.uuid().safeParse(casoId).success;

  const [conversaciones, ajustes, caso, etapas, equipo] = await Promise.all([
    listarConversaciones("whatsapp", { busqueda: estado.busqueda, filtro: estado.filtro }),
    obtenerAjustes(),
    casoValido ? obtenerCaso(casoId) : Promise.resolve(null),
    casoValido ? obtenerEtapas() : Promise.resolve([]),
    casoValido ? obtenerEquipo() : Promise.resolve([]),
  ]);
  const estadoWhatsApp = ajustes.whatsapp?.estado ?? "desconectado";
  const conectado = estadoWhatsApp === "conectado";

  return (
    <BandejaEntrada
      estado={estado}
      conversaciones={conversaciones}
      caso={caso}
      etapas={etapas}
      equipo={equipo}
      ajustes={{
        whatsappConectado: conectado,
        correoActivo: ajustes.correo.activo && ajustes.correo.tieneContrasena,
        iaActiva: ajustes.ia.activo && ajustes.ia.tieneClave,
      }}
      ahora={new Date().toISOString()}
      aviso={
        conectado ? null : (
          <p className="shrink-0 border-b border-crm-borde bg-crm-nota px-4 py-1.5 text-xs text-crm-texto">
            WhatsApp: {INFO_ESTADO_WHATSAPP[estadoWhatsApp].etiqueta.toLowerCase()}. Los mensajes
            que escribas quedarán en cola hasta que se conecte.{" "}
            <Link
              href="/admin/configuracion/whatsapp"
              className="font-bold text-crm-seleccion underline-offset-2 hover:underline"
            >
              Conectar en Configuración
            </Link>
          </p>
        )
      }
    />
  );
}
