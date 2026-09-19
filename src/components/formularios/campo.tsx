import { useId } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "cn";

type CampoProps = {
  etiqueta: string;
  errores?: string[];
  ayuda?: string;
  opcional?: boolean;
  className?: string;
  /** Recibe el id y los atributos de accesibilidad que debe llevar el control. */
  children: (control: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
};

/** Etiqueta, control, ayuda y errores de un campo, con los atributos ARIA ya conectados. */
export function Campo({ etiqueta, errores, ayuda, opcional, className, children }: CampoProps) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const tieneError = Boolean(errores?.length);
  const describedBy = [ayuda ? idAyuda : null, tieneError ? idError : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>
        {etiqueta}
        {opcional ? <span className="font-normal text-muted-foreground">(opcional)</span> : null}
      </Label>
      {children({ id, "aria-invalid": tieneError, "aria-describedby": describedBy || undefined })}
      {ayuda ? (
        <p id={idAyuda} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      ) : null}
      {tieneError ? (
        <p id={idError} className="text-sm text-destructive">
          {errores?.[0]}
        </p>
      ) : null}
    </div>
  );
}
