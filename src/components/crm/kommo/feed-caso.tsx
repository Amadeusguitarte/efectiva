"use client";

import { AlertCircle, Check, Clock, Mail, MessageCircle, StickyNote } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { INFO_CANAL } from "@/lib/crm/catalogos";
import { construirFeed, etiquetaDia, fechaHoraFeed } from "@/lib/crm/linea-tiempo";
import type { CasoDetalle, EventoCaso, MensajeCaso, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import { AvatarContacto } from "./avatar-contacto";
import { Compositor, type ModoCompositor } from "./compositor";

/** A esta distancia del final (en píxeles) se sigue bajando solo cuando llega algo nuevo. */
const CERCA_DEL_FINAL = 160;

type FeedCasoProps = {
  caso: Pick<
    CasoDetalle,
    "id" | "codigo" | "nombre" | "telefono" | "email" | "mensajes" | "eventos" | "responsable"
  >;
  equipo: MiembroEquipo[];
  canalInicial: "whatsapp" | "correo";
  whatsappConectado: boolean;
  correoActivo: boolean;
  ahora: string;
  modo: ModoCompositor;
  foco: number;
  alPedirModo: (modo: ModoCompositor) => void;
  /** Barra superior (en móvil: volver, contacto y botón de la ficha). */
  encabezado?: ReactNode;
  className?: string;
};

/**
 * Feed del caso al estilo de Kommo: mensajes de WhatsApp y correo, notas y eventos del sistema en
 * una sola línea de tiempo con separadores de día, y el compositor abajo. Baja al último elemento
 * al abrir y cuando llega algo nuevo (si ya se estaba al final).
 */
export function FeedCaso({
  caso,
  equipo,
  canalInicial,
  whatsappConectado,
  correoActivo,
  ahora,
  modo,
  foco,
  alPedirModo,
  encabezado,
  className,
}: FeedCasoProps) {
  const elementos = construirFeed(caso.mensajes, caso.eventos);
  const lista = useRef<HTMLDivElement>(null);
  const alFinal = useRef(true);

  useEffect(() => {
    const contenedor = lista.current;
    if (contenedor && alFinal.current) contenedor.scrollTop = contenedor.scrollHeight;
  }, [elementos.length]);

  return (
    <section
      aria-label={`Conversación con ${caso.nombre}`}
      className={cn("flex min-h-0 min-w-0 flex-col bg-crm-feed", className)}
    >
      {encabezado}
      <div
        ref={lista}
        onScroll={(evento) => {
          const { scrollTop, scrollHeight, clientHeight } = evento.currentTarget;
          alFinal.current = scrollHeight - scrollTop - clientHeight < CERCA_DEL_FINAL;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6"
      >
        {elementos.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-crm-hora">
            Todavía no hay mensajes ni actividad en este caso.
          </p>
        ) : (
          <ol className="mx-auto grid max-w-4xl gap-2.5" aria-live="polite">
            {elementos.map((elemento) => {
              if (elemento.tipo === "dia") {
                return (
                  <SeparadorDia key={elemento.clave} texto={etiquetaDia(elemento.fecha, ahora)} />
                );
              }
              if (elemento.tipo === "mensaje") {
                return (
                  <BurbujaMensaje
                    key={elemento.clave}
                    mensaje={elemento.mensaje}
                    casoId={caso.id}
                    nombre={caso.nombre}
                    ahora={ahora}
                  />
                );
              }
              return elemento.evento.tipo === "nota" ? (
                <NotaFeed key={elemento.clave} evento={elemento.evento} ahora={ahora} />
              ) : (
                <EventoFeed key={elemento.clave} evento={elemento.evento} ahora={ahora} />
              );
            })}
            {caso.mensajes.length > 0 ? (
              <li className="pt-1 text-right text-xs text-crm-etiqueta-texto">
                Conversación Nº {caso.codigo}
              </li>
            ) : null}
          </ol>
        )}
      </div>
      <Compositor
        caso={{
          id: caso.id,
          codigo: caso.codigo,
          nombre: caso.nombre,
          telefono: caso.telefono,
          email: caso.email,
          responsableId: caso.responsable?.id ?? null,
        }}
        mensajes={caso.mensajes}
        equipo={equipo}
        canalInicial={canalInicial}
        whatsappConectado={whatsappConectado}
        correoActivo={correoActivo}
        ahora={ahora}
        modo={modo}
        foco={foco}
        alPedirModo={alPedirModo}
      />
    </section>
  );
}

function SeparadorDia({ texto }: { texto: string }) {
  return (
    <li className="relative my-2 flex justify-center" role="separator" aria-label={texto}>
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-crm-borde" />
      <span className="relative rounded-full border border-crm-borde-fuerte bg-crm-feed px-3 text-xs leading-5 text-crm-hora">
        {texto}
      </span>
    </li>
  );
}

function IconoCanal({ canal, className }: { canal: MensajeCaso["canal"]; className?: string }) {
  const Icono = canal === "whatsapp" ? MessageCircle : Mail;
  return <Icono className={cn("size-3", className)} aria-label={INFO_CANAL[canal].etiqueta} />;
}

function BurbujaMensaje({
  mensaje,
  casoId,
  nombre,
  ahora,
}: {
  mensaje: MensajeCaso;
  casoId: string;
  nombre: string;
  ahora: string;
}) {
  const hora = fechaHoraFeed(mensaje.fecha, ahora);
  const cuerpo = (
    <>
      {mensaje.asunto ? <p className="font-bold">{mensaje.asunto}</p> : null}
      <p className="break-words whitespace-pre-line">{mensaje.contenido}</p>
    </>
  );

  if (mensaje.direccion === "entrada") {
    return (
      <li className="flex items-end gap-2.5 pr-8 md:pr-16">
        <AvatarContacto nombre={nombre} canal={mensaje.canal} semilla={casoId} />
        <div className="max-w-[min(40rem,100%)] min-w-0 rounded-lg border border-crm-borde bg-background px-3.5 py-2 text-[15px] leading-snug text-crm-texto">
          <p className="mb-0.5 flex flex-wrap items-center gap-x-1.5 text-xs whitespace-nowrap text-crm-hora">
            <span>{hora}</span>
            <span>{nombre}</span>
            <IconoCanal
              canal={mensaje.canal}
              className={mensaje.canal === "whatsapp" ? "text-crm-whatsapp" : "text-crm-seleccion"}
            />
          </p>
          {cuerpo}
        </div>
      </li>
    );
  }

  return (
    <li className="flex justify-end pl-8 md:pl-16">
      <div
        className={cn(
          "max-w-[min(40rem,100%)] min-w-0 rounded-lg bg-crm-burbuja-salida px-3.5 py-2 text-[15px] leading-snug text-white",
          mensaje.estadoEnvio === "fallido" && "ring-2 ring-crm-contador",
        )}
      >
        <p className="mb-0.5 flex flex-wrap items-center gap-x-1.5 text-xs whitespace-nowrap text-white/80">
          <span>{hora}</span>
          <span>{mensaje.autor ?? "Equipo"}</span>
          <IconoCanal canal={mensaje.canal} />
          {mensaje.estadoEnvio === "enviado" ? (
            <span className="inline-flex items-center gap-0.5">
              <Check className="size-3" aria-hidden />
              Entregado
            </span>
          ) : mensaje.estadoEnvio === "pendiente" ? (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="size-3" aria-hidden />
              En cola
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 font-bold text-white"
              title={mensaje.error ?? undefined}
            >
              <AlertCircle className="size-3" aria-hidden />
              No enviado
            </span>
          )}
        </p>
        {cuerpo}
      </div>
    </li>
  );
}

function NotaFeed({ evento, ahora }: { evento: EventoCaso; ahora: string }) {
  return (
    <li className="md:px-10">
      <div className="rounded-md border border-crm-borde bg-crm-nota px-4 py-2.5 text-[15px] leading-snug text-crm-texto">
        <p className="mb-0.5 flex flex-wrap items-center gap-x-1.5 text-xs whitespace-nowrap text-crm-hora">
          <StickyNote className="size-3" aria-hidden />
          <span>{fechaHoraFeed(evento.fecha, ahora)}</span>
          <span>{evento.autor ?? "Equipo"}</span>
          <span>· Nota interna</span>
        </p>
        <p className="break-words whitespace-pre-line">{evento.descripcion}</p>
      </div>
    </li>
  );
}

function EventoFeed({ evento, ahora }: { evento: EventoCaso; ahora: string }) {
  return (
    <li className="flex justify-center px-6 md:px-16">
      <p
        className="line-clamp-2 text-center text-xs leading-relaxed text-crm-hora"
        title={evento.descripcion}
      >
        {fechaHoraFeed(evento.fecha, ahora)} · {evento.autor ?? "Sistema"}:{" "}
        <span className="text-crm-texto-suave">{evento.descripcion}</span>
      </p>
    </li>
  );
}
