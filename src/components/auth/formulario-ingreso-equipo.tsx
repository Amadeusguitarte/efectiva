"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ingresarConCorreo } from "@/app/(auth)/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/acciones";

export function FormularioIngresoEquipo({ siguiente }: { siguiente: string | null }) {
  const [estado, accion] = useActionState(ingresarConCorreo, ESTADO_INICIAL);

  return (
    <form action={accion} className="grid gap-4" noValidate>
      {siguiente ? <input type="hidden" name="siguiente" value={siguiente} /> : null}
      <MensajeFormulario estado={estado} />
      <Campo etiqueta="Correo" errores={estado.errores?.email}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={estado.valores?.email}
            required
          />
        )}
      </Campo>
      <Campo etiqueta="Contraseña" errores={estado.errores?.password}>
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Campo>
      <BotonEnviar className="w-full" textoPendiente="Ingresando…">
        Ingresar
      </BotonEnviar>
      <Link
        href="/recuperar-contrasena"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  );
}
