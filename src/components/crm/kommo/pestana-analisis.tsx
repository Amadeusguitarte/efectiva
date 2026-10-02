"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { analizarCaso } from "@/app/admin/crm/acciones";
import { INFO_PRIORIDAD } from "@/lib/crm/catalogos";
import type { AnalisisIA } from "@/lib/crm/ia";
import { fechaHoraFeed } from "@/lib/crm/linea-tiempo";
import { cn } from "cn";

import { BOTON_CRM, BOTON_CRM_SECUNDARIO, FilaDato } from "./piezas";

/**
 * Pestaña «Análisis IA» del panel: resumen, prioridad, etapa sugerida, próxima acción y
 * documentos pendientes. La IA solo analiza y clasifica: nunca escribe al contacto.
 */
export function PestanaAnalisis({
  casoId,
  analisis,
  etapaActualId,
  iaActiva,
  hayMensajes,
  ahora,
  moviendoEtapa,
  alAplicarEtapa,
}: {
  casoId: string;
  analisis: AnalisisIA | null;
  etapaActualId: string;
  iaActiva: boolean;
  hayMensajes: boolean;
  ahora: string;
  moviendoEtapa: boolean;
  /** Pide mover el caso a la etapa sugerida (el panel confirma si envía correo automático). */
  alAplicarEtapa: (etapaId: string) => void;
}) {
  const [analizando, startTransition] = useTransition();

  function analizar() {
    startTransition(async () => {
      const resultado = await analizarCaso(casoId);
      if (resultado.ok) toast.success(resultado.mensaje ?? "Análisis listo.");
      else toast.error(resultado.mensaje ?? "No se pudo analizar.");
    });
  }

  const sugerida =
    analisis?.etapaSugeridaId && analisis.etapaSugeridaId !== etapaActualId
      ? { id: analisis.etapaSugeridaId, nombre: analisis.etapaSugeridaNombre }
      : null;

  return (
    <div className="grid gap-4 px-5 py-4 text-[15px]">
      {!iaActiva ? (
        <p className="text-crm-texto-suave">
          La IA no está configurada.{" "}
          <Link
            href="/admin/configuracion/ia"
            className="text-crm-seleccion underline-offset-2 hover:underline"
          >
            Configúrala
          </Link>{" "}
          para obtener resumen, prioridad, etapa sugerida y próxima acción.
        </p>
      ) : null}

      {analisis ? (
        <>
          <dl>
            <FilaDato etiqueta="Prioridad">
              <span
                className={cn(
                  "font-bold",
                  analisis.prioridad === "alta" && "text-crm-contador",
                  analisis.prioridad === "media" && "text-warning",
                )}
              >
                {INFO_PRIORIDAD[analisis.prioridad].etiqueta.replace("Prioridad ", "")}
              </span>
            </FilaDato>
            <FilaDato etiqueta="Analizado">
              <span className="text-crm-texto-suave">
                {fechaHoraFeed(analisis.analizadoAt, ahora)} · {analisis.modelo}
              </span>
            </FilaDato>
            {analisis.etapaSugeridaNombre ? (
              <FilaDato etiqueta="Etapa sugerida">{analisis.etapaSugeridaNombre}</FilaDato>
            ) : null}
          </dl>

          <div>
            <p className="mb-1 text-crm-hora">Resumen</p>
            <p className="leading-snug text-crm-texto">{analisis.resumen}</p>
          </div>

          {analisis.proximaAccion ? (
            <div>
              <p className="mb-1 text-crm-hora">Próxima acción sugerida</p>
              <p className="leading-snug text-crm-texto">{analisis.proximaAccion}</p>
            </div>
          ) : null}

          {analisis.documentosPendientes.length > 0 ? (
            <div>
              <p className="mb-1 text-crm-hora">Documentos pendientes</p>
              <ul className="list-disc pl-5 leading-snug text-crm-texto">
                {analisis.documentosPendientes.map((documento) => (
                  <li key={documento}>{documento}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {analisis.datos.nombre || analisis.datos.documento || analisis.datos.ciudad ? (
            <div>
              <p className="mb-1 text-crm-hora">Datos detectados</p>
              <p className="text-crm-texto">
                {[analisis.datos.nombre, analisis.datos.documento, analisis.datos.ciudad]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) : null}

          {sugerida ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-crm-seleccion-suave px-3 py-2.5">
              <p className="text-sm text-crm-texto">
                Sugiere pasar a <span className="font-bold">{sugerida.nombre}</span>
              </p>
              <button
                type="button"
                className={BOTON_CRM}
                disabled={moviendoEtapa}
                onClick={() => alAplicarEtapa(sugerida.id)}
              >
                Aplicar
                <ArrowRight />
              </button>
            </div>
          ) : null}
        </>
      ) : iaActiva ? (
        <p className="text-crm-texto-suave">Todavía no se ha analizado este caso.</p>
      ) : null}

      <div>
        <button
          type="button"
          className={analisis ? BOTON_CRM_SECUNDARIO : BOTON_CRM}
          disabled={analizando || !iaActiva || !hayMensajes}
          title={!hayMensajes ? "Se necesitan mensajes para analizar" : undefined}
          onClick={analizar}
        >
          {analizando ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {analizando ? "Analizando…" : analisis ? "Volver a analizar" : "Analizar con IA"}
        </button>
        <p className="mt-2 text-xs text-crm-hora">
          La IA resume y clasifica; nunca responde a los contactos.
        </p>
      </div>
    </div>
  );
}
