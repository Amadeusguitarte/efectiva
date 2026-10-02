"use client";

import { GripVertical } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as EventoTeclado,
  type PointerEvent as EventoPuntero,
  type ReactNode,
} from "react";

import { BarraLateralAdmin } from "@/components/admin/navegacion-admin";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ANCHO_MENU_MAXIMO,
  ANCHO_MENU_MINIMIZADO,
  ANCHO_MENU_MINIMO,
  ANCHO_MENU_POR_DEFECTO,
  COOKIE_MENU_ADMIN,
  DURACION_COOKIE_MENU,
  preferenciaTrasArrastre,
  serializarPreferenciaMenu,
  type PreferenciaMenu,
} from "@/lib/preferencias-menu";
import { cn } from "cn";

const ID_MENU = "menu-lateral-admin";

/** Mismo punto de corte que `lg:` de Tailwind: por debajo se usa el menú móvil (Sheet). */
const CONSULTA_ESCRITORIO = "(min-width: 64rem)";

/** Píxeles por pulsación de flecha en la pestaña de ajuste (con Mayús, el triple). */
const PASO_TECLADO = 16;

function guardarPreferencia(preferencia: PreferenciaMenu) {
  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_MENU_ADMIN}=${serializarPreferenciaMenu(preferencia)}; Path=/; Max-Age=${DURACION_COOKIE_MENU}; SameSite=Lax${seguro}`;
}

function anchoVisible({ minimizado, ancho }: PreferenciaMenu) {
  return minimizado ? ANCHO_MENU_MINIMIZADO : ancho;
}

type MarcoAdminProps = {
  /** Leída de la cookie en el servidor, para pintar el estado correcto desde el primer render. */
  preferenciaInicial: PreferenciaMenu;
  /** Barra superior del panel (menú móvil, notificaciones y menú de usuario). */
  encabezado: ReactNode;
  children: ReactNode;
};

/**
 * Estructura del panel: menú lateral y área de contenido. El menú se minimiza con su botón o
 * con Ctrl+B (Cmd+B), y su ancho se ajusta arrastrando la pestaña que hay en la mitad de su
 * borde derecho (también con las flechas del teclado; doble clic restablece el ancho). Si se
 * arrastra hasta casi cerrarlo, se minimiza.
 */
export function MarcoAdmin({ preferenciaInicial, encabezado, children }: MarcoAdminProps) {
  const [preferencia, setPreferencia] = useState(preferenciaInicial);
  // Ancho que marca el puntero mientras se arrastra la pestaña; null si no se arrastra.
  const [arrastre, setArrastre] = useState<number | null>(null);
  const inicioArrastre = useRef<{ x: number; ancho: number } | null>(null);
  const arrastrando = arrastre !== null;

  // Lo que se ve: durante el arrastre, el resultado que tendría soltar ahí.
  const vista = arrastrando ? preferenciaTrasArrastre(preferencia, arrastre) : preferencia;
  const minimizado = vista.minimizado;
  const ancho = anchoVisible(vista);

  // La cookie se escribe al terminar cada cambio, no en cada movimiento del arrastre.
  useEffect(() => {
    if (!arrastrando) guardarPreferencia(preferencia);
  }, [preferencia, arrastrando]);

  // Mientras se arrastra: cursor de ajuste en toda la página y sin selección de texto.
  useEffect(() => {
    if (!arrastrando) return;
    const { cursor, userSelect } = document.body.style;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }, [arrastrando]);

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

  function alternar() {
    setPreferencia((actual) => ({ ...actual, minimizado: !actual.minimizado }));
  }

  function empezarArrastre(evento: EventoPuntero<HTMLDivElement>) {
    if (evento.button !== 0) return;
    evento.preventDefault();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    const actual = anchoVisible(preferencia);
    inicioArrastre.current = { x: evento.clientX, ancho: actual };
    setArrastre(actual);
  }

  function moverArrastre(evento: EventoPuntero<HTMLDivElement>) {
    const inicio = inicioArrastre.current;
    if (!inicio) return;
    setArrastre(inicio.ancho + evento.clientX - inicio.x);
  }

  function terminarArrastre() {
    if (!inicioArrastre.current) return;
    inicioArrastre.current = null;
    if (arrastre !== null) setPreferencia((actual) => preferenciaTrasArrastre(actual, arrastre));
    setArrastre(null);
  }

  function ajustarConTeclado(evento: EventoTeclado<HTMLDivElement>) {
    const paso = evento.shiftKey ? PASO_TECLADO * 3 : PASO_TECLADO;
    const actual = anchoVisible(preferencia);
    let destino: number;
    switch (evento.key) {
      case "ArrowRight":
        // Minimizado, la flecha lo expande con el ancho que tenía.
        destino = preferencia.minimizado ? preferencia.ancho : actual + paso;
        break;
      case "ArrowLeft":
        if (preferencia.minimizado) return;
        // Desde el ancho mínimo, una flecha más a la izquierda minimiza el menú.
        destino =
          actual <= ANCHO_MENU_MINIMO
            ? ANCHO_MENU_MINIMIZADO
            : Math.max(ANCHO_MENU_MINIMO, actual - paso);
        break;
      case "Home":
        destino = ANCHO_MENU_MINIMO;
        break;
      case "End":
        destino = ANCHO_MENU_MAXIMO;
        break;
      case "Enter":
        evento.preventDefault();
        alternar();
        return;
      default:
        return;
    }
    evento.preventDefault();
    setPreferencia((previa) => preferenciaTrasArrastre(previa, destino));
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-dvh bg-surface-soft lg:flex">
        <div
          id={ID_MENU}
          data-estado={minimizado ? "minimizado" : "expandido"}
          style={{ "--ancho-menu": `${ancho}px` } as CSSProperties}
          className={cn(
            "relative z-30 hidden w-(--ancho-menu) shrink-0 border-r bg-background lg:block print:hidden",
            arrastrando
              ? "border-r-primary"
              : "transition-[width] duration-200 ease-out motion-reduce:transition-none",
          )}
        >
          <aside aria-label="Menú lateral" className="sticky top-0 h-dvh">
            <div className="h-full overflow-hidden">
              {/* Ancho final fijo: durante la transición el contenido no se reacomoda, solo se recorta. */}
              <div className="h-full w-[calc(var(--ancho-menu)-1px)]">
                <BarraLateralAdmin minimizado={minimizado} idMenu={ID_MENU} alAlternar={alternar} />
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  role="separator"
                  tabIndex={0}
                  aria-orientation="vertical"
                  aria-controls={ID_MENU}
                  aria-label="Ajustar el ancho del menú"
                  aria-valuemin={ANCHO_MENU_MINIMIZADO}
                  aria-valuemax={ANCHO_MENU_MAXIMO}
                  aria-valuenow={ancho}
                  aria-valuetext={minimizado ? "Menú minimizado" : `${ancho} píxeles`}
                  onPointerDown={empezarArrastre}
                  onPointerMove={moverArrastre}
                  onPointerUp={terminarArrastre}
                  onPointerCancel={terminarArrastre}
                  onLostPointerCapture={terminarArrastre}
                  onDoubleClick={() =>
                    setPreferencia({ minimizado: false, ancho: ANCHO_MENU_POR_DEFECTO })
                  }
                  onKeyDown={ajustarConTeclado}
                  className={cn(
                    "group absolute top-1/2 -right-2 flex h-12 w-4 -translate-y-1/2 cursor-col-resize touch-none items-center justify-center rounded-full border bg-background text-muted-foreground shadow-soft transition-colors outline-none",
                    "hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    arrastrando && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  <GripVertical className="size-3.5" aria-hidden />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Arrastra para ajustar el ancho · doble clic para restablecer
              </TooltipContent>
            </Tooltip>
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
