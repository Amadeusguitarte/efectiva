"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { analizarCaso, aplicarEtapaSugerida } from "@/app/admin/crm/acciones";
import { Button } from "@/components/ui/button";
import type { AnalisisIA } from "@/lib/crm/ia";
import { formatearFechaHora } from "@/lib/formato";

import { InsigniaPrioridad } from "./insignias";

type AnalisisCasoProps = {
  casoId: string;
  analisis: AnalisisIA | null;
  etapaActualId: string;
  iaActiva: boolean;
  hayMensajes: boolean;
};

/** Resultado del análisis de IA del caso y botón para volver a analizar. Solo clasifica. */
export function AnalisisCaso({
  casoId,
  analisis,
  etapaActualId,
  iaActiva,
  hayMensajes,
}: AnalisisCasoProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function ejecutar(accion: () => Promise<{ ok: boolean; mensaje?: string }>) {
    startTransition(async () => {
      const resultado = await accion();
      if (resultado.ok) toast.success(resultado.mensaje ?? "Listo.");
      else toast.error(resultado.mensaje ?? "No se pudo completar.");
      router.refresh();
    });
  }

  const sugiereCambio = analisis?.etapaSugeridaId && analisis.etapaSugeridaId !== etapaActualId;

  return (
    <div className="grid gap-4">
      {!iaActiva ? (
        <p className="text-sm text-muted-foreground">
          La IA no está configurada.{" "}
          <Link
            href="/admin/configuracion/ia"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Configúrala
          </Link>{" "}
          para obtener resumen, prioridad, etapa sugerida y próxima acción.
        </p>
      ) : null}

      {analisis ? (
        <div className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <InsigniaPrioridad prioridad={analisis.prioridad} />
            <span className="text-xs text-muted-foreground">
              {formatearFechaHora(analisis.analizadoAt)} · {analisis.modelo}
            </span>
          </div>
          <p className="text-foreground">{analisis.resumen}</p>
          {analisis.proximaAccion ? (
            <p>
              <span className="font-medium">Próxima acción sugerida:</span> {analisis.proximaAccion}
            </p>
          ) : null}
          {analisis.documentosPendientes.length > 0 ? (
            <div>
              <p className="font-medium">Documentos pendientes</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {analisis.documentosPendientes.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {analisis.datos.nombre || analisis.datos.documento || analisis.datos.ciudad ? (
            <p className="text-muted-foreground">
              Datos detectados:{" "}
              {[analisis.datos.nombre, analisis.datos.documento, analisis.datos.ciudad]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {sugiereCambio ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p>
                Etapa sugerida: <span className="font-medium">{analisis.etapaSugeridaNombre}</span>
              </p>
              <Button
                type="button"
                size="sm"
                disabled={pendiente}
                onClick={() => ejecutar(() => aplicarEtapaSugerida(casoId))}
              >
                Aplicar
                <ArrowRight />
              </Button>
            </div>
          ) : analisis.etapaSugeridaNombre ? (
            <p className="text-xs text-muted-foreground">
              La etapa actual coincide con la sugerida ({analisis.etapaSugeridaNombre}).
            </p>
          ) : null}
        </div>
      ) : iaActiva ? (
        <p className="text-sm text-muted-foreground">Todavía no se ha analizado este caso.</p>
      ) : null}

      <div>
        <Button
          type="button"
          variant={analisis ? "outline" : "default"}
          size="sm"
          disabled={pendiente || !iaActiva || !hayMensajes}
          title={!hayMensajes ? "Se necesitan mensajes para analizar" : undefined}
          onClick={() => ejecutar(() => analizarCaso(casoId))}
        >
          {pendiente ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {pendiente ? "Analizando…" : analisis ? "Volver a analizar" : "Analizar con IA"}
        </Button>
      </div>
    </div>
  );
}
