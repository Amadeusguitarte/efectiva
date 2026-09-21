"use client";

import { useActionState } from "react";

import { agregarNotaInterna } from "@/app/admin/clientes/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import { formatearFechaHora } from "@/lib/formato";

type Nota = {
  id: number;
  contenido: string;
  created_at: string;
  autor: { nombre_completo: string | null; email: string } | null;
};

export function NotasInternas({ clienteId, notas }: { clienteId: string; notas: Nota[] }) {
  const [estado, accion] = useActionState(agregarNotaInterna, ESTADO_INICIAL);

  return (
    <div className="grid gap-5">
      <form action={accion} className="grid gap-3" noValidate>
        <input type="hidden" name="cliente_id" value={clienteId} />
        <MensajeFormulario estado={estado} />
        <Label htmlFor="nota-interna" className="sr-only">
          Nueva nota interna
        </Label>
        <Textarea
          id="nota-interna"
          name="contenido"
          rows={3}
          maxLength={5000}
          placeholder="Escribe una nota para el equipo. El cliente no la verá."
          defaultValue={estado.ok ? "" : (estado.valores?.contenido ?? "")}
          aria-invalid={Boolean(estado.errores?.contenido)}
        />
        <div className="flex justify-end">
          <BotonEnviar size="sm" variant="secondary" textoPendiente="Guardando…">
            Agregar nota
          </BotonEnviar>
        </div>
      </form>

      {notas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin notas todavía.</p>
      ) : (
        <ul className="grid gap-3">
          {notas.map((nota) => (
            <li key={nota.id} className="rounded-lg border bg-surface-soft p-3">
              <p className="text-sm whitespace-pre-line text-foreground">{nota.contenido}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {nota.autor?.nombre_completo || nota.autor?.email || "Equipo"} ·{" "}
                {formatearFechaHora(nota.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
