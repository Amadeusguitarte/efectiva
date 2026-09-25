"use client";

import { Bell } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { marcarNotificacionesLeidas } from "@/app/admin/crm/acciones";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notificacion } from "@/lib/datos/crm";
import { formatearFechaHora } from "@/lib/formato";
import { cn } from "cn";

type Datos = { notificaciones: Notificacion[]; noLeidas: number };

const CADA_MS = 30_000;

/** Campana del panel: avisos de mensajes nuevos, tareas y asignaciones. */
export function CampanaNotificaciones({ inicial }: { inicial: Datos }) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let activo = true;
    async function consultar() {
      if (document.visibilityState !== "visible") return;
      try {
        const respuesta = await fetch("/admin/notificaciones", { cache: "no-store" });
        if (!respuesta.ok) return;
        const nuevos = (await respuesta.json()) as Datos;
        if (activo) setDatos(nuevos);
      } catch {
        // Se reintenta en el siguiente ciclo.
      }
    }
    const intervalo = window.setInterval(() => void consultar(), CADA_MS);
    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  function alAbrir(abierto: boolean) {
    if (!abierto || datos.noLeidas === 0) return;
    const ids = datos.notificaciones.filter((n) => !n.leida).map((n) => n.id);
    setDatos((actual) => ({ ...actual, noLeidas: 0 }));
    startTransition(async () => {
      await marcarNotificacionesLeidas(ids.length > 0 ? ids : undefined);
    });
  }

  return (
    <DropdownMenu onOpenChange={alAbrir}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificaciones${datos.noLeidas ? ` (${datos.noLeidas} sin leer)` : ""}`}
        >
          <Bell />
          {datos.noLeidas > 0 ? (
            <span className="text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold">
              {datos.noLeidas > 99 ? "99+" : datos.noLeidas}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {datos.notificaciones.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Sin notificaciones.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {datos.notificaciones.map((n) => (
              <li key={n.id}>
                <DropdownMenuItem asChild className={cn("items-start", !n.leida && "bg-primary/5")}>
                  <Link href={(n.enlace ?? "/admin/crm") as Route} className="grid gap-0.5">
                    <span className={cn("text-sm", !n.leida && "font-semibold")}>{n.titulo}</span>
                    {n.cuerpo ? (
                      <span className="line-clamp-2 text-xs text-muted-foreground">{n.cuerpo}</span>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground">
                      {formatearFechaHora(n.createdAt)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
