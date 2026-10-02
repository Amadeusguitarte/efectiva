import { Mail, MessageCircle } from "lucide-react";

import type { CanalCrm } from "@/lib/crm/catalogos";
import { iniciales } from "@/lib/formato";
import { cn } from "cn";

/** Fondos de las iniciales: el mismo contacto siempre tiene el mismo color. */
const FONDOS = [
  "bg-crm-avatar-1",
  "bg-crm-avatar-2",
  "bg-crm-avatar-3",
  "bg-crm-avatar-4",
  "bg-crm-avatar-5",
  "bg-crm-avatar-6",
] as const;

function fondoDe(semilla: string) {
  let hash = 0;
  for (const caracter of semilla) hash = (hash * 31 + caracter.charCodeAt(0)) | 0;
  return FONDOS[Math.abs(hash) % FONDOS.length];
}

const TAMANOS = {
  sm: {
    avatar: "size-7 text-[10px]",
    insignia: "size-3.5 -right-0.5 -bottom-0.5",
    icono: "size-2",
  },
  md: { avatar: "size-9 text-xs", insignia: "size-4 -right-0.5 -bottom-0.5", icono: "size-2.5" },
  lg: { avatar: "size-11 text-sm", insignia: "size-5 -right-0.5 -bottom-0.5", icono: "size-3" },
} as const;

/**
 * Avatar de un contacto del CRM al estilo de Kommo: círculo con las iniciales y, abajo a la
 * derecha, la insignia del canal (verde de WhatsApp o azul de correo).
 */
export function AvatarContacto({
  nombre,
  canal,
  semilla,
  tamano = "md",
  className,
}: {
  nombre: string;
  canal?: CanalCrm | null;
  /** Lo que fija el color (por defecto, el nombre); conviene el id del caso. */
  semilla?: string;
  tamano?: keyof typeof TAMANOS;
  className?: string;
}) {
  const medidas = TAMANOS[tamano];
  const Icono = canal === "correo" ? Mail : MessageCircle;
  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-bold text-white",
          medidas.avatar,
          fondoDe(semilla ?? nombre),
        )}
      >
        {iniciales(nombre) || "?"}
      </span>
      {canal ? (
        <span
          className={cn(
            "absolute inline-flex items-center justify-center rounded-full border-2 border-background text-white",
            medidas.insignia,
            canal === "whatsapp" ? "bg-crm-whatsapp" : "bg-crm-seleccion",
          )}
        >
          <Icono className={medidas.icono} strokeWidth={3} />
        </span>
      ) : null}
    </span>
  );
}
