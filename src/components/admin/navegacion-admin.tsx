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
import { useState, type ReactNode } from "react";

import isotipo from "@/assets/images/isotipo.png";
import { Logo } from "@/components/marca/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
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

function Enlaces({
  alNavegar,
  minimizado = false,
}: {
  alNavegar?: () => void;
  minimizado?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel" className={cn("flex flex-1 flex-col", minimizado ? "gap-2" : "gap-6")}>
      {GRUPOS.map((grupo, indice) => (
        <div key={grupo.titulo ?? indice} className="grid gap-1">
          {grupo.titulo ? (
            <p className={minimizado ? "sr-only" : ESTILO_TITULO_GRUPO}>{grupo.titulo}</p>
          ) : null}
          {grupo.titulo && minimizado ? <SeparadorMinimizado /> : null}
          <ul className={cn("grid gap-1", minimizado && "justify-items-center")}>
            {grupo.items.map(({ nombre, href, icono: Icono, activo }) => {
              const esActivo = activo ? activo(pathname) : pathname.startsWith(href);
              return (
                <li key={href}>
                  <TooltipMenu minimizado={minimizado} contenido={nombre}>
                    <Link
                      href={href}
                      onClick={alNavegar}
                      aria-current={esActivo ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
                        ESTILO_FOCO,
                        minimizado && "w-9 justify-center px-0",
                        esActivo
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icono className="size-4 shrink-0" aria-hidden />
                      <span className={cn(minimizado ? "sr-only" : "truncate")}>{nombre}</span>
                    </Link>
                  </TooltipMenu>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="grid gap-1">
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
  alAlternar: () => void;
};

export function BarraLateralAdmin({ minimizado, idMenu, alAlternar }: BarraLateralAdminProps) {
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
        <Enlaces minimizado={minimizado} />
      </div>
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
          <TooltipProvider>
            <Enlaces alNavegar={() => setAbierto(false)} />
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
