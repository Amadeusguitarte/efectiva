"use client";

import { useActionState } from "react";

import { crearCaso } from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { SelectNativo } from "@/components/formularios/select-nativo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import type { Etapa, MiembroEquipo } from "@/lib/datos/crm";

export function FormularioCaso({ etapas, equipo }: { etapas: Etapa[]; equipo: MiembroEquipo[] }) {
  const [estado, accion] = useActionState(crearCaso, ESTADO_INICIAL);
  const v = estado.valores ?? {};

  return (
    <form action={accion} className="grid gap-5" noValidate>
      <MensajeFormulario estado={estado} />
      <Campo etiqueta="Nombre" errores={estado.errores?.nombre}>
        {(control) => (
          <Input
            {...control}
            name="nombre"
            maxLength={160}
            defaultValue={v.nombre ?? ""}
            autoFocus
          />
        )}
      </Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          etiqueta="Teléfono (WhatsApp)"
          opcional
          errores={estado.errores?.telefono}
          ayuda="Celular colombiano de 10 dígitos o con indicativo."
        >
          {(control) => (
            <Input {...control} name="telefono" inputMode="tel" defaultValue={v.telefono ?? ""} />
          )}
        </Campo>
        <Campo etiqueta="Correo" opcional errores={estado.errores?.email}>
          {(control) => (
            <Input {...control} type="email" name="email" defaultValue={v.email ?? ""} />
          )}
        </Campo>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Etapa" errores={estado.errores?.etapa_id}>
          {(control) => (
            <SelectNativo
              {...control}
              name="etapa_id"
              defaultValue={v.etapa_id ?? etapas[0]?.id ?? ""}
            >
              {etapas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nombre}
                </option>
              ))}
            </SelectNativo>
          )}
        </Campo>
        <Campo etiqueta="Responsable" errores={estado.errores?.responsable_id}>
          {(control) => (
            <SelectNativo {...control} name="responsable_id" defaultValue={v.responsable_id ?? ""}>
              <option value="">Sin asignar</option>
              {equipo.map((miembro) => (
                <option key={miembro.id} value={miembro.id}>
                  {miembro.nombre}
                </option>
              ))}
            </SelectNativo>
          )}
        </Campo>
      </div>
      <Campo etiqueta="Próxima acción" opcional errores={estado.errores?.proxima_accion}>
        {(control) => (
          <Textarea
            {...control}
            name="proxima_accion"
            rows={2}
            maxLength={500}
            defaultValue={v.proxima_accion ?? ""}
          />
        )}
      </Campo>
      <Campo
        etiqueta="Fecha de la próxima acción"
        opcional
        errores={estado.errores?.proxima_accion_fecha}
        className="w-48"
      >
        {(control) => (
          <Input
            {...control}
            type="date"
            name="proxima_accion_fecha"
            defaultValue={v.proxima_accion_fecha ?? ""}
          />
        )}
      </Campo>
      <div className="flex justify-end">
        <BotonEnviar textoPendiente="Creando…">Crear caso</BotonEnviar>
      </div>
    </form>
  );
}
