"use client";

import { useActionState, useId, useState } from "react";

import { guardarProximaAccion } from "@/app/admin/crm/acciones";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import { claveDia, textoFechaDia } from "@/lib/crm/linea-tiempo";
import { cn } from "cn";

import { BOTON_CRM_SECUNDARIO, BotonEnviarCrm, CAMPO_CRM, FilaDato } from "./piezas";

/**
 * Próxima acción y su fecha en el panel del caso. Se ven como filas de Kommo y, al pulsarlas, se
 * editan en línea.
 */
export function ProximaAccion({
  casoId,
  proximaAccion,
  proximaAccionFecha,
  ahora,
}: {
  casoId: string;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  ahora: string;
}) {
  const id = useId();
  const [editando, setEditando] = useState(false);
  const [estado, accion] = useActionState(async (previo: EstadoAccion, formData: FormData) => {
    const resultado = await guardarProximaAccion(previo, formData);
    if (resultado.ok) setEditando(false);
    return resultado;
  }, ESTADO_INICIAL);

  const vencida = proximaAccionFecha !== null && proximaAccionFecha < claveDia(ahora);

  if (!editando) {
    return (
      <dl>
        <FilaDato etiqueta="Próxima acción">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="-mx-1.5 block w-full rounded-sm border border-transparent px-1.5 py-1 text-left hover:border-crm-borde"
          >
            {proximaAccion ? (
              <span className="line-clamp-3 text-crm-texto">{proximaAccion}</span>
            ) : (
              <span className="text-crm-hora">…</span>
            )}
          </button>
        </FilaDato>
        <FilaDato etiqueta="Fecha">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="-mx-1.5 block w-full rounded-sm border border-transparent px-1.5 py-1 text-left hover:border-crm-borde"
          >
            {proximaAccionFecha ? (
              <span className={cn(vencida ? "font-bold text-crm-contador" : "text-crm-texto")}>
                {textoFechaDia(proximaAccionFecha, ahora)}
              </span>
            ) : (
              <span className="text-crm-hora">…</span>
            )}
          </button>
        </FilaDato>
      </dl>
    );
  }

  return (
    <form action={accion} className="my-2 grid gap-2 rounded-sm bg-crm-feed p-3" noValidate>
      <input type="hidden" name="caso_id" value={casoId} />
      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {estado.mensaje}
        </p>
      ) : null}
      <label htmlFor={`${id}-accion`} className="text-sm text-crm-hora">
        Próxima acción
      </label>
      <textarea
        id={`${id}-accion`}
        name="proxima_accion"
        rows={2}
        maxLength={500}
        autoFocus
        placeholder="Qué sigue con este caso"
        defaultValue={estado.valores?.proxima_accion ?? proximaAccion ?? ""}
        aria-invalid={Boolean(estado.errores?.proxima_accion)}
        className={cn(CAMPO_CRM, "h-auto resize-none py-1.5")}
      />
      <label htmlFor={`${id}-fecha`} className="text-sm text-crm-hora">
        Fecha
      </label>
      <input
        id={`${id}-fecha`}
        type="date"
        name="proxima_accion_fecha"
        defaultValue={estado.valores?.proxima_accion_fecha ?? proximaAccionFecha ?? ""}
        aria-invalid={Boolean(estado.errores?.proxima_accion_fecha)}
        className={cn(CAMPO_CRM, "w-44")}
      />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={BOTON_CRM_SECUNDARIO} onClick={() => setEditando(false)}>
          Cancelar
        </button>
        <BotonEnviarCrm textoPendiente="Guardando…">Guardar</BotonEnviarCrm>
      </div>
    </form>
  );
}
