"use client";

import { useActionState } from "react";

import { agregarNotaCaso } from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import { INFO_TIPO_EVENTO } from "@/lib/crm/catalogos";
import type { CasoDetalle } from "@/lib/datos/crm";
import { formatearFechaHora } from "@/lib/formato";
import { cn } from "cn";

/** Notas internas y historial del caso (etapas, responsables, tareas, correos, análisis). */
export function HistorialCaso({
  casoId,
  eventos,
}: {
  casoId: string;
  eventos: CasoDetalle["eventos"];
}) {
  const [estado, accion] = useActionState(agregarNotaCaso, ESTADO_INICIAL);

  return (
    <div className="grid gap-5">
      <form action={accion} className="grid gap-3" noValidate>
        <input type="hidden" name="caso_id" value={casoId} />
        <MensajeFormulario estado={estado} />
        <Label htmlFor={`nota-${casoId}`} className="sr-only">
          Nueva nota
        </Label>
        <Textarea
          id={`nota-${casoId}`}
          name="contenido"
          rows={2}
          maxLength={5000}
          placeholder="Escribe una nota interna para el equipo."
          defaultValue={estado.ok ? "" : (estado.valores?.contenido ?? "")}
          aria-invalid={Boolean(estado.errores?.contenido)}
        />
        <div className="flex justify-end">
          <BotonEnviar size="sm" variant="secondary" textoPendiente="Guardando…">
            Agregar nota
          </BotonEnviar>
        </div>
      </form>

      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
      ) : (
        <ol className="grid gap-3">
          {eventos.map((evento) => {
            const esNota = evento.tipo === "nota";
            return (
              <li
                key={evento.id}
                className={cn(
                  "rounded-lg border p-3",
                  esNota ? "bg-warning-soft/60" : "bg-surface-soft",
                )}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {INFO_TIPO_EVENTO[evento.tipo]}
                </p>
                <p className="mt-0.5 text-sm whitespace-pre-line text-foreground">
                  {evento.descripcion}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {evento.autor ?? "Sistema"} · {formatearFechaHora(evento.createdAt)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
