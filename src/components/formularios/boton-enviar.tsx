"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type BotonEnviarProps = React.ComponentProps<typeof Button> & {
  textoPendiente?: string;
};

/** Botón de envío que se deshabilita y muestra un indicador mientras la acción se ejecuta. */
export function BotonEnviar({ children, textoPendiente, disabled, ...props }: BotonEnviarProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending && textoPendiente ? textoPendiente : children}
    </Button>
  );
}
