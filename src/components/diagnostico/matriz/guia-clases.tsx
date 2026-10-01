"use client";

import { BookOpen, ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CLASES } from "@/lib/diagnostico/catalogos";
import { cn } from "cn";

import { FONDO_CLASE } from "./colores-clase";

const FUENTES = [
  {
    fuente: "Ley 2445 de 2025",
    url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_2445_2025.html",
  },
  {
    fuente: "Código Civil – prelación de créditos",
    url: "https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr077.html",
  },
  {
    fuente: "Código General del Proceso – insolvencia",
    url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html",
  },
];

const APARTADOS = [
  { campo: "incluye", titulo: "Qué incluye" },
  { campo: "ejemplos", titulo: "Ejemplos para el diagnóstico" },
  { campo: "clave", titulo: "Clave de clasificación" },
  { campo: "baseLegal", titulo: "Base legal" },
  { campo: "tratamiento", titulo: "Tratamiento" },
] as const;

/**
 * Hoja «Guía 5 Clases» del Excel en un panel lateral: la prelación de créditos para clasificar
 * cada obligación sin salir de la matriz.
 */
export function GuiaClases() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <BookOpen aria-hidden />
          Guía de clases
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="relative gap-1 bg-hoja-titulo px-5 py-4 pr-14 text-white">
          <SheetTitle className="text-lg text-white">Guía de prelación de créditos</SheetTitle>
          <SheetDescription className="text-white/75">
            Ley 2445 de 2025 y Código Civil. Úsala para asignar la clase de cada obligación.
          </SheetDescription>
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-3.5 right-3.5 text-white hover:bg-white/15 hover:text-white"
              aria-label="Cerrar la guía"
            >
              <X aria-hidden />
            </Button>
          </SheetClose>
        </SheetHeader>

        {/* El desplazamiento va en un bloque aparte: en una cuadrícula de altura fija las tarjetas
            con overflow-hidden se encogerían en lugar de desbordar. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 p-5">
            {CLASES.filter((c) => c.valor !== "por_verificar").map((clase) => (
              <article
                key={clase.valor}
                aria-labelledby={`guia-${clase.valor}`}
                className="overflow-hidden rounded-lg border border-hoja-cuadricula"
              >
                <h3
                  id={`guia-${clase.valor}`}
                  className={cn(
                    "px-4 py-2 text-sm font-bold tracking-wide text-hoja-texto",
                    FONDO_CLASE[clase.valor],
                  )}
                >
                  {clase.etiquetaPropuesta}
                </h3>
                <dl className="grid gap-3 px-4 py-3 text-sm">
                  {APARTADOS.map(({ campo, titulo }) => (
                    <div key={campo} className="grid gap-0.5">
                      <dt className="text-[11px] font-semibold tracking-wide text-hoja-encabezado uppercase">
                        {titulo}
                      </dt>
                      <dd className="leading-relaxed text-foreground">{clase[campo]}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}

            <section aria-labelledby="guia-fuentes" className="grid gap-2">
              <h3 id="guia-fuentes" className="text-sm font-semibold">
                Fuentes
              </h3>
              <ul className="grid gap-1.5 text-sm">
                {FUENTES.map((f) => (
                  <li key={f.url}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-hoja-vineta underline-offset-2 hover:underline"
                    >
                      {f.fuente}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
