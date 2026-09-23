"use client";

import { RotateCcw } from "lucide-react";
import { useActionState, useState } from "react";

import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { SelectNativo } from "@/components/formularios/select-nativo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import {
  CAMPOS_REDACCION,
  INFO_TRATAMIENTO,
  TRATAMIENTOS,
  esTextoSugerido,
  type BorradorPropuesta,
  type CampoRedaccion,
  type RedaccionPropuesta,
  type Tratamiento,
} from "@/lib/propuestas/contenido";
import { TITULOS_SECCIONES } from "@/lib/propuestas/textos-fijos";

const NOMBRE_CAMPO: Record<CampoRedaccion, string> = {
  situacionEconomica: "situacion_economica",
  situacionLegal: "situacion_legal",
  recomendacion: "recomendacion",
  honorarios: "honorarios",
};

const AYUDA: Record<CampoRedaccion, string> = {
  situacionEconomica:
    "Va antes de la tabla de acreencias. El pasivo total, la tabla y el análisis de mora y elegibilidad se agregan solos.",
  situacionLegal:
    "El borrador recoge las obligaciones por tipo de garantía y, tal como se registraron en la matriz, las observaciones jurídicas, la situación y el objetivo. Redáctalo pensando en el cliente.",
  recomendacion:
    "Depende del tipo de servicio. Después de este texto va siempre el párrafo fijo sobre la designación de la abogada como liquidadora.",
  honorarios:
    "Las cifras vienen de la matriz. Agrega aquí acuerdos particulares, por ejemplo cómo se hará el primer pago.",
};

const NUMERO_SECCION: Record<CampoRedaccion, number> = {
  situacionEconomica: 1,
  situacionLegal: 2,
  recomendacion: 3,
  honorarios: 4,
};

type FormularioRedaccionProps = {
  accion: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  redaccion: RedaccionPropuesta;
  /** Borrador automático para cada tratamiento (cambia "El señor" / "La señora"). */
  borradores: Record<Tratamiento, BorradorPropuesta>;
};

function esTratamiento(valor: string): valor is Tratamiento {
  return (TRATAMIENTOS as readonly string[]).includes(valor);
}

/**
 * Textos de los puntos 1 a 4 de la propuesta. Cada campo parte del borrador automático; el equipo
 * lo ajusta y puede volver al texto sugerido en cualquier momento.
 */
export function FormularioRedaccion({ accion, redaccion, borradores }: FormularioRedaccionProps) {
  const [estado, enviar] = useActionState(accion, ESTADO_INICIAL);
  const [tratamiento, setTratamiento] = useState<Tratamiento>(redaccion.tratamiento);
  const [textos, setTextos] = useState<Record<CampoRedaccion, string>>(
    () =>
      Object.fromEntries(
        CAMPOS_REDACCION.map((campo) => [
          campo,
          redaccion[campo] ?? borradores[redaccion.tratamiento][campo],
        ]),
      ) as Record<CampoRedaccion, string>,
  );

  const borrador = borradores[tratamiento];

  function cambiarTratamiento(nuevo: Tratamiento) {
    // Los textos que siguen siendo el sugerido se actualizan al nuevo tratamiento.
    setTextos((actuales) => {
      const siguientes = { ...actuales };
      for (const campo of CAMPOS_REDACCION) {
        if (esTextoSugerido(actuales[campo], borradores[tratamiento][campo])) {
          siguientes[campo] = borradores[nuevo][campo];
        }
      }
      return siguientes;
    });
    setTratamiento(nuevo);
  }

  return (
    <form action={enviar} className="grid gap-6" noValidate>
      <MensajeFormulario estado={estado} />

      <Campo
        etiqueta="Tratamiento"
        errores={estado.errores?.tratamiento}
        ayuda="Encabeza la carta y se usa en la redacción (El señor / La señora)."
        className="max-w-xs"
      >
        {(control) => (
          <SelectNativo
            {...control}
            name="tratamiento"
            value={tratamiento}
            onChange={(evento) => {
              if (esTratamiento(evento.target.value)) cambiarTratamiento(evento.target.value);
            }}
          >
            {TRATAMIENTOS.map((valor) => (
              <option key={valor} value={valor}>
                {INFO_TRATAMIENTO[valor].titulo}
              </option>
            ))}
          </SelectNativo>
        )}
      </Campo>

      {CAMPOS_REDACCION.map((campo) => {
        const sugerido = esTextoSugerido(textos[campo], borrador[campo]);
        return (
          <div key={campo} className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant={sugerido ? "secondary" : "default"}>
                {sugerido ? "Texto sugerido" : "Texto editado"}
              </Badge>
              {!sugerido ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextos((t) => ({ ...t, [campo]: borrador[campo] }))}
                >
                  <RotateCcw />
                  Volver al texto sugerido
                </Button>
              ) : null}
            </div>
            <Campo
              etiqueta={`${NUMERO_SECCION[campo]}. ${TITULOS_SECCIONES[campo]}`}
              errores={estado.errores?.[NOMBRE_CAMPO[campo]]}
              ayuda={AYUDA[campo]}
            >
              {(control) => (
                <Textarea
                  {...control}
                  name={NOMBRE_CAMPO[campo]}
                  rows={campo === "situacionEconomica" ? 5 : 9}
                  maxLength={8000}
                  value={textos[campo]}
                  onChange={(evento) => setTextos((t) => ({ ...t, [campo]: evento.target.value }))}
                  className="leading-relaxed"
                />
              )}
            </Campo>
          </div>
        );
      })}

      <div className="flex justify-end">
        <BotonEnviar textoPendiente="Guardando…">Guardar redacción</BotonEnviar>
      </div>
    </form>
  );
}
