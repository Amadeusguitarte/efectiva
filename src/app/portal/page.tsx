import { CircleAlert, Download, FileCheck2, Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata, Route } from "next";

import { ConsentimientoDatos } from "@/components/portal/consentimiento-datos";
import { ProgresoPropuesta } from "@/components/portal/progreso-propuesta";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { HistorialPropuesta } from "@/components/propuestas/historial-propuesta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig, whatsappUrl } from "@/config/site";
import { obtenerMiProceso } from "@/lib/datos/portal";
import { formatearFecha, formatearFechaHora, primerNombre } from "@/lib/formato";
import { INFO_ESTADO, indiceEtapaActual } from "@/lib/propuestas/estados";

export const metadata: Metadata = {
  title: "Mi proceso",
};

function TarjetaContacto() {
  const { contact } = siteConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Tienes dudas?</CardTitle>
        <CardDescription>Nuestro equipo te acompaña en cada etapa.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button asChild className="justify-start">
          <a
            href={whatsappUrl("Hola, quiero consultar el estado de mi proceso.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Escribir por WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <a href={`tel:${contact.phoneE164}`}>
            <Phone />
            {contact.phoneDisplay}
          </a>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <a href={`mailto:${contact.email}`} className="min-w-0">
            <Mail />
            <span className="truncate">{contact.email}</span>
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function PortalPage() {
  const { usuario, consentimientoVigente, cliente, propuesta, eventos } = await obtenerMiProceso();

  if (!consentimientoVigente) {
    return <ConsentimientoDatos />;
  }

  const saludo = `Hola, ${primerNombre(cliente?.nombre ?? usuario.nombre)}`;

  if (!cliente || !propuesta) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{saludo}</h1>
        <Alert>
          <CircleAlert />
          <AlertTitle>Estamos preparando tu expediente</AlertTitle>
          <AlertDescription>
            Aún no encontramos un proceso asociado a {usuario.email}. Si ya hablaste con nuestro
            equipo, escríbenos para vincular tu cuenta.
          </AlertDescription>
        </Alert>
        <TarjetaContacto />
      </div>
    );
  }

  const info = INFO_ESTADO[propuesta.estado];
  const enPausa = propuesta.estado === "requiere_informacion" || propuesta.estado === "cancelada";
  const etapa = indiceEtapaActual(
    propuesta.estado,
    eventos.map((evento) => evento.estado_nuevo),
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{saludo}</h1>
        <p className="text-muted-foreground">Aquí puedes seguir el avance de tu propuesta legal.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Estado de tu propuesta</CardTitle>
            <CardDescription>
              Actualizado el {formatearFechaHora(propuesta.actualizadaAt)}
            </CardDescription>
          </div>
          <EstadoBadge estado={propuesta.estado} className="self-start text-sm" />
        </CardHeader>
        <CardContent className="grid gap-6">
          <ProgresoPropuesta etapaActual={etapa} enPausa={enPausa} />

          {propuesta.estado === "requiere_informacion" ? (
            <Alert className="border-warning/30 bg-warning-soft">
              <CircleAlert className="text-warning" />
              <AlertTitle className="text-warning">Necesitamos información adicional</AlertTitle>
              <AlertDescription>
                {propuesta.mensaje ?? info.descripcionCliente} Escríbenos para enviarla y continuar
                con tu proceso.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-lg border bg-surface-soft p-4">
              <p className="text-sm font-medium text-foreground">{info.descripcionCliente}</p>
              {propuesta.mensaje ? (
                <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                  <span className="font-medium text-foreground">Mensaje del equipo: </span>
                  {propuesta.mensaje}
                </p>
              ) : null}
            </div>
          )}

          {propuesta.documentoDisponible ? (
            <div className="flex flex-col gap-4 rounded-lg border border-success/30 bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileCheck2 className="size-8 shrink-0 text-success" />
                <div>
                  <p className="font-medium text-foreground">Tu propuesta final está lista</p>
                  {propuesta.finalizadaAt ? (
                    <p className="text-sm text-muted-foreground">
                      Entregada el {formatearFecha(propuesta.finalizadaAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button asChild>
                <a href={`/documentos/propuestas/${propuesta.id}` as Route}>
                  <Download />
                  Descargar PDF
                </a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <Card className="min-w-0 md:col-span-3">
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Cada avance de tu proceso queda registrado aquí.</CardDescription>
          </CardHeader>
          <CardContent>
            <HistorialPropuesta eventos={eventos} />
          </CardContent>
        </Card>

        <div className="grid min-w-0 grid-cols-1 content-start gap-6 md:col-span-2">
          <TarjetaContacto />
          <Card>
            <CardHeader>
              <CardTitle>Tus datos</CardTitle>
              <CardDescription>Si algo no es correcto, avísanos.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                {[
                  ["Nombre", cliente.nombre],
                  ["Correo", cliente.email],
                  ["Documento", cliente.documento],
                  ["Teléfono", cliente.telefono],
                  ["Ciudad", cliente.ciudad],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="grid grid-cols-[6rem_1fr] gap-2">
                    <dt className="text-muted-foreground">{etiqueta}</dt>
                    <dd className="min-w-0 truncate text-foreground">{valor || "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
