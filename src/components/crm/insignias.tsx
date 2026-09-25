import { Mail, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { INFO_CANAL, INFO_PRIORIDAD, type CanalCrm, type Prioridad } from "@/lib/crm/catalogos";
import { cn } from "cn";

export function IconoCanal({ canal, className }: { canal: CanalCrm; className?: string }) {
  const Icono = canal === "whatsapp" ? MessageCircle : Mail;
  return <Icono className={cn("size-3.5", className)} aria-hidden />;
}

export function InsigniaCanal({ canal }: { canal: CanalCrm }) {
  return (
    <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
      <IconoCanal canal={canal} />
      {INFO_CANAL[canal].etiqueta}
    </Badge>
  );
}

const TONO_PRIORIDAD: Record<Prioridad, string> = {
  alta: "border-destructive/30 bg-destructive/10 text-destructive",
  media: "border-warning/30 bg-warning-soft text-warning",
  baja: "border-border bg-surface-soft text-muted-foreground",
};

export function InsigniaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  return (
    <Badge variant="outline" className={cn("font-medium", TONO_PRIORIDAD[prioridad])}>
      {INFO_PRIORIDAD[prioridad].etiqueta}
    </Badge>
  );
}

export function PuntoEtapa({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function InsigniaEtapa({ nombre, color }: { nombre: string; color: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-medium">
      <PuntoEtapa color={color} />
      {nombre}
    </Badge>
  );
}

export function InsigniaSinResponder() {
  return (
    <Badge className="text-destructive-foreground bg-destructive hover:bg-destructive">
      Sin responder
    </Badge>
  );
}
