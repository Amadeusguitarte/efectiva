"use client";

import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { SelectNativo } from "@/components/formularios/select-nativo";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

/** Parámetros de la URL que maneja el buscador (además de `q`). */
const CLAVES_FILTRO = ["responsable", "canal", "sin_responder", "tareas"] as const;
type Cambios = Partial<Record<"q" | (typeof CLAVES_FILTRO)[number], string | null>>;

type Atajo = { etiqueta: string; cambios: Cambios };

/**
 * Buscador del pipeline al estilo de Kommo: una sola barra ancha con la búsqueda y los filtros
 * activos como chips verdes; el botón de filtros abre el panel con atajos («Mis casos», «Sin
 * tareas»…) y los filtros por responsable, canal y estado. Todo vive en la URL.
 */
export function FiltrosPipeline({
  equipo,
  usuarioId,
}: {
  equipo: MiembroEquipo[];
  usuarioId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState(params.get("q") ?? "");
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  const responsable = params.get("responsable") ?? "";
  const canal = params.get("canal") ?? "";
  const sinResponder = params.get("sin_responder") === "1";
  const tareas = params.get("tareas") ?? "";

  function aplicar(cambios: Cambios) {
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

  const nombreResponsable =
    responsable === "nadie"
      ? "Sin asignar"
      : responsable === usuarioId
        ? "Mis casos"
        : (equipo.find((m) => m.id === responsable)?.nombre ?? "Responsable");

  const chips: { clave: string; etiqueta: string; quitar: Cambios }[] = [];
  if (responsable) {
    chips.push({
      clave: "responsable",
      etiqueta: nombreResponsable,
      quitar: { responsable: null },
    });
  }
  if (canal === "whatsapp" || canal === "correo") {
    chips.push({
      clave: "canal",
      etiqueta: canal === "whatsapp" ? "WhatsApp" : "Correo",
      quitar: { canal: null },
    });
  }
  if (sinResponder) {
    chips.push({
      clave: "sin_responder",
      etiqueta: "Sin responder",
      quitar: { sin_responder: null },
    });
  }
  if (tareas === "sin" || tareas === "vencidas") {
    chips.push({
      clave: "tareas",
      etiqueta: tareas === "sin" ? "Sin tareas" : "Con tareas vencidas",
      quitar: { tareas: null },
    });
  }

  const limpiar: Cambios = { responsable: null, canal: null, sin_responder: null, tareas: null };
  const atajos: Atajo[] = [
    { etiqueta: "Todos los casos", cambios: limpiar },
    { etiqueta: "Mis casos", cambios: { ...limpiar, responsable: usuarioId } },
    { etiqueta: "Sin asignar", cambios: { ...limpiar, responsable: "nadie" } },
    { etiqueta: "Sin responder", cambios: { ...limpiar, sin_responder: "1" } },
    { etiqueta: "Sin tareas", cambios: { ...limpiar, tareas: "sin" } },
    { etiqueta: "Con tareas vencidas", cambios: { ...limpiar, tareas: "vencidas" } },
  ];
  const atajoActivo = atajos.find((atajo) =>
    CLAVES_FILTRO.every((clave) => (atajo.cambios[clave] ?? "") === (params.get(clave) ?? "")),
  );

  return (
    <Popover>
      <PopoverAnchor asChild>
        <div className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-[3px] border border-crm-borde bg-background pr-1 pl-2.5 transition-colors focus-within:border-crm-seleccion hover:border-crm-borde-fuerte">
          <Search className="size-4 shrink-0 text-crm-hora" aria-hidden />
          {chips.map((chip) => (
            <span
              key={chip.clave}
              className="inline-flex h-6 max-w-40 shrink-0 items-center gap-1 rounded-[3px] bg-crm-filtro pr-0.5 pl-1.5 text-xs text-crm-texto"
            >
              <span className="truncate">{chip.etiqueta}</span>
              <button
                type="button"
                onClick={() => aplicar(chip.quitar)}
                aria-label={`Quitar el filtro «${chip.etiqueta}»`}
                className="inline-flex size-4 items-center justify-center rounded-[2px] hover:bg-background/60"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => alEscribir(evento.target.value)}
            placeholder={chips.length ? "Buscar" : "Búsqueda y filtro"}
            aria-label="Buscar casos por nombre, teléfono o correo"
            className="h-full min-w-16 flex-1 bg-transparent text-sm text-crm-texto outline-none placeholder:text-crm-hora"
          />
          {pendiente ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-crm-hora" aria-label="Cargando" />
          ) : null}
          <PopoverTrigger
            aria-label="Filtros"
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-[3px] text-crm-texto-suave transition-colors hover:bg-crm-feed hover:text-crm-texto focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none data-[state=open]:bg-crm-seleccion-suave data-[state=open]:text-crm-seleccion",
              chips.length > 0 && "text-crm-seleccion",
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-[3px] p-0 font-crm text-crm-texto"
      >
        <div className="grid sm:grid-cols-[12rem_1fr]">
          <ul className="border-b border-crm-borde bg-crm-feed py-1.5 sm:border-r sm:border-b-0">
            {atajos.map((atajo) => (
              <li key={atajo.etiqueta}>
                <button
                  type="button"
                  onClick={() => aplicar(atajo.cambios)}
                  aria-pressed={atajoActivo === atajo}
                  className={cn(
                    "w-full px-4 py-1.5 text-left text-sm transition-colors hover:bg-background focus-visible:bg-background focus-visible:outline-none",
                    atajoActivo === atajo &&
                      "bg-crm-menu-activo font-bold text-crm-menu-activo-texto",
                  )}
                >
                  {atajo.etiqueta}
                </button>
              </li>
            ))}
          </ul>
          <div className="grid content-start gap-3 p-4 text-sm">
            <label className="grid gap-1">
              <span className="text-xs text-crm-hora">Responsable</span>
              <SelectNativo
                className="h-8 rounded-[3px] border-crm-borde"
                value={responsable}
                onChange={(evento) => aplicar({ responsable: evento.target.value || null })}
              >
                <option value="">Todos</option>
                <option value="nadie">Sin asignar</option>
                {equipo.map((miembro) => (
                  <option key={miembro.id} value={miembro.id}>
                    {miembro.nombre}
                    {miembro.id === usuarioId ? " (tú)" : ""}
                  </option>
                ))}
              </SelectNativo>
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-crm-hora">Canal de llegada</span>
              <SelectNativo
                className="h-8 rounded-[3px] border-crm-borde"
                value={canal}
                onChange={(evento) => aplicar({ canal: evento.target.value || null })}
              >
                <option value="">Todos</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="correo">Correo</option>
              </SelectNativo>
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-crm-hora">Tareas</span>
              <SelectNativo
                className="h-8 rounded-[3px] border-crm-borde"
                value={tareas}
                onChange={(evento) => aplicar({ tareas: evento.target.value || null })}
              >
                <option value="">Todas</option>
                <option value="sin">Sin tareas</option>
                <option value="vencidas">Con tareas vencidas</option>
              </SelectNativo>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-crm-seleccion"
                checked={sinResponder}
                onChange={(evento) =>
                  aplicar({ sin_responder: evento.target.checked ? "1" : null })
                }
              />
              Solo sin responder
            </label>
            {chips.length > 0 || busqueda ? (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  aplicar({ ...limpiar, q: null });
                }}
                className="justify-self-start text-xs text-crm-seleccion hover:underline"
              >
                Limpiar filtros y búsqueda
              </button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
