"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import type { Route } from "next";
import Form from "next/form";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CARPETAS_CORREO,
  FILTROS_BANDEJA,
  INFO_CARPETA_CORREO,
  etiquetaFiltroBandeja,
  urlBandeja,
  type EstadoBandeja,
} from "@/lib/crm/bandeja";
import type { CanalCrm } from "@/lib/crm/catalogos";
import { horaLista } from "@/lib/crm/linea-tiempo";
import type { ConversacionResumen } from "@/lib/datos/crm";
import { cn } from "cn";

import { AvatarContacto } from "./avatar-contacto";

type ListaConversacionesProps = {
  estado: EstadoBandeja;
  conversaciones: ConversacionResumen[];
  casoActivoId: string | null;
  ahora: string;
  className?: string;
};

/**
 * Columna izquierda del inbox, como la de Kommo: «Buscar», el chip verde del filtro con el total
 * y la lista de conversaciones (avatar con el canal, nombre con su código, etapa, último mensaje
 * y hora). La abierta va resaltada en azul.
 */
export function ListaConversaciones({
  estado,
  conversaciones,
  casoActivoId,
  ahora,
  className,
}: ListaConversacionesProps) {
  const { canal, busqueda, filtro, carpeta } = estado;

  return (
    <nav
      aria-label={canal === "whatsapp" ? "Conversaciones de chat" : "Conversaciones de correo"}
      className={cn("flex min-h-0 flex-col border-r border-crm-borde bg-background", className)}
    >
      <Form
        action={`/admin/crm/${canal}`}
        className="flex h-14 shrink-0 items-center gap-2 border-b border-crm-borde px-4"
        role="search"
      >
        <Search className="size-4 shrink-0 text-crm-hora" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar"
          aria-label="Buscar por nombre, teléfono o correo"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-crm-texto outline-none placeholder:text-crm-hora [&::-webkit-search-cancel-button]:hidden"
        />
        {filtro !== "todos" ? <input type="hidden" name="filtro" value={filtro} /> : null}
        {carpeta && carpeta !== "recibidos" ? (
          <input type="hidden" name="carpeta" value={carpeta} />
        ) : null}
        {casoActivoId ? <input type="hidden" name="caso" value={casoActivoId} /> : null}
        {busqueda ? (
          <Link
            href={urlBandeja(estado, { busqueda: "", caso: casoActivoId })}
            className="rounded-sm p-1 text-crm-hora hover:bg-crm-feed hover:text-crm-texto"
            aria-label="Quitar la búsqueda"
          >
            <X className="size-4" />
          </Link>
        ) : null}
      </Form>

      {carpeta ? (
        <div
          role="group"
          aria-label="Carpetas"
          className="flex shrink-0 gap-5 border-b border-crm-borde px-4"
        >
          {CARPETAS_CORREO.map((opcion) => (
            <Link
              key={opcion}
              aria-current={carpeta === opcion ? "page" : undefined}
              href={urlBandeja(estado, { carpeta: opcion, caso: casoActivoId })}
              className={cn(
                "-mb-px border-b-2 py-2 text-sm font-bold transition-colors",
                carpeta === opcion
                  ? "border-crm-seleccion text-crm-texto"
                  : "border-transparent text-crm-hora hover:text-crm-texto",
              )}
            >
              {INFO_CARPETA_CORREO[opcion]}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-crm-borde px-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-sm bg-crm-filtro px-2 py-0.5 text-xs text-crm-texto outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-crm-seleccion/40">
            {etiquetaFiltroBandeja(canal, filtro)}
            <ChevronDown className="size-3" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 font-crm text-crm-texto">
            {FILTROS_BANDEJA.map((opcion) => (
              <DropdownMenuItem key={opcion} asChild className="text-[15px]">
                <Link href={urlBandeja(estado, { filtro: opcion, caso: casoActivoId })}>
                  <span className="flex-1">{etiquetaFiltroBandeja(canal, opcion)}</span>
                  {opcion === filtro ? <Check className="text-crm-seleccion" /> : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xs text-crm-hora">Total: {conversaciones.length}</span>
      </div>

      {conversaciones.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-crm-hora">
          {busqueda || filtro !== "todos"
            ? "No hay conversaciones con esa búsqueda o filtro."
            : canal === "whatsapp"
              ? "Cuando alguien escriba al WhatsApp conectado, la conversación aparecerá aquí."
              : carpeta === "enviados"
                ? "Aquí aparecen las conversaciones cuyo último correo envió el equipo."
                : "Cuando llegue un correo a la cuenta conectada, aparecerá aquí."}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {conversaciones.map((conversacion) => (
            <FilaConversacion
              key={conversacion.casoId}
              conversacion={conversacion}
              canal={canal}
              activa={conversacion.casoId === casoActivoId}
              href={urlBandeja(estado, { caso: conversacion.casoId })}
              ahora={ahora}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}

function FilaConversacion({
  conversacion,
  canal,
  activa,
  href,
  ahora,
}: {
  conversacion: ConversacionResumen;
  canal: CanalCrm;
  activa: boolean;
  href: Route;
  ahora: string;
}) {
  const ultimo = conversacion.ultimoMensaje;
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={activa ? "page" : undefined}
        className={cn(
          "flex gap-3 border-b border-crm-borde px-4 py-3 transition-colors",
          activa ? "bg-crm-seleccion text-white" : "text-crm-texto hover:bg-crm-seleccion-suave",
        )}
      >
        <AvatarContacto
          nombre={conversacion.nombre}
          canal={canal}
          semilla={conversacion.casoId}
          className="mt-0.5 self-start"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate text-[15px] font-bold">{conversacion.nombre}</span>
              <span className="shrink-0 rounded-sm bg-crm-etiqueta px-1 text-[10px] leading-4 font-bold text-white">
                {conversacion.codigo}
              </span>
            </span>
            {ultimo ? (
              <span className={cn("shrink-0 text-xs", activa ? "text-white/90" : "text-crm-hora")}>
                {horaLista(ultimo.fecha, ahora)}
              </span>
            ) : null}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 truncate text-sm",
              activa ? "text-white/90" : "text-crm-texto-suave",
            )}
          >
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", activa && "ring-1 ring-white")}
              style={{ backgroundColor: conversacion.etapa.color }}
            />
            <span className="truncate">{conversacion.etapa.nombre}</span>
          </span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                activa ? "text-white/90" : "text-crm-hora",
                conversacion.sinResponder && !activa && "text-crm-texto",
              )}
            >
              {ultimo ? (
                <>
                  {ultimo.prefijo ? `${ultimo.prefijo}: ` : ""}
                  {canal === "correo" && ultimo.asunto ? `${ultimo.asunto} · ` : ""}
                  {ultimo.contenido}
                </>
              ) : (
                conversacion.contacto
              )}
            </span>
            {conversacion.sinResponder ? (
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  activa ? "bg-white" : "bg-crm-contador",
                )}
                aria-label="Sin responder"
                role="img"
              />
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}
