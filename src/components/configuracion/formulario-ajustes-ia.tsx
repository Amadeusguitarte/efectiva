"use client";

import { useActionState, useState } from "react";

import { guardarAjustesIa } from "@/app/admin/configuracion/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/acciones";
import { INFO_PROVEEDOR_IA, PROVEEDORES_IA, esProveedorIA, type ProveedorIA } from "@/lib/crm/ia";
import type { AjustesIa } from "@/lib/datos/crm";
import { cn } from "cn";

export function FormularioAjustesIa({ ajustes }: { ajustes: AjustesIa }) {
  const [estado, accion] = useActionState(guardarAjustesIa, ESTADO_INICIAL);
  const inicial = estado.valores?.proveedor;
  const [proveedor, setProveedor] = useState<ProveedorIA>(
    esProveedorIA(inicial) ? inicial : ajustes.proveedor,
  );
  const info = INFO_PROVEEDOR_IA[proveedor];

  return (
    <form action={accion} className="grid gap-5" noValidate>
      <MensajeFormulario estado={estado} />

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="activo"
          className="size-4 accent-primary"
          defaultChecked={estado.valores ? estado.valores.activo === "on" : ajustes.activo}
        />
        <span>
          <span className="font-medium">Activar el análisis con IA</span>
          <span className="block text-xs text-muted-foreground">
            Solo analiza y clasifica los casos. Nunca responde mensajes a los contactos.
          </span>
        </span>
      </label>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Proveedor</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROVEEDORES_IA.map((valor) => (
            <label
              key={valor}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors",
                proveedor === valor ? "border-primary bg-primary/5" : "hover:bg-accent",
              )}
            >
              <input
                type="radio"
                name="proveedor"
                value={valor}
                checked={proveedor === valor}
                onChange={() => setProveedor(valor)}
                className="mt-0.5 accent-primary"
              />
              <span>
                <span className="font-medium">{INFO_PROVEEDOR_IA[valor].etiqueta}</span>
                <span className="block text-xs text-muted-foreground">
                  {INFO_PROVEEDOR_IA[valor].ayuda}
                </span>
              </span>
            </label>
          ))}
        </div>
        {estado.errores?.proveedor ? (
          <p className="text-sm text-destructive">{estado.errores.proveedor[0]}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          etiqueta="Modelo"
          errores={estado.errores?.modelo}
          ayuda={`Sugeridos: ${info.modelos.join(", ")}.`}
        >
          {(control) => (
            <>
              <Input
                {...control}
                name="modelo"
                list="modelos-ia"
                key={proveedor}
                defaultValue={
                  estado.valores?.modelo ??
                  (ajustes.proveedor === proveedor ? ajustes.modelo : info.modeloPorDefecto)
                }
              />
              <datalist id="modelos-ia">
                {info.modelos.map((modelo) => (
                  <option key={modelo} value={modelo} />
                ))}
              </datalist>
            </>
          )}
        </Campo>
        <Campo
          etiqueta="Clave de API"
          errores={estado.errores?.api_key}
          ayuda={
            ajustes.tieneClave
              ? "Ya hay una clave guardada; escribe otra solo para reemplazarla."
              : "Se guarda cifrada."
          }
        >
          {(control) => (
            <Input
              {...control}
              type="password"
              name="api_key"
              autoComplete="off"
              placeholder={ajustes.tieneClave ? "••••••••••••" : "sk-…"}
            />
          )}
        </Campo>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="aplicar_etapa_sugerida"
          className="size-4 accent-primary"
          defaultChecked={
            estado.valores
              ? estado.valores.aplicar_etapa_sugerida === "on"
              : ajustes.aplicarEtapaSugerida
          }
        />
        <span>
          <span className="font-medium">Mover el caso a la etapa sugerida automáticamente</span>
          <span className="block text-xs text-muted-foreground">
            Si está apagado, el análisis solo sugiere y el equipo la aplica con un clic. Al mover de
            etapa se disparan sus tareas y correos automáticos.
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <BotonEnviar textoPendiente="Guardando…">Guardar ajustes</BotonEnviar>
      </div>
    </form>
  );
}
