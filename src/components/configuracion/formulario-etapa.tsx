"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { guardarEtapa } from "@/app/admin/configuracion/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { SelectNativo } from "@/components/formularios/select-nativo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import { TIPOS_TAREA, type TareaAutomatica } from "@/lib/crm/catalogos";
import type { Etapa } from "@/lib/datos/crm";

type FormularioEtapaProps = {
  etapa?: Etapa;
  onGuardado?: () => void;
  onCancelar?: () => void;
};

const TAREA_NUEVA: TareaAutomatica = {
  tipo: "seguimiento",
  titulo: "",
  descripcion: "",
  dias_plazo: 2,
};

/** Crea o edita una etapa: datos, tareas automáticas y correo automático. */
export function FormularioEtapa({ etapa, onGuardado, onCancelar }: FormularioEtapaProps) {
  const [estado, accion] = useActionState(guardarEtapa, ESTADO_INICIAL);
  const [tareas, setTareas] = useState<TareaAutomatica[]>(etapa?.tareasAutomaticas ?? []);

  useEffect(() => {
    if (estado.ok) onGuardado?.();
  }, [estado, onGuardado]);

  function actualizarTarea(indice: number, cambios: Partial<TareaAutomatica>) {
    setTareas((actuales) => actuales.map((t, i) => (i === indice ? { ...t, ...cambios } : t)));
  }

  return (
    <form action={accion} className="grid gap-5" noValidate>
      {etapa ? <input type="hidden" name="id" value={etapa.id} /> : null}
      <input type="hidden" name="tareas_automaticas" value={JSON.stringify(tareas)} />
      <MensajeFormulario estado={estado} />

      <div className="grid gap-5 sm:grid-cols-[1fr_6rem]">
        <Campo etiqueta="Nombre" errores={estado.errores?.nombre}>
          {(control) => (
            <Input
              {...control}
              name="nombre"
              maxLength={60}
              defaultValue={estado.valores?.nombre ?? etapa?.nombre ?? ""}
            />
          )}
        </Campo>
        <Campo etiqueta="Color" errores={estado.errores?.color}>
          {(control) => (
            <input
              {...control}
              type="color"
              name="color"
              defaultValue={estado.valores?.color ?? etapa?.color ?? "#2563eb"}
              className="h-9 w-full cursor-pointer rounded-md border bg-background p-1"
            />
          )}
        </Campo>
      </div>

      <Campo
        etiqueta="Descripción"
        opcional
        errores={estado.errores?.descripcion}
        ayuda="Se muestra en el tablero y ayuda a la IA a clasificar."
      >
        {(control) => (
          <Input
            {...control}
            name="descripcion"
            maxLength={500}
            defaultValue={estado.valores?.descripcion ?? etapa?.descripcion ?? ""}
          />
        )}
      </Campo>

      <Campo
        etiqueta="Tipo de etapa"
        errores={estado.errores?.cierre}
        ayuda="Las etapas de cierre sacan el caso del pipeline activo."
      >
        {(control) => (
          <SelectNativo
            {...control}
            name="cierre"
            defaultValue={estado.valores?.cierre ?? etapa?.cierre ?? ""}
            className="sm:w-64"
          >
            <option value="">Etapa en curso</option>
            <option value="ganado">Cierre ganado (es cliente)</option>
            <option value="perdido">Cierre perdido (descartado)</option>
          </SelectNativo>
        )}
      </Campo>

      <fieldset className="grid gap-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">
          Tareas automáticas al entrar a la etapa
        </legend>
        {estado.errores?.tareas_automaticas ? (
          <p className="text-sm text-destructive">{estado.errores.tareas_automaticas[0]}</p>
        ) : null}
        {tareas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas automáticas.</p>
        ) : null}
        {tareas.map((tarea, indice) => (
          <div
            key={indice}
            className="grid gap-2 rounded-md bg-surface-soft p-3 sm:grid-cols-[9rem_1fr_5.5rem_auto]"
          >
            <SelectNativo
              aria-label="Tipo de tarea"
              value={tarea.tipo}
              onChange={(evento) =>
                actualizarTarea(indice, { tipo: evento.target.value as TareaAutomatica["tipo"] })
              }
            >
              {TIPOS_TAREA.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.etiqueta}
                </option>
              ))}
            </SelectNativo>
            <Input
              aria-label="Título de la tarea"
              placeholder="Título de la tarea"
              maxLength={200}
              value={tarea.titulo}
              onChange={(evento) => actualizarTarea(indice, { titulo: evento.target.value })}
            />
            <Input
              aria-label="Días de plazo"
              type="number"
              min={0}
              max={365}
              value={tarea.dias_plazo}
              onChange={(evento) =>
                actualizarTarea(indice, { dias_plazo: Number(evento.target.value) || 0 })
              }
              title="Días de plazo desde que entra a la etapa"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar tarea"
              onClick={() => setTareas((actuales) => actuales.filter((_, i) => i !== indice))}
            >
              <Trash2 />
            </Button>
            <Input
              aria-label="Detalle de la tarea"
              placeholder="Detalle (opcional)"
              maxLength={2000}
              value={tarea.descripcion ?? ""}
              onChange={(evento) => actualizarTarea(indice, { descripcion: evento.target.value })}
              className="sm:col-span-4"
            />
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTareas((t) => [...t, { ...TAREA_NUEVA }])}
          >
            <Plus />
            Agregar tarea
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Las tareas se asignan al responsable del caso y se le notifican. El plazo cuenta desde el
          día en que el caso entra a la etapa.
        </p>
      </fieldset>

      <fieldset className="grid gap-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Correo automático al entrar a la etapa</legend>
        <Campo etiqueta="Asunto" opcional errores={estado.errores?.correo_asunto}>
          {(control) => (
            <Input
              {...control}
              name="correo_asunto"
              maxLength={300}
              defaultValue={estado.valores?.correo_asunto ?? etapa?.correoAutomatico?.asunto ?? ""}
            />
          )}
        </Campo>
        <Campo
          etiqueta="Mensaje"
          opcional
          errores={estado.errores?.correo_cuerpo}
          ayuda="Puedes usar {{nombre}} y {{etapa}}. Se envía solo si el caso tiene correo y la cuenta de correo está conectada."
        >
          {(control) => (
            <Textarea
              {...control}
              name="correo_cuerpo"
              rows={6}
              maxLength={5000}
              defaultValue={estado.valores?.correo_cuerpo ?? etapa?.correoAutomatico?.cuerpo ?? ""}
            />
          )}
        </Campo>
      </fieldset>

      <div className="flex justify-end gap-2">
        {onCancelar ? (
          <Button type="button" variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
        ) : null}
        <BotonEnviar textoPendiente="Guardando…">
          {etapa ? "Guardar etapa" : "Crear etapa"}
        </BotonEnviar>
      </div>
    </form>
  );
}
