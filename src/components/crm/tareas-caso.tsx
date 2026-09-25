"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";

import { cambiarEstadoTarea, crearTarea } from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { SelectNativo } from "@/components/formularios/select-nativo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import { INFO_TIPO_TAREA, TIPOS_TAREA, type EstadoTarea } from "@/lib/crm/catalogos";
import type { MiembroEquipo, TareaCaso } from "@/lib/datos/crm";
import { formatearFecha } from "@/lib/formato";
import { cn } from "cn";

type TareasCasoProps = {
  casoId: string;
  tareas: TareaCaso[];
  equipo: MiembroEquipo[];
  responsableCasoId: string | null;
  hoy: string;
};

export function FilaTarea({
  tarea,
  hoy,
  mostrarCaso,
}: {
  tarea: TareaCaso & { caso?: { id: string; nombre: string } };
  hoy: string;
  mostrarCaso?: React.ReactNode;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const completada = tarea.estado === "completada";
  const vencida = tarea.estado === "pendiente" && tarea.venceAt !== null && tarea.venceAt < hoy;

  function cambiar(estado: EstadoTarea) {
    startTransition(async () => {
      const resultado = await cambiarEstadoTarea(tarea.id, estado);
      if (!resultado.ok) toast.error(resultado.mensaje ?? "No se pudo actualizar.");
      router.refresh();
    });
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border bg-background p-3">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-primary"
        checked={completada}
        disabled={pendiente || tarea.estado === "cancelada"}
        onChange={(evento) => cambiar(evento.target.checked ? "completada" : "pendiente")}
        aria-label={`Marcar «${tarea.titulo}» como ${completada ? "pendiente" : "completada"}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-foreground",
            tarea.estado !== "pendiente" && "text-muted-foreground line-through",
          )}
        >
          {tarea.titulo}
        </p>
        {tarea.descripcion ? (
          <p className="text-xs whitespace-pre-line text-muted-foreground">{tarea.descripcion}</p>
        ) : null}
        <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span>{INFO_TIPO_TAREA[tarea.tipo].etiqueta}</span>
          {tarea.venceAt ? (
            <span className={cn(vencida && "font-medium text-destructive")}>
              · {vencida ? "Venció el" : "Vence el"} {formatearFecha(tarea.venceAt)}
            </span>
          ) : null}
          {tarea.responsable ? <span>· {tarea.responsable.nombre}</span> : null}
          {tarea.estado === "cancelada" ? <span>· Cancelada</span> : null}
          {mostrarCaso}
        </p>
      </div>
      {tarea.estado === "pendiente" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={pendiente}
          onClick={() => cambiar("cancelada")}
        >
          Cancelar
        </Button>
      ) : null}
    </li>
  );
}

export function TareasCaso({ casoId, tareas, equipo, responsableCasoId, hoy }: TareasCasoProps) {
  const [estado, accion] = useActionState(crearTarea, ESTADO_INICIAL);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const pendientes = tareas.filter((t) => t.estado === "pendiente");
  const cerradas = tareas.filter((t) => t.estado !== "pendiente");

  return (
    <div className="grid gap-4">
      {pendientes.length === 0 && cerradas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin tareas todavía.</p>
      ) : null}
      {pendientes.length > 0 ? (
        <ul className="grid gap-2">
          {pendientes.map((tarea) => (
            <FilaTarea key={tarea.id} tarea={tarea} hoy={hoy} />
          ))}
        </ul>
      ) : null}
      {cerradas.length > 0 ? (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {cerradas.length} {cerradas.length === 1 ? "tarea cerrada" : "tareas cerradas"}
          </summary>
          <ul className="mt-2 grid gap-2">
            {cerradas.map((tarea) => (
              <FilaTarea key={tarea.id} tarea={tarea} hoy={hoy} />
            ))}
          </ul>
        </details>
      ) : null}

      {mostrarFormulario ? (
        <form
          action={accion}
          className="grid gap-3 rounded-lg border bg-surface-soft/60 p-3"
          noValidate
        >
          <input type="hidden" name="caso_id" value={casoId} />
          <MensajeFormulario estado={estado} />
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <Campo etiqueta="Tipo" errores={estado.errores?.tipo}>
              {(control) => (
                <SelectNativo
                  {...control}
                  name="tipo"
                  defaultValue={estado.valores?.tipo ?? "seguimiento"}
                >
                  {TIPOS_TAREA.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </SelectNativo>
              )}
            </Campo>
            <Campo etiqueta="Título" errores={estado.errores?.titulo}>
              {(control) => (
                <Input
                  {...control}
                  name="titulo"
                  maxLength={200}
                  defaultValue={estado.valores?.titulo ?? ""}
                />
              )}
            </Campo>
          </div>
          <Campo etiqueta="Detalle" opcional errores={estado.errores?.descripcion}>
            {(control) => (
              <Textarea
                {...control}
                name="descripcion"
                rows={2}
                maxLength={2000}
                defaultValue={estado.valores?.descripcion ?? ""}
              />
            )}
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Vence" opcional errores={estado.errores?.vence_at}>
              {(control) => (
                <Input
                  {...control}
                  type="date"
                  name="vence_at"
                  defaultValue={estado.valores?.vence_at ?? ""}
                />
              )}
            </Campo>
            <Campo etiqueta="Responsable" errores={estado.errores?.responsable_id}>
              {(control) => (
                <SelectNativo
                  {...control}
                  name="responsable_id"
                  defaultValue={estado.valores?.responsable_id ?? responsableCasoId ?? ""}
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
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarFormulario(false)}
            >
              Cerrar
            </Button>
            <BotonEnviar size="sm" textoPendiente="Creando…">
              Crear tarea
            </BotonEnviar>
          </div>
        </form>
      ) : (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMostrarFormulario(true)}
          >
            <Plus />
            Nueva tarea
          </Button>
        </div>
      )}
    </div>
  );
}
