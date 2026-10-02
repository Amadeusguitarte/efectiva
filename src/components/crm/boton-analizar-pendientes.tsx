"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { analizarCasosPendientes } from "@/app/admin/crm/acciones";
import { cn } from "cn";

/**
 * Analiza con IA los casos que tienen mensajes nuevos desde su último análisis. Botón discreto
 * de la barra del pipeline: en pantallas angostas solo muestra el icono.
 */
export function BotonAnalizarPendientes({
  iaActiva,
  className,
}: {
  iaActiva: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const texto = pendiente ? "Analizando…" : "Analizar pendientes con IA";

  return (
    <button
      type="button"
      disabled={pendiente || !iaActiva}
      title={iaActiva ? texto : "Activa la IA en Configuración → IA"}
      aria-label={texto}
      onClick={() =>
        startTransition(async () => {
          const resultado = await analizarCasosPendientes();
          if (resultado.ok) toast.success(resultado.mensaje ?? "Listo.");
          else toast.error(resultado.mensaje ?? "No se pudo analizar.");
          router.refresh();
        })
      }
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[3px] px-2 text-sm text-crm-texto-suave transition-colors hover:bg-crm-feed hover:text-crm-texto focus-visible:ring-2 focus-visible:ring-crm-seleccion focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {pendiente ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="size-4" aria-hidden />
      )}
      <span className="hidden xl:inline">{texto}</span>
    </button>
  );
}
