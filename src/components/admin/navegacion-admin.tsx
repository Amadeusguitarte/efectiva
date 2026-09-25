"use client";

import {
  CalendarClock,
  CheckSquare,
  Columns3,
  ExternalLink,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/marca/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "cn";

type ItemNavegacion = {
  nombre: string;
  href: Route;
  icono: LucideIcon;
  /** Decide si el enlace está activo; por defecto, cuando la ruta empieza por `href`. */
  activo?: (pathname: string) => boolean;
};

type GrupoNavegacion = { titulo?: string; items: ItemNavegacion[] };

const GRUPOS: GrupoNavegacion[] = [
  {
    items: [
      { nombre: "Resumen", href: "/admin", icono: LayoutDashboard, activo: (p) => p === "/admin" },
      { nombre: "Clientes", href: "/admin/clientes", icono: Users },
    ],
  },
  {
    titulo: "CRM",
    items: [
      {
        nombre: "Pipeline",
        href: "/admin/crm",
        icono: Columns3,
        activo: (p) =>
          p === "/admin/crm" ||
          p.startsWith("/admin/crm/casos") ||
          p.startsWith("/admin/crm/nuevo"),
      },
      { nombre: "WhatsApp", href: "/admin/crm/whatsapp", icono: MessageCircle },
      { nombre: "Correo", href: "/admin/crm/correo", icono: Mail },
      { nombre: "Tareas", href: "/admin/crm/tareas", icono: CheckSquare },
    ],
  },
  {
    titulo: "Sistema",
    items: [{ nombre: "Configuración", href: "/admin/configuracion", icono: Settings }],
  },
];

const PROXIMAMENTE = [{ nombre: "Programación de pagos", icono: CalendarClock }];

function Enlaces({ alNavegar }: { alNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel" className="flex flex-1 flex-col gap-6">
      {GRUPOS.map((grupo, indice) => (
        <div key={grupo.titulo ?? indice} className="grid gap-1">
          {grupo.titulo ? (
            <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
              {grupo.titulo}
            </p>
          ) : null}
          <ul className="grid gap-1">
            {grupo.items.map(({ nombre, href, icono: Icono, activo }) => {
              const esActivo = activo ? activo(pathname) : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={alNavegar}
                    aria-current={esActivo ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      esActivo
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icono className="size-4" />
                    {nombre}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="grid gap-1">
        <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
          Próximamente
        </p>
        <ul className="grid gap-1">
          {PROXIMAMENTE.map(({ nombre, icono: Icono }) => (
            <li
              key={nombre}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
            >
              <Icono className="size-4" />
              <span className="flex-1">{nombre}</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                Fase 3
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/"
        target="_blank"
        className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <ExternalLink className="size-4" />
        Ver sitio web
      </Link>
    </nav>
  );
}

export function BarraLateralAdmin() {
  return (
    <div className="flex h-full flex-col gap-8 overflow-y-auto px-4 py-6">
      <Logo href="/admin" className="px-2" />
      <Enlaces />
    </div>
  );
}

export function MenuMovilAdmin() {
  const [abierto, setAbierto] = useState(false);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegación">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navegación del panel</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col gap-8 overflow-y-auto px-4 py-6">
          <Logo href="/admin" className="px-2" />
          <Enlaces alNavegar={() => setAbierto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
