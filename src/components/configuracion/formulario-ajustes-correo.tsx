"use client";

import { useActionState } from "react";

import { guardarAjustesCorreo } from "@/app/admin/configuracion/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/acciones";
import type { AjustesCorreo } from "@/lib/datos/crm";

export function FormularioAjustesCorreo({ ajustes }: { ajustes: AjustesCorreo }) {
  const [estado, accion] = useActionState(guardarAjustesCorreo, ESTADO_INICIAL);
  const v = estado.valores;
  const marcado = (campo: string, valorActual: boolean) => (v ? v[campo] === "on" : valorActual);

  return (
    <form action={accion} className="grid gap-5" noValidate>
      <MensajeFormulario estado={estado} />

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="activo"
          className="size-4 accent-primary"
          defaultChecked={marcado("activo", ajustes.activo)}
        />
        <span>
          <span className="font-medium">Activar la cuenta de correo</span>
          <span className="block text-xs text-muted-foreground">
            El worker revisa la bandeja cada minuto y envía los correos en cola.
          </span>
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre del remitente" errores={estado.errores?.remitente_nombre}>
          {(control) => (
            <Input
              {...control}
              name="remitente_nombre"
              maxLength={100}
              defaultValue={
                v?.remitente_nombre ?? ajustes.remitenteNombre ?? "Insolvencia Efectiva"
              }
            />
          )}
        </Campo>
        <Campo etiqueta="Correo del remitente" errores={estado.errores?.remitente_email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="remitente_email"
              defaultValue={v?.remitente_email ?? ajustes.remitenteEmail}
            />
          )}
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          etiqueta="Usuario"
          errores={estado.errores?.usuario}
          ayuda="Normalmente el correo completo."
        >
          {(control) => (
            <Input
              {...control}
              name="usuario"
              maxLength={254}
              autoComplete="off"
              defaultValue={v?.usuario ?? ajustes.usuario}
            />
          )}
        </Campo>
        <Campo
          etiqueta="Contraseña (de aplicación)"
          errores={estado.errores?.contrasena}
          ayuda={
            ajustes.tieneContrasena
              ? "Ya hay una guardada; escribe otra solo para reemplazarla."
              : "Se guarda cifrada."
          }
        >
          {(control) => (
            <Input
              {...control}
              type="password"
              name="contrasena"
              autoComplete="new-password"
              placeholder={ajustes.tieneContrasena ? "••••••••••••" : ""}
            />
          )}
        </Campo>
      </div>

      <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_7rem_auto]">
        <legend className="px-1 text-sm font-medium">Envío (SMTP)</legend>
        <Campo etiqueta="Servidor" errores={estado.errores?.smtp_host}>
          {(control) => (
            <Input
              {...control}
              name="smtp_host"
              defaultValue={v?.smtp_host ?? ajustes.smtpHost}
              placeholder="smtp.gmail.com"
            />
          )}
        </Campo>
        <Campo etiqueta="Puerto" errores={estado.errores?.smtp_puerto}>
          {(control) => (
            <Input
              {...control}
              type="number"
              name="smtp_puerto"
              min={1}
              max={65535}
              defaultValue={v?.smtp_puerto ?? String(ajustes.smtpPuerto)}
            />
          )}
        </Campo>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="smtp_seguro"
            className="size-4 accent-primary"
            defaultChecked={marcado("smtp_seguro", ajustes.smtpSeguro)}
          />
          SSL (465)
        </label>
      </fieldset>

      <fieldset className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_7rem_auto]">
        <legend className="px-1 text-sm font-medium">Recepción (IMAP)</legend>
        <Campo etiqueta="Servidor" errores={estado.errores?.imap_host}>
          {(control) => (
            <Input
              {...control}
              name="imap_host"
              defaultValue={v?.imap_host ?? ajustes.imapHost}
              placeholder="imap.gmail.com"
            />
          )}
        </Campo>
        <Campo etiqueta="Puerto" errores={estado.errores?.imap_puerto}>
          {(control) => (
            <Input
              {...control}
              type="number"
              name="imap_puerto"
              min={1}
              max={65535}
              defaultValue={v?.imap_puerto ?? String(ajustes.imapPuerto)}
            />
          )}
        </Campo>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="imap_seguro"
            className="size-4 accent-primary"
            defaultChecked={marcado("imap_seguro", ajustes.imapSeguro)}
          />
          SSL (993)
        </label>
      </fieldset>

      <div className="flex justify-end">
        <BotonEnviar textoPendiente="Guardando…">Guardar ajustes</BotonEnviar>
      </div>
    </form>
  );
}
