"use client";

import { ChevronLeft, CircleAlert, Mail, MessageCircle, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState } from "react";

import { crearCaso } from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { ESTADO_INICIAL } from "@/lib/acciones";
import type { Etapa, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import { AvatarContacto } from "./kommo/avatar-contacto";

const CLASE_CONTROL =
  "h-8 w-full min-w-0 rounded-none border-0 border-b border-dashed border-crm-borde-fuerte bg-transparent px-1 text-sm text-crm-texto outline-none transition-colors placeholder:text-crm-hora hover:border-crm-texto-suave focus:border-solid focus:border-crm-seleccion aria-invalid:border-solid aria-invalid:border-crm-contador";

/** Fila de campo como las de la ficha de Kommo: etiqueta gris a la izquierda y valor a la derecha. */
function FilaCampo({
  etiqueta,
  errores,
  ayuda,
  children,
}: {
  etiqueta: string;
  errores?: string[];
  ayuda?: string;
  children: (control: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const id = useId();
  const tieneError = Boolean(errores?.length);
  const descripciones = [ayuda ? `${id}-ayuda` : null, tieneError ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-x-3 py-1">
      <label htmlFor={id} className="truncate pt-1.5 text-sm text-crm-hora">
        {etiqueta}
      </label>
      <div className="min-w-0">
        {children({
          id,
          "aria-invalid": tieneError,
          "aria-describedby": descripciones || undefined,
        })}
        {ayuda ? (
          <p id={`${id}-ayuda`} className="mt-1 text-xs text-crm-hora">
            {ayuda}
          </p>
        ) : null}
        {tieneError ? (
          <p id={`${id}-error`} className="mt-1 text-xs text-crm-contador">
            {errores?.[0]}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Alta de un caso al estilo de «Nuevo lead» de Kommo: panel oscuro con el nombre grande y la
 * etapa (con su barra de avance), los datos en blanco debajo y el historial vacío a la derecha.
 */
export function FormularioCaso({
  etapas,
  equipo,
  etapaInicial,
  responsableInicial,
}: {
  etapas: Etapa[];
  equipo: MiembroEquipo[];
  etapaInicial?: string;
  responsableInicial?: string;
}) {
  const [estado, accion] = useActionState(crearCaso, ESTADO_INICIAL);
  const v = estado.valores ?? {};
  const idNombre = useId();
  const idEtapa = useId();
  // Los campos no son controlados: React 19 reinicia el formulario al terminar la acción y cada
  // uno vuelve a su `defaultValue` (lo enviado). Este estado solo alimenta el avatar y la barra.
  const [nombre, setNombre] = useState(v.nombre ?? "");
  const [etapaId, setEtapaId] = useState(v.etapa_id ?? etapaInicial ?? etapas[0]?.id ?? "");

  const etapa = etapas.find((e) => e.id === etapaId);
  const posicion = etapas.findIndex((e) => e.id === etapaId);
  const errorNombre = estado.errores?.nombre?.[0];
  const mensajeGeneral = !estado.ok ? estado.mensaje : null;

  return (
    <form action={accion} noValidate className="flex min-h-0 flex-1">
      <section
        aria-label="Datos del caso"
        className="flex w-full min-w-0 flex-col border-r border-crm-borde bg-background lg:w-[22rem] lg:shrink-0 2xl:w-[24rem]"
      >
        <div className="shrink-0 bg-crm-panel px-5 pt-3 pb-4 text-white">
          <div className="flex items-center gap-2 text-sm text-crm-panel-suave">
            <Link
              href="/admin/crm"
              aria-label="Volver al pipeline"
              className="-ml-1.5 inline-flex size-7 items-center justify-center rounded-[3px] transition-colors hover:bg-crm-panel-hondo hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            Nuevo caso
          </div>

          <label htmlFor={idNombre} className="sr-only">
            Nombre del caso
          </label>
          <input
            id={idNombre}
            name="nombre"
            defaultValue={v.nombre ?? ""}
            onChange={(evento) => setNombre(evento.target.value)}
            maxLength={160}
            autoFocus
            autoComplete="off"
            placeholder="Nombre del contacto"
            aria-invalid={Boolean(errorNombre)}
            aria-describedby={errorNombre ? `${idNombre}-error` : undefined}
            className="mt-1 w-full border-b border-transparent bg-transparent py-1 text-2xl font-bold text-white outline-none placeholder:text-crm-panel-suave hover:border-crm-panel-suave/50 focus:border-crm-panel-suave aria-invalid:border-crm-contador"
          />
          {errorNombre ? (
            <p
              id={`${idNombre}-error`}
              className="mt-1.5 inline-flex rounded-[3px] bg-crm-contador px-1.5 py-0.5 text-xs text-white"
            >
              {errorNombre}
            </p>
          ) : null}

          <div className="mt-4">
            <label htmlFor={idEtapa} className="sr-only">
              Etapa
            </label>
            <select
              id={idEtapa}
              name="etapa_id"
              defaultValue={v.etapa_id ?? etapaInicial ?? etapas[0]?.id ?? ""}
              onChange={(evento) => setEtapaId(evento.target.value)}
              className="-ml-1 max-w-full cursor-pointer rounded-[3px] bg-transparent px-1 py-0.5 text-[15px] font-bold text-white outline-none hover:bg-crm-panel-hondo focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {etapas.map((opcion) => (
                <option key={opcion.id} value={opcion.id} className="bg-background text-crm-texto">
                  {opcion.nombre}
                </option>
              ))}
            </select>
            {/* Barra segmentada del pipeline, rellena hasta la etapa elegida (como en Kommo). */}
            <div aria-hidden className="mt-1.5 flex h-1 gap-0.5">
              {etapas.map((paso, indice) => (
                <span
                  key={paso.id}
                  className={cn(
                    "flex-1 first:rounded-l-full last:rounded-r-full",
                    indice > posicion && "bg-crm-panel-hondo",
                  )}
                  style={indice <= posicion && etapa ? { backgroundColor: etapa.color } : undefined}
                />
              ))}
            </div>
            {estado.errores?.etapa_id ? (
              <p className="mt-1.5 inline-flex rounded-[3px] bg-crm-contador px-1.5 py-0.5 text-xs text-white">
                {estado.errores.etapa_id[0]}
              </p>
            ) : null}
          </div>

          <p className="mt-4 inline-block border-b-2 border-white pb-1 text-sm font-bold">
            Principal
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {mensajeGeneral ? (
            <p
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-[3px] border border-crm-contador/30 bg-danger-soft px-3 py-2 text-sm text-crm-contador"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {mensajeGeneral}
            </p>
          ) : null}

          <FilaCampo etiqueta="Usuario resp." errores={estado.errores?.responsable_id}>
            {(control) => (
              <select
                {...control}
                name="responsable_id"
                defaultValue={v.responsable_id ?? responsableInicial ?? ""}
                className={cn(CLASE_CONTROL, "cursor-pointer")}
              >
                <option value="">Sin asignar</option>
                {equipo.map((miembro) => (
                  <option key={miembro.id} value={miembro.id}>
                    {miembro.nombre}
                  </option>
                ))}
              </select>
            )}
          </FilaCampo>
          <FilaCampo etiqueta="Próxima acción" errores={estado.errores?.proxima_accion}>
            {(control) => (
              <textarea
                {...control}
                name="proxima_accion"
                rows={2}
                maxLength={500}
                placeholder="…"
                defaultValue={v.proxima_accion ?? ""}
                className={cn(CLASE_CONTROL, "h-auto min-h-8 resize-y py-1.5")}
              />
            )}
          </FilaCampo>
          <FilaCampo etiqueta="Para el día" errores={estado.errores?.proxima_accion_fecha}>
            {(control) => (
              <input
                {...control}
                type="date"
                name="proxima_accion_fecha"
                defaultValue={v.proxima_accion_fecha ?? ""}
                className={cn(CLASE_CONTROL, "w-44")}
              />
            )}
          </FilaCampo>

          <div className="mt-5 border-t border-crm-borde pt-4">
            <div className="mb-2 flex items-center gap-2.5">
              <AvatarContacto nombre={nombre.trim() || "?"} semilla={nombre} tamano="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-crm-texto">
                  {nombre.trim() || "Contacto"}
                </p>
                <p className="text-xs text-crm-hora">Escribe al menos un teléfono o un correo.</p>
              </div>
            </div>
            <FilaCampo
              etiqueta="Teléfono"
              errores={estado.errores?.telefono}
              ayuda="Celular de 10 dígitos o con indicativo (WhatsApp)."
            >
              {(control) => (
                <input
                  {...control}
                  name="telefono"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="…"
                  defaultValue={v.telefono ?? ""}
                  className={CLASE_CONTROL}
                />
              )}
            </FilaCampo>
            <FilaCampo etiqueta="Correo" errores={estado.errores?.email}>
              {(control) => (
                <input
                  {...control}
                  type="email"
                  name="email"
                  autoComplete="off"
                  placeholder="…"
                  defaultValue={v.email ?? ""}
                  className={CLASE_CONTROL}
                />
              )}
            </FilaCampo>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-crm-borde bg-background px-5 py-3">
          <BotonEnviar
            textoPendiente="Guardando…"
            className="h-9 rounded-[3px] bg-crm-seleccion px-5 font-bold text-white hover:bg-crm-seleccion/90"
          >
            Guardar
          </BotonEnviar>
          <Link
            href="/admin/crm"
            className="text-sm text-crm-texto-suave transition-colors hover:text-crm-texto hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </section>

      <section
        aria-label="Historial"
        className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-4 bg-crm-feed px-8 lg:flex"
      >
        <span className="rounded-full border border-crm-borde-fuerte bg-background px-3 py-0.5 text-xs text-crm-texto-suave">
          Hoy
        </span>
        <div className="max-w-md rounded-[3px] border border-crm-borde bg-background p-5 text-center text-sm text-crm-texto-suave shadow-xs">
          <div className="mb-3 flex justify-center gap-2 text-crm-hora" aria-hidden>
            <MessageCircle className="size-5" />
            <Mail className="size-5" />
            <NotebookPen className="size-5" />
          </div>
          Aquí verás el historial del caso: los mensajes de WhatsApp y correo, las notas, las tareas
          y los cambios de etapa. Las personas que escriben por WhatsApp o correo se crean solas;
          este formulario es para quienes llegan por otro medio.
        </div>
      </section>
    </form>
  );
}
