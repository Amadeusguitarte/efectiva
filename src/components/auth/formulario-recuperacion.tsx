"use client";

import { useActionState } from "react";

import { solicitarRecuperacion } from "@/app/(auth)/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/acciones";

export function FormularioRecuperacion() {
  const [estado, accion] = useActionState(solicitarRecuperacion, ESTADO_INICIAL);

  return (
    <form action={accion} className="grid gap-4" noValidate>
      <MensajeFormulario estado={estado} />
      <Campo etiqueta="Correo del equipo" errores={estado.errores?.email}>
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
      <BotonEnviar className="w-full" textoPendiente="Enviando…">
        Enviar enlace
      </BotonEnviar>
    </form>
  );
}
