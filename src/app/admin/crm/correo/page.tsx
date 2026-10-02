import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { BandejaEntrada } from "@/components/crm/kommo/bandeja-entrada";
import { leerCarpetaCorreo, leerFiltroBandeja } from "@/lib/crm/bandeja";
import {
  listarConversaciones,
  obtenerAjustes,
  obtenerCaso,
  obtenerEquipo,
  obtenerEtapas,
} from "@/lib/datos/crm";

export const metadata: Metadata = {
  title: "Inbox de correo",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function InboxCorreoPage({ searchParams }: PageProps<"/admin/crm/correo">) {
  const parametros = await searchParams;
  const estado = {
    canal: "correo" as const,
    busqueda: texto(parametros.q)?.slice(0, 80) ?? "",
    filtro: leerFiltroBandeja(texto(parametros.filtro)),
    carpeta: leerCarpetaCorreo(texto(parametros.carpeta)),
  };
  const casoId = texto(parametros.caso);
  const casoValido = casoId !== undefined && z.uuid().safeParse(casoId).success;

  const [conversaciones, ajustes, caso, etapas, equipo] = await Promise.all([
    listarConversaciones("correo", {
      busqueda: estado.busqueda,
      filtro: estado.filtro,
      carpeta: estado.carpeta,
    }),
    obtenerAjustes(),
    casoValido ? obtenerCaso(casoId) : Promise.resolve(null),
    casoValido ? obtenerEtapas() : Promise.resolve([]),
    casoValido ? obtenerEquipo() : Promise.resolve([]),
  ]);
  const activo = ajustes.correo.activo && ajustes.correo.tieneContrasena;

  return (
    <BandejaEntrada
      estado={estado}
      conversaciones={conversaciones}
      caso={caso}
      etapas={etapas}
      equipo={equipo}
      ajustes={{
        whatsappConectado: ajustes.whatsapp?.estado === "conectado",
        correoActivo: activo,
        iaActiva: ajustes.ia.activo && ajustes.ia.tieneClave,
      }}
      ahora={new Date().toISOString()}
      aviso={
        activo && !ajustes.correo.ultimoError ? null : (
          <p className="shrink-0 border-b border-crm-borde bg-crm-nota px-4 py-1.5 text-xs text-crm-texto">
            {activo
              ? `Último error del correo: ${ajustes.correo.ultimoError}. `
              : "El correo no está configurado: los correos que escribas quedarán en cola. "}
            <Link
              href="/admin/configuracion/correo"
              className="font-bold text-crm-seleccion underline-offset-2 hover:underline"
            >
              {activo ? "Revisar en Configuración" : "Conectar en Configuración"}
            </Link>
          </p>
        )
      }
    />
  );
}
