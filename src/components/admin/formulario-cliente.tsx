"use client";

import { useActionState } from "react";

import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import type { Tables } from "@/types/database";
import { TIPOS_DOCUMENTO } from "@/lib/validaciones/cliente";

type ValoresCliente = Pick<
  Tables<"clientes">,
  "nombre_completo" | "email" | "telefono" | "tipo_documento" | "numero_documento" | "ciudad"
>;

type FormularioClienteProps = {
  accion: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  valores?: ValoresCliente;
  textoBoton: string;
  /** Aviso cuando el cliente ya tiene cuenta: cambiar el correo aquí no cambia su acceso. */
  cuentaVinculada?: boolean;
};

const claseSelect =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function FormularioCliente({
  accion,
  valores,
  textoBoton,
  cuentaVinculada,
}: FormularioClienteProps) {
  const [estado, accionFormulario] = useActionState(accion, ESTADO_INICIAL);
  const errores = estado.errores ?? {};
  // Tras un error se muestran los valores enviados; si no, los guardados.
  const inicial: Partial<Record<keyof ValoresCliente, string | null>> =
    estado.valores ?? valores ?? {};

  return (
    <form action={accionFormulario} className="grid gap-5" noValidate>
      <MensajeFormulario estado={estado} />

      <div className="grid gap-5 md:grid-cols-2">
        <Campo
          etiqueta="Nombre completo"
          errores={errores.nombre_completo}
          className="md:col-span-2"
        >
          {(control) => (
            <Input
              {...control}
              name="nombre_completo"
              defaultValue={inicial.nombre_completo ?? ""}
              autoComplete="off"
              required
            />
          )}
        </Campo>

        <Campo
          etiqueta="Correo"
          errores={errores.email}
          ayuda={
            cuentaVinculada
              ? "El cliente ya tiene cuenta; cambiar este correo no modifica su acceso con Google."
              : "Debe coincidir con el correo de Google del cliente para vincular su cuenta."
          }
        >
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              defaultValue={inicial.email ?? ""}
              required
            />
          )}
        </Campo>

        <Campo etiqueta="Teléfono" errores={errores.telefono} opcional>
          {(control) => (
            <Input
              {...control}
              name="telefono"
              type="tel"
              inputMode="tel"
              placeholder="+57 300 000 0000"
              defaultValue={inicial.telefono ?? ""}
            />
          )}
        </Campo>

        <Campo etiqueta="Tipo de documento" errores={errores.tipo_documento} opcional>
          {(control) => (
            <select
              {...control}
              name="tipo_documento"
              defaultValue={inicial.tipo_documento ?? ""}
              className={claseSelect}
            >
              <option value="">Sin especificar</option>
              {Object.entries(TIPOS_DOCUMENTO).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <Campo etiqueta="Número de documento" errores={errores.numero_documento} opcional>
          {(control) => (
            <Input
              {...control}
              name="numero_documento"
              inputMode="numeric"
              defaultValue={inicial.numero_documento ?? ""}
            />
          )}
        </Campo>

        <Campo etiqueta="Ciudad" errores={errores.ciudad} opcional>
          {(control) => <Input {...control} name="ciudad" defaultValue={inicial.ciudad ?? ""} />}
        </Campo>
      </div>

      <div className="flex justify-end">
        <BotonEnviar textoPendiente="Guardando…">{textoBoton}</BotonEnviar>
      </div>
    </form>
  );
}
