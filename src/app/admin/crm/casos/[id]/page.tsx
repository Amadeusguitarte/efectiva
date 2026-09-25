import { ChevronLeft, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { actualizarDatosCaso } from "@/app/admin/crm/acciones";
import { AnalisisCaso } from "@/components/crm/analisis-caso";
import { DatosCaso } from "@/components/crm/datos-caso";
import { ExpedienteCaso } from "@/components/crm/expediente-caso";
import { GestionCaso } from "@/components/crm/gestion-caso";
import { HiloMensajes } from "@/components/crm/hilo-mensajes";
import { HistorialCaso } from "@/components/crm/historial-caso";
import {
  InsigniaCanal,
  InsigniaEtapa,
  InsigniaPrioridad,
  InsigniaSinResponder,
} from "@/components/crm/insignias";
import { TareasCaso } from "@/components/crm/tareas-caso";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearTelefono } from "@/lib/crm/telefono";
import { obtenerAjustes, obtenerCaso, obtenerEquipo, obtenerEtapas } from "@/lib/datos/crm";
import { formatearFecha } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Caso",
};

function hoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export default async function CasoPage({ params }: PageProps<"/admin/crm/casos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [caso, etapas, equipo, ajustes] = await Promise.all([
    obtenerCaso(id),
    obtenerEtapas(),
    obtenerEquipo(),
    obtenerAjustes(),
  ]);
  if (!caso) notFound();

  const iaActiva = ajustes.ia.activo && ajustes.ia.tieneClave;
  const whatsappConectado = ajustes.whatsapp?.estado === "conectado";
  const canalInicial = caso.origen ?? (caso.telefono ? "whatsapp" : "correo");

  return (
    <>
      <Link
        href="/admin/crm"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Pipeline
      </Link>

      <EncabezadoPagina
        titulo={caso.nombre}
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            <InsigniaEtapa nombre={caso.etapa.nombre} color={caso.etapa.color} />
            {caso.origen ? <InsigniaCanal canal={caso.origen} /> : null}
            {caso.analisis ? <InsigniaPrioridad prioridad={caso.analisis.prioridad} /> : null}
            {caso.sinResponder ? <InsigniaSinResponder /> : null}
            {caso.telefono ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" aria-hidden />
                {formatearTelefono(caso.telefono)}
              </span>
            ) : null}
            {caso.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" aria-hidden />
                {caso.email}
              </span>
            ) : null}
            <span>Desde {formatearFecha(caso.createdAt)}</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="grid min-w-0 grid-cols-1 content-start gap-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Conversación</CardTitle>
              <CardDescription>
                Todos los mensajes se responden desde aquí, a mano. Se actualiza sola.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HiloMensajes
                casoId={caso.id}
                mensajes={caso.mensajes}
                telefono={caso.telefono}
                email={caso.email}
                canalInicial={canalInicial}
                whatsappConectado={whatsappConectado}
                correoActivo={ajustes.correo.activo}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análisis con IA</CardTitle>
              <CardDescription>
                Resume la conversación, sugiere la etapa y la próxima acción. No responde mensajes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnalisisCaso
                casoId={caso.id}
                analisis={caso.analisis}
                etapaActualId={caso.etapa.id}
                iaActiva={iaActiva}
                hayMensajes={caso.mensajes.length > 0}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tareas</CardTitle>
              <CardDescription>
                Documentos solicitados, recontactos y seguimientos. Las etapas también las crean.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TareasCaso
                casoId={caso.id}
                tareas={caso.tareas}
                equipo={equipo}
                responsableCasoId={caso.responsable?.id ?? null}
                hoy={hoyBogota()}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Gestión</CardTitle>
              <CardDescription>Etapa, responsable y próxima acción.</CardDescription>
            </CardHeader>
            <CardContent>
              <GestionCaso
                caso={{
                  id: caso.id,
                  etapaId: caso.etapa.id,
                  responsableId: caso.responsable?.id ?? null,
                  proximaAccion: caso.proximaAccion,
                  proximaAccionFecha: caso.proximaAccionFecha,
                }}
                etapas={etapas}
                equipo={equipo}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expediente</CardTitle>
              <CardDescription>
                Conexión con el cliente y su propuesta en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpedienteCaso caso={{ id: caso.id, email: caso.email, cliente: caso.cliente }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial y notas</CardTitle>
              <CardDescription>Todo lo que pasa con el caso, en orden.</CardDescription>
            </CardHeader>
            <CardContent>
              <HistorialCaso casoId={caso.id} eventos={caso.eventos} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <DatosCaso
                casoId={caso.id}
                accion={actualizarDatosCaso.bind(null, caso.id)}
                valores={{ nombre: caso.nombre, telefono: caso.telefono, email: caso.email }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
