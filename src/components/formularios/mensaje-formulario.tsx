import { CircleAlert, CircleCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EstadoAccion } from "@/lib/acciones";
import { cn } from "cn";

/** Mensaje general devuelto por una Server Action (éxito o error). */
export function MensajeFormulario({
  estado,
  className,
}: {
  estado: EstadoAccion;
  className?: string;
}) {
  if (!estado.mensaje) return null;
  return (
    <Alert
      role={estado.ok ? "status" : "alert"}
      variant={estado.ok ? "default" : "destructive"}
      className={cn(estado.ok && "border-success/30 bg-success-soft text-success", className)}
    >
      {estado.ok ? <CircleCheck /> : <CircleAlert />}
      <AlertDescription className={cn(estado.ok && "text-success")}>
        {estado.mensaje}
      </AlertDescription>
    </Alert>
  );
}
