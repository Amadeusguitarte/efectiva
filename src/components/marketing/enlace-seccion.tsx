"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import type { Seccion } from "@/config/navegacion";

type EnlaceSeccionProps = Omit<ComponentProps<"a">, "href"> & { seccion: Seccion };

/**
 * Enlace a una sección de la portada. En la portada usa un ancla nativa (`#agenda`), que desplaza
 * con suavidad y conserva los parámetros de la URL (UTM de campañas); desde otras páginas lleva a
 * `/#agenda`.
 */
export function EnlaceSeccion({ seccion, ...props }: EnlaceSeccionProps) {
  const pathname = usePathname();
  return <a href={pathname === "/" ? `#${seccion}` : `/#${seccion}`} {...props} />;
}
