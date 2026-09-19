"use client";

import { Loader2, Search, X } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_PROPUESTA, INFO_ESTADO } from "@/lib/propuestas/estados";

const TODOS = "todos";

export function FiltrosClientes() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState(params.get("q") ?? "");
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  const estado = params.get("estado") ?? TODOS;

  function aplicar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
    }
    siguientes.delete("pagina");
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

  const hayFiltros = Boolean(params.get("q") || params.get("estado"));

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={busqueda}
          onChange={(evento) => alEscribir(evento.target.value)}
          placeholder="Buscar por nombre, correo, documento o teléfono"
          aria-label="Buscar clientes"
          className="bg-background pl-9"
        />
      </div>
      <Select
        value={estado}
        onValueChange={(valor) => aplicar({ estado: valor === TODOS ? null : valor })}
      >
        <SelectTrigger className="w-full bg-background sm:w-56" aria-label="Filtrar por estado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los estados</SelectItem>
          {ESTADOS_PROPUESTA.map((valor) => (
            <SelectItem key={valor} value={valor}>
              {INFO_ESTADO[valor].etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
              aplicar({ q: null, estado: null });
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
