"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/marca/logo";
import { EfectoBrillo } from "@/components/marketing/efecto-brillo";
import { EnlaceSeccion } from "@/components/marketing/enlace-seccion";
import { Button } from "@/components/ui/button";
import { SECCIONES, enlacesPrincipales } from "@/config/navegacion";

export function SiteHeader() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between px-4 md:px-6">
        <Logo variante="claro" prioridad />

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {enlacesPrincipales.map((enlace) => (
            <EnlaceSeccion
              key={enlace.seccion}
              seccion={enlace.seccion}
              className="text-sm font-medium text-white transition-colors hover:text-white/80"
            >
              {enlace.nombre}
            </EnlaceSeccion>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/ingresar">Mi proceso</Link>
          </Button>
          <Button
            asChild
            className="group relative overflow-hidden font-semibold shadow-soft transition-all duration-300 hover:scale-105 hover:shadow-elegant active:scale-95"
          >
            <EnlaceSeccion seccion={SECCIONES.agenda}>
              <span className="relative z-10">Agenda una llamada</span>
              <EfectoBrillo />
            </EnlaceSeccion>
          </Button>
        </div>

        <button
          type="button"
          className="p-2 text-white md:hidden"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          {menuAbierto ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuAbierto ? (
        <div id="menu-movil" className="border-t bg-background md:hidden">
          <nav aria-label="Principal móvil" className="flex flex-col gap-2 px-4 py-4">
            {enlacesPrincipales.map((enlace) => (
              <EnlaceSeccion
                key={enlace.seccion}
                seccion={enlace.seccion}
                onClick={cerrarMenu}
                className="py-2 text-base font-medium text-foreground hover:text-primary"
              >
                {enlace.nombre}
              </EnlaceSeccion>
            ))}
            <Link
              href="/ingresar"
              onClick={cerrarMenu}
              className="py-2 text-base font-medium text-foreground hover:text-primary"
            >
              Mi proceso
            </Link>
            <Button asChild className="mt-2 w-full font-semibold">
              <EnlaceSeccion seccion={SECCIONES.agenda} onClick={cerrarMenu}>
                Agenda una llamada
              </EnlaceSeccion>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
