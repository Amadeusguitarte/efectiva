"use client";

import { Check, Copy, Printer } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** Acciones de la vista "Datos para la propuesta": copiar el texto plano e imprimir o guardar PDF. */
export function BotonesDatosPropuesta({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const temporizador = window.setTimeout(() => setCopiado(false), 2500);
    return () => window.clearTimeout(temporizador);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setError(false);
      setCopiado(true);
    } catch {
      setError(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={copiar} aria-live="polite">
        {copiado ? <Check /> : <Copy />}
        {copiado ? "Copiado" : "Copiar como texto"}
      </Button>
      <Button type="button" onClick={() => window.print()}>
        <Printer />
        Imprimir o guardar PDF
      </Button>
      {error ? (
        <span role="alert" className="text-sm text-destructive">
          No pudimos copiar; selecciona el texto manualmente.
        </span>
      ) : null}
    </div>
  );
}
