"use client";

import { Loader2, Search, X } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { SelectNativo } from "@/components/formularios/select-nativo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MiembroEquipo } from "@/lib/datos/crm";

const TODOS = "";

/** Filtros del tablero y de la lista de tareas: búsqueda, responsable y canal, en la URL. */
export function FiltrosPipeline({
  equipo,
  conCanal = true,
  conBusqueda = true,
}: {
  equipo: MiembroEquipo[];
  conCanal?: boolean;
  conBusqueda?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState(params.get("q") ?? "");
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  function aplicar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
    }
    const query = siguientes.toString();
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, { scroll: false });
    });
  }

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function alEscribir(valor: string) {
    setBusqueda(valor);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => aplicar({ q: valor.trim() || null }), 350);
  }

  const hayFiltros = Boolean(params.get("q") || params.get("responsable") || params.get("canal"));

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      {conBusqueda ? (
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busqueda}
            onChange={(evento) => alEscribir(evento.target.value)}
            placeholder="Buscar por nombre, teléfono o correo"
            aria-label="Buscar casos"
            className="bg-background pl-9"
          />
        </div>
      ) : null}
      <SelectNativo
        aria-label="Filtrar por responsable"
        className="bg-background sm:w-52"
        value={params.get("responsable") ?? TODOS}
        onChange={(evento) => aplicar({ responsable: evento.target.value || null })}
      >
        <option value={TODOS}>Todos los responsables</option>
        <option value="nadie">Sin asignar</option>
        {equipo.map((miembro) => (
          <option key={miembro.id} value={miembro.id}>
            {miembro.nombre}
          </option>
        ))}
      </SelectNativo>
      {conCanal ? (
        <SelectNativo
          aria-label="Filtrar por canal"
          className="bg-background sm:w-44"
          value={params.get("canal") ?? TODOS}
          onChange={(evento) => aplicar({ canal: evento.target.value || null })}
        >
          <option value={TODOS}>Todos los canales</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="correo">Correo</option>
        </SelectNativo>
      ) : null}
      <div className="flex h-9 items-center gap-2">
        {pendiente ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Cargando" />
        ) : null}
        {hayFiltros ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBusqueda("");
              aplicar({ q: null, responsable: null, canal: null });
            }}
          >
            <X />
            Limpiar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
