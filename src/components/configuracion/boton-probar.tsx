"use client";

import { Loader2, PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { EstadoAccion } from "@/lib/acciones";

/** Ejecuta una prueba de conexión (IA o correo) y muestra el resultado. */
export function BotonProbar({
  accion,
  texto = "Probar conexión",
}: {
  accion: () => Promise<EstadoAccion>;
  texto?: string;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pendiente}
      onClick={() =>
        startTransition(async () => {
          const resultado = await accion();
          if (resultado.ok) toast.success(resultado.mensaje ?? "Conexión correcta.");
          else toast.error(resultado.mensaje ?? "La prueba falló.", { duration: 8000 });
          router.refresh();
        })
      }
    >
      {pendiente ? <Loader2 className="animate-spin" /> : <PlugZap />}
      {pendiente ? "Probando…" : texto}
    </Button>
  );
}
