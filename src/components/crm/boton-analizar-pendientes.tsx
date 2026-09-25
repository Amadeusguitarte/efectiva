"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { analizarCasosPendientes } from "@/app/admin/crm/acciones";
import { Button } from "@/components/ui/button";

/** Analiza con IA los casos que tienen mensajes nuevos desde su último análisis. */
export function BotonAnalizarPendientes({ iaActiva }: { iaActiva: boolean }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pendiente || !iaActiva}
      title={iaActiva ? undefined : "Activa la IA en Configuración → IA"}
      onClick={() =>
        startTransition(async () => {
          const resultado = await analizarCasosPendientes();
          if (resultado.ok) toast.success(resultado.mensaje ?? "Listo.");
          else toast.error(resultado.mensaje ?? "No se pudo analizar.");
          router.refresh();
        })
      }
    >
      {pendiente ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {pendiente ? "Analizando…" : "Analizar con IA"}
    </Button>
  );
}
