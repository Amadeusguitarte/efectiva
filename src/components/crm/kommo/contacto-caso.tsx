"use client";

import { Mail, MessageCircle, MoreHorizontal } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { actualizarDatosCaso } from "@/app/admin/crm/acciones";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import { formatearTelefono } from "@/lib/crm/telefono";
import type { CasoDetalle } from "@/lib/datos/crm";
import { numeroWhatsApp } from "@/lib/formato";

import { AvatarContacto } from "./avatar-contacto";
import { BOTON_CRM_SECUNDARIO, BotonEnviarCrm, CAMPO_CRM, FilaDato } from "./piezas";

type ContactoCasoProps = {
  caso: Pick<CasoDetalle, "id" | "nombre" | "telefono" | "email" | "origen">;
};

/**
 * Bloque del contacto del panel, como el de Kommo: avatar con el canal, nombre, insignia
 * «WhatsApp Business» y sus datos. El «…» abre la edición en línea.
 */
export function ContactoCaso({ caso }: ContactoCasoProps) {
  const [editando, setEditando] = useState(false);
  const [estado, accion] = useActionState(async (previo: EstadoAccion, formData: FormData) => {
    const resultado = await actualizarDatosCaso(caso.id, previo, formData);
    if (resultado.ok) setEditando(false);
    return resultado;
  }, ESTADO_INICIAL);
  const canal = caso.origen ?? (caso.telefono ? "whatsapp" : "correo");

  return (
    <div className="border-b border-crm-borde px-5 py-4">
      <div className="flex items-center gap-3">
        <AvatarContacto nombre={caso.nombre} canal={canal} semilla={caso.id} tamano="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-crm-texto">{caso.nombre}</span>
            <button
              type="button"
              onClick={() => setEditando((valor) => !valor)}
              className="rounded-sm p-0.5 text-crm-hora hover:bg-crm-feed hover:text-crm-texto"
              aria-label="Editar los datos del contacto"
              aria-expanded={editando}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </p>
          <span className="mt-0.5 flex flex-wrap gap-1">
            {caso.telefono ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-crm-borde-fuerte px-1.5 text-[10px] leading-4 text-crm-texto-suave">
                <MessageCircle className="size-2.5 text-crm-whatsapp" aria-hidden />
                WhatsApp Business
              </span>
            ) : null}
            {caso.email ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-crm-borde-fuerte px-1.5 text-[10px] leading-4 text-crm-texto-suave">
                <Mail className="size-2.5 text-crm-seleccion" aria-hidden />
                Correo
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {editando ? (
        <form action={accion} className="mt-3 grid gap-2" noValidate>
          {estado.mensaje && !estado.ok ? (
            <p role="alert" className="text-sm text-destructive">
              {estado.mensaje}
            </p>
          ) : null}
          <CampoContacto
            etiqueta="Nombre"
            nombre="nombre"
            valor={estado.valores?.nombre ?? caso.nombre}
            error={estado.errores?.nombre?.[0]}
          />
          <CampoContacto
            etiqueta="Teléfono"
            nombre="telefono"
            tipo="tel"
            valor={estado.valores?.telefono ?? formatearTelefono(caso.telefono)}
            error={estado.errores?.telefono?.[0]}
          />
          <CampoContacto
            etiqueta="Correo"
            nombre="email"
            tipo="email"
            valor={estado.valores?.email ?? caso.email ?? ""}
            error={estado.errores?.email?.[0]}
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className={BOTON_CRM_SECUNDARIO}
              onClick={() => setEditando(false)}
            >
              Cancelar
            </button>
            <BotonEnviarCrm textoPendiente="Guardando…">Guardar</BotonEnviarCrm>
          </div>
        </form>
      ) : (
        <dl className="mt-3 text-[15px]">
          <FilaDato etiqueta="Teléfono">
            {caso.telefono ? (
              <a
                href={`https://wa.me/${numeroWhatsApp(caso.telefono)}`}
                target="_blank"
                rel="noreferrer"
                className="text-crm-texto underline underline-offset-2 hover:text-crm-seleccion"
              >
                {formatearTelefono(caso.telefono)}
              </a>
            ) : (
              <span className="text-crm-hora">…</span>
            )}
          </FilaDato>
          <FilaDato etiqueta="Correo">
            {caso.email ? (
              <a
                href={`mailto:${caso.email}`}
                className="block truncate text-crm-texto underline underline-offset-2 hover:text-crm-seleccion"
              >
                {caso.email}
              </a>
            ) : (
              <span className="text-crm-hora">…</span>
            )}
          </FilaDato>
        </dl>
      )}
    </div>
  );
}

function CampoContacto({
  etiqueta,
  nombre,
  valor,
  error,
  tipo = "text",
}: {
  etiqueta: string;
  nombre: string;
  valor: string;
  error?: string;
  tipo?: "text" | "tel" | "email";
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-start gap-2 text-sm">
      <label htmlFor={id} className="pt-1.5 text-crm-hora">
        {etiqueta}
      </label>
      <div>
        <input
          id={id}
          name={nombre}
          type={tipo}
          inputMode={tipo === "tel" ? "tel" : undefined}
          defaultValue={valor}
          maxLength={nombre === "nombre" ? 160 : 254}
          aria-invalid={Boolean(error)}
          className={CAMPO_CRM}
        />
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
