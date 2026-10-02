"use client";

import { Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { SelectNativo } from "@/components/formularios/select-nativo";
import type { MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

export const VISTAS_TAREAS = [
  { valor: "pendientes", etiqueta: "Pendientes" },
  { valor: "completadas", etiqueta: "Completadas" },
  { valor: "todas", etiqueta: "Todas" },
] as const;

export type VistaTareas = (typeof VISTAS_TAREAS)[number]["valor"];

function rutaTareas(vista: VistaTareas, responsable: string | undefined) {
  const query = new URLSearchParams();
  if (vista !== "pendientes") query.set("vista", vista);
  if (responsable) query.set("responsable", responsable);
  const cadena = query.toString();
  return `/admin/crm/tareas${cadena ? `?${cadena}` : ""}` as Route;
}

/** Filtros de la lista de tareas en la barra superior: estado (pestañas) y responsable. */
export function FiltrosTareas({
  vista,
  responsable,
  equipo,
  usuarioId,
}: {
  vista: VistaTareas;
  responsable: string | undefined;
  equipo: MiembroEquipo[];
  usuarioId: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
      <nav aria-label="Estado de las tareas" className="flex shrink-0 items-center">
        {VISTAS_TAREAS.map((opcion) => {
          const activa = opcion.valor === vista;
          return (
            <Link
              key={opcion.valor}
              href={rutaTareas(opcion.valor, responsable)}
              scroll={false}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center border-b-2 px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none",
                activa
                  ? "border-crm-seleccion font-bold text-crm-texto"
                  : "border-transparent text-crm-texto-suave hover:text-crm-texto",
              )}
            >
              {opcion.etiqueta}
            </Link>
          );
        })}
      </nav>
      <SelectNativo
        aria-label="Filtrar por responsable"
        className="h-8 w-auto max-w-56 rounded-[3px] border-crm-borde text-crm-texto"
        value={responsable ?? ""}
        onChange={(evento) =>
          startTransition(() => {
            router.replace(rutaTareas(vista, evento.target.value || undefined), { scroll: false });
          })
        }
      >
        <option value="">Todos los responsables</option>
        <option value={usuarioId}>Mis tareas</option>
        <option value="nadie">Sin asignar</option>
        {equipo
          .filter((miembro) => miembro.id !== usuarioId)
          .map((miembro) => (
            <option key={miembro.id} value={miembro.id}>
              {miembro.nombre}
            </option>
          ))}
      </SelectNativo>
      {pendiente ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-crm-hora" aria-label="Cargando" />
      ) : null}
    </div>
  );
}
