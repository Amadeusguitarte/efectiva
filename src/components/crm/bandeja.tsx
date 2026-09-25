import { ChevronLeft, ExternalLink, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CanalCrm } from "@/lib/crm/catalogos";
import { resumirTexto } from "@/lib/crm/plantillas";
import type { CasoDetalle, ConversacionResumen } from "@/lib/datos/crm";
import { formatearFecha } from "@/lib/formato";
import { cn } from "cn";

import { HiloMensajes } from "./hilo-mensajes";
import { InsigniaEtapa, PuntoEtapa } from "./insignias";

type BandejaProps = {
  canal: CanalCrm;
  conversaciones: ConversacionResumen[];
  caso: CasoDetalle | null;
  busqueda: string;
  whatsappConectado: boolean;
  correoActivo: boolean;
};

/** Bandeja de un canal: lista de conversaciones a la izquierda y el hilo seleccionado a la derecha. */
export function Bandeja({
  canal,
  conversaciones,
  caso,
  busqueda,
  whatsappConectado,
  correoActivo,
}: BandejaProps) {
  const base = `/admin/crm/${canal}`;
  const enlace = (casoId: string) => {
    const query = new URLSearchParams({ caso: casoId });
    if (busqueda) query.set("q", busqueda);
    return `${base}?${query.toString()}` as Route;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <Card className={cn("gap-0 overflow-hidden py-0", caso && "hidden lg:block")}>
        <form action={base} className="border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={busqueda}
              placeholder="Buscar conversación"
              aria-label="Buscar conversación"
              className="pl-9"
            />
          </div>
        </form>
        {conversaciones.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {busqueda
              ? "No hay conversaciones con esa búsqueda."
              : canal === "whatsapp"
                ? "Cuando alguien escriba al WhatsApp conectado aparecerá aquí."
                : "Cuando llegue un correo a la cuenta conectada aparecerá aquí."}
          </p>
        ) : (
          <ul className="max-h-[70vh] divide-y overflow-y-auto">
            {conversaciones.map((conversacion) => {
              const activa = caso?.id === conversacion.casoId;
              return (
                <li key={conversacion.casoId}>
                  <Link
                    href={enlace(conversacion.casoId)}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "grid gap-1 px-4 py-3 transition-colors hover:bg-accent",
                      activa && "bg-primary/5",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        {conversacion.sinResponder ? (
                          <span
                            className="size-2 shrink-0 rounded-full bg-destructive"
                            aria-label="Sin responder"
                          />
                        ) : (
                          <PuntoEtapa color={conversacion.etapa.color} />
                        )}
                        <span
                          className={cn(
                            "truncate text-sm",
                            conversacion.sinResponder ? "font-semibold" : "font-medium",
                          )}
                        >
                          {conversacion.nombre}
                        </span>
                      </span>
                      {conversacion.ultimoMensaje ? (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatearFecha(conversacion.ultimoMensaje.createdAt)}
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {conversacion.ultimoMensaje
                        ? `${conversacion.ultimoMensaje.direccion === "salida" ? "Tú: " : ""}${resumirTexto(conversacion.ultimoMensaje.contenido, 70)}`
                        : conversacion.contacto}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{conversacion.etapa.nombre}</span>
                      {conversacion.responsable ? <span>· {conversacion.responsable}</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="min-w-0">
        <CardContent>
          {caso ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Volver a la lista"
                  >
                    <Link href={base as Route}>
                      <ChevronLeft />
                    </Link>
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{caso.nombre}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <InsigniaEtapa nombre={caso.etapa.nombre} color={caso.etapa.color} />
                      {caso.responsable ? (
                        <span>{caso.responsable.nombre}</span>
                      ) : (
                        <span>Sin responsable</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/crm/casos/${caso.id}` as Route}>
                    <ExternalLink />
                    Abrir caso
                  </Link>
                </Button>
              </div>
              <HiloMensajes
                casoId={caso.id}
                mensajes={caso.mensajes}
                telefono={caso.telefono}
                email={caso.email}
                canalInicial={canal}
                permitirCambiarCanal={false}
                whatsappConectado={whatsappConectado}
                correoActivo={correoActivo}
              />
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Selecciona una conversación para leerla y responder.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
