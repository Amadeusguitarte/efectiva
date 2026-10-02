"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Vuelve a pedir los datos de la página cada pocos segundos mientras la pestaña está visible, para
 * que entren los mensajes nuevos sin recargar (inbox y ficha del caso). No toca el estado de los
 * componentes: lo escrito en el compositor se conserva.
 */
export function ActualizacionPeriodica({ segundos = 8 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);
    return () => window.clearInterval(intervalo);
  }, [router, segundos]);
  return null;
}
