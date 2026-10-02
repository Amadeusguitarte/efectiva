"use client";

import { Loader2, Plus } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "cn";

/** Fila «etiqueta gris | valor» del panel del caso, como las de la ficha de un lead en Kommo. */
export function FilaDato({
  etiqueta,
  children,
  className,
}: {
  etiqueta: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid min-h-9 grid-cols-[7.5rem_1fr] items-center gap-3", className)}>
      <dt className="truncate text-crm-hora">{etiqueta}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Botón de línea con el círculo «+» de Kommo («Agregar contacto», «Agregar nota»…). */
export function BotonLinea({ children, className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 border-b border-crm-borde px-5 py-3 text-left text-[15px] text-crm-hora transition-colors hover:bg-crm-feed hover:text-crm-texto disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-crm-borde-fuerte"
      >
        <Plus className="size-4" />
      </span>
      {children}
    </button>
  );
}

/** Control nativo discreto del CRM: sin borde hasta pasar el puntero, como los campos de Kommo. */
export const CONTROL_CRM =
  "h-8 w-full min-w-0 rounded-sm border border-transparent bg-transparent px-1.5 text-[15px] text-crm-texto outline-none transition-colors hover:border-crm-borde focus-visible:border-crm-seleccion disabled:opacity-60";

/** Campo de formulario del CRM con borde visible (formularios en línea del panel y del feed). */
export const CAMPO_CRM =
  "h-8 w-full min-w-0 rounded-sm border border-crm-borde-fuerte bg-background px-2 text-sm text-crm-texto outline-none placeholder:text-crm-hora focus-visible:border-crm-seleccion aria-invalid:border-destructive";

/** Botón principal azul de Kommo («Enviar», «Guardar»). */
export const BOTON_CRM =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm bg-crm-seleccion px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

/** Botón secundario de Kommo («Cancelar»). */
export const BOTON_CRM_SECUNDARIO =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border border-crm-borde-fuerte bg-background px-3 text-sm text-crm-texto transition-colors hover:bg-crm-feed disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4";

/** Botón de envío azul que se deshabilita y muestra un indicador mientras corre la acción. */
export function BotonEnviarCrm({
  children,
  textoPendiente,
  disabled,
  className,
  ...props
}: ComponentProps<"button"> & { textoPendiente?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(BOTON_CRM, className)}
      {...props}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending && textoPendiente ? textoPendiente : children}
    </button>
  );
}
