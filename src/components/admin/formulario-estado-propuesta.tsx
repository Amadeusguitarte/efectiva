"use client";

import { useActionState, useState } from "react";

import { actualizarEstadoPropuesta } from "@/app/admin/clientes/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL } from "@/lib/acciones";
import {
  ESTADOS_PROPUESTA,
  INFO_ESTADO,
  esEstadoPropuesta,
  type EstadoPropuesta,
} from "@/lib/propuestas/estados";

type FormularioEstadoPropuestaProps = {
  propuestaId: string;
  estadoActual: EstadoPropuesta;
  mensajeActual: string | null;
  tieneDocumento: boolean;
};

export function FormularioEstadoPropuesta({
  propuestaId,
  estadoActual,
  mensajeActual,
  tieneDocumento,
}: FormularioEstadoPropuestaProps) {
  const [resultado, accion] = useActionState(actualizarEstadoPropuesta, ESTADO_INICIAL);
  const estadoEnviado = resultado.valores?.estado;
  const [estado, setEstado] = useState<EstadoPropuesta>(
    esEstadoPropuesta(estadoEnviado) ? estadoEnviado : estadoActual,
  );

  return (
    <form action={accion} className="grid gap-4" noValidate>
      <input type="hidden" name="propuesta_id" value={propuestaId} />
      <MensajeFormulario estado={resultado} />

      <Campo
        etiqueta="Estado"
        errores={resultado.errores?.estado}
        ayuda={
          estado === "finalizada" && !tieneDocumento
            ? "Carga primero el documento final para poder finalizar."
            : INFO_ESTADO[estado].descripcionEquipo
        }
      >
        {(control) => (
          <Select
            name="estado"
            value={estado}
            onValueChange={(valor) => {
              if (esEstadoPropuesta(valor)) setEstado(valor);
            }}
          >
            <SelectTrigger {...control} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_PROPUESTA.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {INFO_ESTADO[valor].etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Campo>

      <Campo
        etiqueta="Mensaje para el cliente"
        opcional
        errores={resultado.errores?.mensaje_cliente}
        ayuda="El cliente lo verá en su portal junto al estado. Usa un lenguaje claro y cercano."
      >
        {(control) => (
          <Textarea
            {...control}
            name="mensaje_cliente"
            rows={4}
            maxLength={1000}
            placeholder={INFO_ESTADO[estado].descripcionCliente}
            defaultValue={resultado.valores?.mensaje_cliente ?? mensajeActual ?? ""}
          />
        )}
      </Campo>

      <div className="flex justify-end">
        <BotonEnviar textoPendiente="Guardando…">Guardar estado</BotonEnviar>
      </div>
    </form>
  );
}
