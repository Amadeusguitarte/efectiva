"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { BarraLateralAdmin } from "@/components/admin/navegacion-admin";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  COOKIE_MENU_ADMIN,
  DURACION_COOKIE_MENU,
  serializarPreferenciaMenu,
  type PreferenciaMenu,
  type TamanoMenu,
} from "@/lib/preferencias-menu";

const ID_MENU = "menu-lateral-admin";

const ANCHO_MENU: Record<TamanoMenu, string> = {
  compacto: "13.5rem",
  normal: "16rem",
  amplio: "19rem",
};

const ANCHO_MINIMIZADO = "4.25rem";

/** Mismo punto de corte que `lg:` de Tailwind: por debajo se usa el menú móvil (Sheet). */
const CONSULTA_ESCRITORIO = "(min-width: 64rem)";

function guardarPreferencia(preferencia: PreferenciaMenu) {
  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_MENU_ADMIN}=${serializarPreferenciaMenu(preferencia)}; Path=/; Max-Age=${DURACION_COOKIE_MENU}; SameSite=Lax${seguro}`;
}

type MarcoAdminProps = {
  /** Leída de la cookie en el servidor, para pintar el estado correcto desde el primer render. */
  preferenciaInicial: PreferenciaMenu;
  /** Barra superior del panel (menú móvil, notificaciones y menú de usuario). */
  encabezado: ReactNode;
  children: ReactNode;
};

/**
 * Estructura del panel: menú lateral (minimizable y con tamaño ajustable) y área de contenido.
 * Atajo de teclado: Ctrl+B (o Cmd+B) minimiza o expande el menú.
 */
export function MarcoAdmin({ preferenciaInicial, encabezado, children }: MarcoAdminProps) {
  const [preferencia, setPreferencia] = useState(preferenciaInicial);
  const { minimizado, tamano } = preferencia;

  useEffect(() => {
    guardarPreferencia(preferencia);
  }, [preferencia]);

  useEffect(() => {
    const escritorio = window.matchMedia(CONSULTA_ESCRITORIO);
    function alPulsarTecla(evento: KeyboardEvent) {
      if (!(evento.ctrlKey || evento.metaKey) || evento.altKey || evento.shiftKey) return;
      if (evento.key.toLowerCase() !== "b" || evento.defaultPrevented || !escritorio.matches) {
        return;
      }
      evento.preventDefault();
      setPreferencia((actual) => ({ ...actual, minimizado: !actual.minimizado }));
    }
    window.addEventListener("keydown", alPulsarTecla);
    return () => window.removeEventListener("keydown", alPulsarTecla);
  }, []);

  const ancho = minimizado ? ANCHO_MINIMIZADO : ANCHO_MENU[tamano];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-dvh bg-surface-soft lg:flex">
        <div
          id={ID_MENU}
          data-estado={minimizado ? "minimizado" : "expandido"}
          style={{ "--ancho-menu": ancho } as CSSProperties}
          className="hidden w-(--ancho-menu) shrink-0 border-r bg-background transition-[width] duration-200 ease-out motion-reduce:transition-none lg:block print:hidden"
        >
          <aside aria-label="Menú lateral" className="sticky top-0 h-dvh overflow-hidden">
            {/* Ancho final fijo: durante la transición el contenido no se reacomoda, solo se recorta. */}
            <div className="h-full w-[calc(var(--ancho-menu)-1px)]">
              <BarraLateralAdmin
                minimizado={minimizado}
                tamano={tamano}
                idMenu={ID_MENU}
                alAlternar={() =>
                  setPreferencia((actual) => ({ ...actual, minimizado: !actual.minimizado }))
                }
                alCambiarTamano={(nuevo) =>
                  setPreferencia((actual) => ({ ...actual, tamano: nuevo }))
                }
              />
            </div>
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {encabezado}
          {/* Tope de 120rem: hasta pantallas de 1920 px el contenido ocupa todo el ancho libre, así
              que minimizar o achicar el menú le da más espacio. Los formularios ya limitan su ancho. */}
          <main className="mx-auto w-full max-w-[120rem] flex-1 px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
