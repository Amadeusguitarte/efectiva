import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { actualizarCliente } from "@/app/admin/clientes/acciones";
import { FormularioCliente } from "@/components/admin/formulario-cliente";
import { FormularioEstadoPropuesta } from "@/components/admin/formulario-estado-propuesta";
import { NotasInternas } from "@/components/admin/notas-internas";
import { SubirDocumento } from "@/components/admin/subir-documento";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { HistorialPropuesta } from "@/components/propuestas/historial-propuesta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { whatsappUrl } from "@/config/site";
import { obtenerCliente } from "@/lib/datos/admin";
import { formatearFecha, formatearFechaHora, numeroWhatsApp, primerNombre } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Cliente",
};

export default async function ClientePage({ params }: PageProps<"/admin/clientes/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const propuesta = cliente.propuestas;
  const accionActualizar = actualizarCliente.bind(null, cliente.id);

  return (
    <>
      <Link
        href="/admin/clientes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Clientes
      </Link>

      <EncabezadoPagina
        titulo={cliente.nombre_completo}
        descripcion={
          <span className="flex flex-wrap items-center gap-2">
            {propuesta ? <EstadoBadge estado={propuesta.estado} /> : null}
            {cliente.cuenta ? (
              <Badge variant="secondary">Cuenta activa</Badge>
            ) : (
              <Badge variant="outline">Aún no ha ingresado</Badge>
            )}
            <span>Cliente desde {formatearFecha(cliente.created_at)}</span>
          </span>
        }
        acciones={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${cliente.email}`}>
                <Mail />
                Correo
              </a>
            </Button>
            {cliente.telefono ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${cliente.telefono.replace(/\s/g, "")}`}>
                    <Phone />
                    Llamar
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={whatsappUrl(
                      `Hola ${primerNombre(cliente.nombre_completo)}, te escribimos de Insolvencia Efectiva.`,
                      numeroWhatsApp(cliente.telefono),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle />
                    WhatsApp
                  </a>
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="grid min-w-0 grid-cols-1 content-start gap-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Propuesta</CardTitle>
              <CardDescription>
                El estado y el mensaje se muestran al cliente en su portal.
                {propuesta?.finalizada_at
                  ? ` Finalizada el ${formatearFechaHora(propuesta.finalizada_at)}.`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {propuesta ? (
                <>
                  <SubirDocumento
                    propuestaId={propuesta.id}
                    tieneDocumento={Boolean(propuesta.documento_path)}
                  />
                  <FormularioEstadoPropuesta
                    key={`${propuesta.estado}-${propuesta.updated_at}`}
                    propuestaId={propuesta.id}
                    estadoActual={propuesta.estado}
                    mensajeActual={propuesta.mensaje_cliente}
                    tieneDocumento={Boolean(propuesta.documento_path)}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Este cliente no tiene propuesta.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos del cliente</CardTitle>
              <CardDescription>
                {cliente.cuenta
                  ? `Ingresa con ${cliente.cuenta.email} desde el ${formatearFecha(cliente.cuenta.created_at)}.`
                  : "Cuando ingrese con Google usando este correo, su cuenta se vinculará automáticamente."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioCliente
                key={cliente.updated_at}
                accion={accionActualizar}
                valores={cliente}
                textoBoton="Guardar cambios"
                cuentaVinculada={Boolean(cliente.cuenta)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
              <CardDescription>Lo que el cliente ve como avance de su proceso.</CardDescription>
            </CardHeader>
            <CardContent>
              <HistorialPropuesta eventos={cliente.eventos} mostrarAutor />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas internas</CardTitle>
              <CardDescription>Solo visibles para el equipo.</CardDescription>
            </CardHeader>
            <CardContent>
              <NotasInternas clienteId={cliente.id} notas={cliente.notas} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
