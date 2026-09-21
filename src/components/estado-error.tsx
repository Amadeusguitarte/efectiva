"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type EstadoErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** Contenido para los archivos error.tsx; nunca muestra detalles técnicos al usuario. */
export function EstadoError({ error, retry }: EstadoErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-danger-soft">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
        <p className="max-w-md text-muted-foreground">
          Tuvimos un problema al cargar esta página. Inténtalo de nuevo en unos segundos.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">Código de referencia: {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={() => retry()}>Reintentar</Button>
    </div>
  );
}
