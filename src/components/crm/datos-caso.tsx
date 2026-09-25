"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useTransition } from "react";
import { toast } from "sonner";

import { eliminarCaso } from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import { formatearTelefono } from "@/lib/crm/telefono";

type DatosCasoProps = {
  casoId: string;
  accion: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  valores: { nombre: string; telefono: string | null; email: string | null };
};

/** Nombre y datos de contacto del caso, y eliminación. */
export function DatosCaso({ casoId, accion, valores }: DatosCasoProps) {
  const [estado, enviar] = useActionState(accion, ESTADO_INICIAL);
  const [eliminando, startTransition] = useTransition();

  return (
    <div className="grid gap-4">
      <form action={enviar} className="grid gap-3" noValidate>
        <MensajeFormulario estado={estado} />
        <Campo etiqueta="Nombre" errores={estado.errores?.nombre}>
          {(control) => (
            <Input
              {...control}
              name="nombre"
              maxLength={160}
              defaultValue={estado.valores?.nombre ?? valores.nombre}
            />
          )}
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Teléfono (WhatsApp)" opcional errores={estado.errores?.telefono}>
            {(control) => (
              <Input
                {...control}
                name="telefono"
                inputMode="tel"
                defaultValue={estado.valores?.telefono ?? formatearTelefono(valores.telefono)}
              />
            )}
          </Campo>
          <Campo etiqueta="Correo" opcional errores={estado.errores?.email}>
            {(control) => (
              <Input
                {...control}
                type="email"
                name="email"
                defaultValue={estado.valores?.email ?? valores.email ?? ""}
              />
            )}
          </Campo>
        </div>
        <div className="flex justify-end">
          <BotonEnviar size="sm" variant="secondary" textoPendiente="Guardando…">
            Guardar datos
          </BotonEnviar>
        </div>
      </form>

      <div className="flex justify-end border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={eliminando}
          onClick={() => {
            if (!window.confirm("¿Eliminar este caso con sus mensajes, tareas e historial?"))
              return;
            startTransition(async () => {
              const resultado = await eliminarCaso(casoId);
              if (!resultado.ok) toast.error(resultado.mensaje ?? "No se pudo eliminar.");
            });
          }}
        >
          <Trash2 />
          Eliminar caso
        </Button>
      </div>
    </div>
  );
}
