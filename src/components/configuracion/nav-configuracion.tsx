"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const SECCIONES: { nombre: string; href: Route }[] = [
  { nombre: "Etapas del pipeline", href: "/admin/configuracion/etapas" },
  { nombre: "Inteligencia artificial", href: "/admin/configuracion/ia" },
  { nombre: "WhatsApp", href: "/admin/configuracion/whatsapp" },
  { nombre: "Correo", href: "/admin/configuracion/correo" },
];

export function NavConfiguracion() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de configuración" className="mb-6 flex flex-wrap gap-2">
      {SECCIONES.map((seccion) => {
        const activa = pathname.startsWith(seccion.href);
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activa
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {seccion.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
