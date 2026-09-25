"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  asignarResponsableCaso,
  guardarProximaAccion,
  moverEtapaCaso,
} from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { SelectNativo } from "@/components/formularios/select-nativo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import type { CasoDetalle, Etapa, MiembroEquipo } from "@/lib/datos/crm";

type GestionCasoProps = {
  caso: Pick<CasoDetalle, "id" | "proximaAccion" | "proximaAccionFecha"> & {
    etapaId: string;
    responsableId: string | null;
  };
  etapas: Etapa[];
  equipo: MiembroEquipo[];
};

/** Etapa, responsable y próxima acción del caso. Los selectores guardan al cambiar. */
export function GestionCaso({ caso, etapas, equipo }: GestionCasoProps) {
  const [etapaId, setEtapaId] = useState(caso.etapaId);
  const [responsableId, setResponsableId] = useState(caso.responsableId ?? "");
  const [pendiente, startTransition] = useTransition();
  const [estado, accion] = useActionState(guardarProximaAccion, ESTADO_INICIAL);

  const etapaActual = etapas.find((e) => e.id === etapaId);

  function cambiarEtapa(nueva: string) {
    const anterior = etapaId;
    setEtapaId(nueva);
    startTransition(async () => {
      const resultado = await moverEtapaCaso(caso.id, nueva);
      if (!resultado.ok) {
        setEtapaId(anterior);
        toast.error(resultado.mensaje ?? "No pudimos mover el caso.");
        return;
      }
      toast.success(resultado.mensaje ?? "Etapa actualizada.");
    });
  }

  function cambiarResponsable(nuevo: string) {
    const anterior = responsableId;
    setResponsableId(nuevo);
    startTransition(async () => {
      const resultado = await asignarResponsableCaso(caso.id, nuevo || null);
      if (!resultado.ok) {
        setResponsableId(anterior);
        toast.error(resultado.mensaje ?? "No pudimos asignar el responsable.");
        return;
      }
      toast.success(resultado.mensaje ?? "Responsable actualizado.");
    });
  }

  return (
    <div className="grid gap-5">
      <Campo
        etiqueta="Etapa"
        ayuda={
          etapaActual?.tareasAutomaticas.length || etapaActual?.correoAutomatico
            ? `Al entrar aquí se ${[
                etapaActual.tareasAutomaticas.length
                  ? `crean ${etapaActual.tareasAutomaticas.length} ${etapaActual.tareasAutomaticas.length === 1 ? "tarea" : "tareas"}`
                  : null,
                etapaActual.correoAutomatico ? "envía un correo automático" : null,
              ]
                .filter(Boolean)
                .join(" y ")}.`
            : undefined
        }
      >
        {(control) => (
          <SelectNativo
            {...control}
            value={etapaId}
            disabled={pendiente}
            onChange={(evento) => cambiarEtapa(evento.target.value)}
          >
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nombre}
              </option>
            ))}
          </SelectNativo>
        )}
      </Campo>

      <Campo etiqueta="Responsable" ayuda="Recibe las notificaciones y las tareas del caso.">
        {(control) => (
          <SelectNativo
            {...control}
            value={responsableId}
            disabled={pendiente}
            onChange={(evento) => cambiarResponsable(evento.target.value)}
          >
            <option value="">Sin asignar</option>
            {equipo.map((miembro) => (
              <option key={miembro.id} value={miembro.id}>
                {miembro.nombre}
              </option>
            ))}
          </SelectNativo>
        )}
      </Campo>

      <form action={accion} className="grid gap-3" noValidate>
        <input type="hidden" name="caso_id" value={caso.id} />
        <MensajeFormulario estado={estado} />
        <Campo etiqueta="Próxima acción" errores={estado.errores?.proxima_accion}>
          {(control) => (
            <Textarea
              {...control}
              name="proxima_accion"
              rows={2}
              maxLength={500}
              placeholder="Qué sigue con este caso"
              defaultValue={estado.valores?.proxima_accion ?? caso.proximaAccion ?? ""}
            />
          )}
        </Campo>
        <div className="flex flex-wrap items-end gap-3">
          <Campo etiqueta="Fecha" errores={estado.errores?.proxima_accion_fecha} className="w-44">
            {(control) => (
              <Input
                {...control}
                type="date"
                name="proxima_accion_fecha"
                defaultValue={estado.valores?.proxima_accion_fecha ?? caso.proximaAccionFecha ?? ""}
              />
            )}
          </Campo>
          <BotonEnviar size="sm" variant="secondary" textoPendiente="Guardando…">
            Guardar próxima acción
          </BotonEnviar>
        </div>
      </form>
    </div>
  );
}
