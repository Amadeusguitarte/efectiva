"use client";

import { useActionState } from "react";

import { actualizarContrasena } from "@/app/(auth)/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/acciones";

export function FormularioNuevaContrasena() {
  const [estado, accion] = useActionState(actualizarContrasena, ESTADO_INICIAL);

  return (
    <form action={accion} className="grid gap-4" noValidate>
      <MensajeFormulario estado={estado} />
      <Campo
        etiqueta="Nueva contraseña"
        ayuda="Mínimo 10 caracteres, con letras y números."
        errores={estado.errores?.password}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Campo>
      <Campo etiqueta="Confirma la contraseña" errores={estado.errores?.confirmacion}>
        {(control) => (
          <Input
            {...control}
            name="confirmacion"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Campo>
      <BotonEnviar className="w-full" textoPendiente="Guardando…">
        Guardar contraseña
      </BotonEnviar>
    </form>
  );
}
