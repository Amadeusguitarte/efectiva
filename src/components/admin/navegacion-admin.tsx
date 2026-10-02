"use client";

import {
  CalendarClock,
  CheckSquare,
  ChevronDown,
  Columns3,
  ExternalLink,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import isotipo from "@/assets/images/isotipo.png";
import { Logo } from "@/components/marca/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { cn } from "cn";

/** Contadores en rojo del menú (como en Kommo): mensajes sin responder y tareas vencidas. */
export type ContadoresMenu = {
  chat: number;
  correo: number;
  tareas: number;
};

type ItemNavegacion = {
  nombre: string;
  href: Route;
  icono: LucideIcon;
  /** Decide si el enlace está activo; por defecto, cuando la ruta empieza por `href`. */
  activo?: (pathname: string) => boolean;
  contador?: keyof ContadoresMenu;
};

type GrupoNavegacion = {
  /** Título pequeño en mayúsculas sobre el grupo (con separación). */
  titulo?: string;
  /** Grupo desplegable con un elemento padre, como «Comunicaciones» en Kommo. */
  plegable?: { nombre: string; icono: LucideIcon };
  items: ItemNavegacion[];
};

const GRUPOS: GrupoNavegacion[] = [
  {
    items: [
      { nombre: "Resumen", href: "/admin", icono: LayoutDashboard, activo: (p) => p === "/admin" },
      { nombre: "Clientes", href: "/admin/clientes", icono: Users },
    ],
  },
  {
    plegable: { nombre: "Comunicaciones", icono: MessagesSquare },
    items: [
      {
        nombre: "Inbox de chat",
        href: "/admin/crm/whatsapp",
        icono: MessageCircle,
        contador: "chat",
      },
      { nombre: "Inbox de correo", href: "/admin/crm/correo", icono: Mail, contador: "correo" },
    ],
  },
  {
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
      { nombre: "Tareas", href: "/admin/crm/tareas", icono: CheckSquare, contador: "tareas" },
    ],
  },
  {
    titulo: "Sistema",
    items: [{ nombre: "Configuración", href: "/admin/configuracion", icono: Settings }],
  },
];

const PROXIMAMENTE = [{ nombre: "Programación de pagos", icono: CalendarClock }];

const ESTILO_TITULO_GRUPO =
  "px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase";

const ESTILO_FOCO = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Línea fina que sustituye a los títulos de grupo cuando el menú está minimizado. */
function SeparadorMinimizado() {
  return <div aria-hidden className="mx-auto mb-1 h-px w-6 bg-border" />;
}

/**
 * Con el menú minimizado, el nombre de cada icono aparece en un tooltip a la derecha. Expandido
 * (o en el menú móvil) el nombre ya se ve: el tooltip queda cerrado de forma controlada, sin
 * contenido ni `aria-describedby`. Siempre está montado para que el enlace no cambie de lugar en
 * el árbol y conserve el foco al minimizar o expandir; al alternar se cierra.
 */
function TooltipMenu({
  minimizado,
  contenido,
  children,
}: {
  minimizado: boolean;
  contenido: ReactNode;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [minimizadoAntes, setMinimizadoAntes] = useState(minimizado);
  if (minimizado !== minimizadoAntes) {
    setMinimizadoAntes(minimizado);
    setAbierto(false);
  }
  return (
    <Tooltip open={minimizado && abierto} onOpenChange={(abrir) => setAbierto(minimizado && abrir)}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {minimizado ? (
        <TooltipContent side="right" sideOffset={10}>
          {contenido}
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

/** Contador rojo de Kommo; con el menú minimizado, un globo sobre el icono. */
function Contador({ valor, minimizado }: { valor: number; minimizado: boolean }) {
  if (valor <= 0) return null;
  const texto = valor > 99 ? "99+" : String(valor);
  return (
    <span
      className={cn(
        "rounded-full bg-crm-contador font-semibold text-white tabular-nums",
        minimizado
          ? "absolute -top-1 -right-1 min-w-4 px-1 text-center text-[10px] leading-4"
          : "ml-auto min-w-6 px-1.5 text-center text-[11px] leading-5",
      )}
    >
      {texto}
    </span>
  );
}

function EnlaceMenu({
  item,
  pathname,
  minimizado,
  contadores,
  alNavegar,
  hijo = false,
}: {
  item: ItemNavegacion;
  pathname: string;
  minimizado: boolean;
  contadores: ContadoresMenu;
  alNavegar?: () => void;
  /** Elemento dentro de un grupo desplegable: va con sangría, como en Kommo. */
  hijo?: boolean;
}) {
  const { nombre, href, icono: Icono, activo, contador } = item;
  const esActivo = activo ? activo(pathname) : pathname.startsWith(href);
  const valor = contador ? contadores[contador] : 0;
  return (
    <TooltipMenu minimizado={minimizado} contenido={valor > 0 ? `${nombre} (${valor})` : nombre}>
      <Link
        href={href}
        onClick={alNavegar}
        aria-current={esActivo ? "page" : undefined}
        className={cn(
          "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm whitespace-nowrap transition-colors",
          ESTILO_FOCO,
          minimizado && "w-9 justify-center px-0",
          hijo && !minimizado && "pl-10",
          esActivo
            ? "bg-crm-menu-activo font-semibold text-crm-menu-activo-texto"
            : "text-crm-texto hover:bg-crm-feed",
        )}
      >
        {hijo && !minimizado ? null : <Icono className="size-4 shrink-0" aria-hidden />}
        <span className={cn(minimizado ? "sr-only" : "truncate")}>{nombre}</span>
        {valor > 0 ? <span className="sr-only">, {valor} pendientes</span> : null}
        <Contador valor={valor} minimizado={minimizado} />
      </Link>
    </TooltipMenu>
  );
}

/** Grupo desplegable («Comunicaciones»): abierto por defecto y siempre que una hoja esté activa. */
function GrupoPlegable({
  grupo,
  pathname,
  minimizado,
  contadores,
  alNavegar,
}: {
  grupo: GrupoNavegacion & { plegable: NonNullable<GrupoNavegacion["plegable"]> };
  pathname: string;
  minimizado: boolean;
  contadores: ContadoresMenu;
  alNavegar?: () => void;
}) {
  const [abierto, setAbierto] = useState(true);
  const idLista = useId();
  const { nombre, icono: Icono } = grupo.plegable;
  const pendientes = grupo.items.reduce(
    (total, item) => total + (item.contador ? contadores[item.contador] : 0),
    0,
  );

  // Minimizado no hay padre: los iconos de las hojas quedan a la vista.
  if (minimizado) {
    return (
      <ul className="grid justify-items-center gap-1">
        {grupo.items.map((item) => (
          <li key={item.href}>
            <EnlaceMenu
              item={item}
              pathname={pathname}
              minimizado
              contadores={contadores}
              alNavegar={alNavegar}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={idLista}
        className={cn(
          "flex h-9 items-center gap-3 rounded-md px-3 text-sm whitespace-nowrap text-crm-texto transition-colors hover:bg-crm-feed",
          ESTILO_FOCO,
        )}
      >
        <Icono className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{nombre}</span>
        {!abierto && pendientes > 0 ? <Contador valor={pendientes} minimizado={false} /> : null}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-crm-hora transition-transform",
            !abierto || pendientes === 0 ? "ml-auto" : "",
            abierto && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <ul id={idLista} hidden={!abierto} className="grid gap-1">
        {grupo.items.map((item) => (
          <li key={item.href}>
            <EnlaceMenu
              item={item}
              pathname={pathname}
              minimizado={false}
              contadores={contadores}
              alNavegar={alNavegar}
              hijo
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Enlaces({
  alNavegar,
  minimizado = false,
  contadores,
}: {
  alNavegar?: () => void;
  minimizado?: boolean;
  contadores: ContadoresMenu;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel" className="flex flex-1 flex-col gap-1">
      {GRUPOS.map((grupo, indice) => (
        <div
          key={grupo.titulo ?? grupo.plegable?.nombre ?? indice}
          className={cn("grid gap-1", grupo.titulo && (minimizado ? "mt-2" : "mt-5"))}
        >
          {grupo.titulo ? (
            <p className={minimizado ? "sr-only" : ESTILO_TITULO_GRUPO}>{grupo.titulo}</p>
          ) : null}
          {grupo.titulo && minimizado ? <SeparadorMinimizado /> : null}
          {grupo.plegable ? (
            <GrupoPlegable
              grupo={{ ...grupo, plegable: grupo.plegable }}
              pathname={pathname}
              minimizado={minimizado}
              contadores={contadores}
              alNavegar={alNavegar}
            />
          ) : (
            <ul className={cn("grid gap-1", minimizado && "justify-items-center")}>
              {grupo.items.map((item) => (
                <li key={item.href}>
                  <EnlaceMenu
                    item={item}
                    pathname={pathname}
                    minimizado={minimizado}
                    contadores={contadores}
                    alNavegar={alNavegar}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div className={cn("grid gap-1", minimizado ? "mt-2" : "mt-5")}>
        <p className={minimizado ? "sr-only" : ESTILO_TITULO_GRUPO}>Próximamente</p>
        {minimizado ? <SeparadorMinimizado /> : null}
        <ul className={cn("grid gap-1", minimizado && "justify-items-center")}>
          {PROXIMAMENTE.map(({ nombre, icono: Icono }) => (
            <li key={nombre}>
              <TooltipMenu minimizado={minimizado} contenido={`${nombre} · Próximamente`}>
                {/* Solo con el menú minimizado recibe foco, para poder leer su nombre en el tooltip. */}
                <span
                  tabIndex={minimizado ? 0 : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60",
                    minimizado && cn("size-9 justify-center px-0 py-0", ESTILO_FOCO),
                  )}
                >
                  <Icono className="size-4 shrink-0" aria-hidden />
                  {minimizado ? (
                    <span className="sr-only">{nombre} (próximamente, fase 3)</span>
                  ) : (
                    <>
                      <span className="flex-1">{nombre}</span>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Fase 3
                      </Badge>
                    </>
                  )}
                </span>
              </TooltipMenu>
            </li>
          ))}
        </ul>
      </div>

      <TooltipMenu minimizado={minimizado} contenido="Ver sitio web">
        <Link
          href="/"
          target="_blank"
          className={cn(
            "mt-auto flex h-9 items-center gap-3 rounded-lg px-3 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            ESTILO_FOCO,
            minimizado && "w-9 justify-center self-center px-0",
          )}
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          <span className={minimizado ? "sr-only" : undefined}>Ver sitio web</span>
        </Link>
      </TooltipMenu>
    </nav>
  );
}

/**
 * Logo del menú: el mismo enlace en ambos estados (minimizado solo se ve el isotipo), para que
 * conserve el foco al alternar. Reproduce el `Logo` oscuro de la marca.
 */
function LogoMenu({ minimizado }: { minimizado: boolean }) {
  return (
    <Link
      href="/admin"
      aria-label={`${siteConfig.name}, ir al inicio`}
      className={cn("inline-flex min-w-0 shrink items-center gap-2.5 rounded-md", ESTILO_FOCO)}
    >
      <Image src={isotipo} alt="" className="h-8 w-auto shrink-0" sizes="40px" />
      <span
        className={cn(
          "text-[0.95rem] leading-none font-extrabold tracking-tight text-navy uppercase",
          minimizado && "hidden",
        )}
      >
        Insolvencia <span className="text-primary">Efectiva</span>
      </span>
    </Link>
  );
}

type BarraLateralAdminProps = {
  minimizado: boolean;
  /** Id del contenedor del menú, para `aria-controls` del botón de minimizar. */
  idMenu: string;
  contadores: ContadoresMenu;
  alAlternar: () => void;
};

export function BarraLateralAdmin({
  minimizado,
  idMenu,
  alAlternar,
  contadores,
}: BarraLateralAdminProps) {
  const accion = minimizado ? "Expandir menú" : "Minimizar menú";

  return (
    <div className="flex h-full flex-col">
      {/*
       * El botón conserva su posición en el árbol en ambos estados (solo cambia el diseño del
       * contenedor) para no perder el foco del teclado al minimizar o expandir.
       */}
      <div
        className={cn(
          "flex shrink-0",
          minimizado
            ? "flex-col items-center gap-2"
            : "h-16 items-center justify-between gap-2 border-b pr-3 pl-4",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            minimizado && "h-16 w-full justify-center border-b",
          )}
        >
          <LogoMenu minimizado={minimizado} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={minimizado ? "icon" : "icon-sm"}
              onClick={alAlternar}
              aria-label={accion}
              aria-expanded={!minimizado}
              aria-controls={idMenu}
              aria-keyshortcuts="Control+B Meta+B"
              className="text-muted-foreground"
            >
              {minimizado ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {accion}{" "}
            <kbd className="ml-1 rounded border border-background/30 px-1 font-sans text-[10px] opacity-80">
              Ctrl+B
            </kbd>
          </TooltipContent>
        </Tooltip>
        {minimizado ? <SeparadorMinimizado /> : null}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3",
          // Minimizado, en pantallas bajas la lista se desplaza sin barra visible: la barra
          // ocuparía casi un cuarto de la columna y descentraría los iconos.
          minimizado ? "[scrollbar-width:none] pt-1 pb-3 [&::-webkit-scrollbar]:hidden" : "py-5",
        )}
      >
        <Enlaces minimizado={minimizado} contadores={contadores} />
      </div>
    </div>
  );
}

export function MenuMovilAdmin({ contadores }: { contadores: ContadoresMenu }) {
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
          <TooltipProvider>
            <Enlaces alNavegar={() => setAbierto(false)} contadores={contadores} />
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
