import { Mail, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

import { urlBandeja, type EstadoBandeja } from "@/lib/crm/bandeja";
import type { CasoDetalle, ConversacionResumen, Etapa, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import { ActualizacionPeriodica } from "./actualizacion-periodica";
import { ALTO_VISTA_CRM } from "./barra-crm";
import { ListaConversaciones } from "./lista-conversaciones";
import { VistaCaso } from "./vista-caso";

type BandejaEntradaProps = {
  estado: EstadoBandeja;
  conversaciones: ConversacionResumen[];
  caso: CasoDetalle | null;
  etapas: Etapa[];
  equipo: MiembroEquipo[];
  ajustes: { whatsappConectado: boolean; correoActivo: boolean; iaActiva: boolean };
  ahora: string;
  /** Franja discreta arriba (por ejemplo, «WhatsApp no está conectado»). */
  aviso?: ReactNode;
};

/**
 * Inbox de chat o de correo con la distribución de Kommo, a pantalla completa: la lista de
 * conversaciones, el panel del caso abierto y su feed con el compositor. En móvil se ve la lista
 * y, al abrir una conversación, el feed (el panel abre como hoja lateral).
 */
export function BandejaEntrada({
  estado,
  conversaciones,
  caso,
  etapas,
  equipo,
  ajustes,
  ahora,
  aviso,
}: BandejaEntradaProps) {
  const Icono = estado.canal === "whatsapp" ? MessageCircle : Mail;
  return (
    <div className={cn("flex min-h-0 flex-col", ALTO_VISTA_CRM)}>
      <ActualizacionPeriodica />
      {aviso}
      <div className="flex min-h-0 flex-1">
        <ListaConversaciones
          estado={estado}
          conversaciones={conversaciones}
          casoActivoId={caso?.id ?? null}
          ahora={ahora}
          className={cn("w-full lg:w-[22rem] lg:shrink-0", caso && "hidden lg:flex")}
        />
        {caso ? (
          <VistaCaso
            key={caso.id}
            caso={caso}
            etapas={etapas}
            equipo={equipo}
            ajustes={ajustes}
            ahora={ahora}
            canalInicial={estado.canal}
            contexto="bandeja"
            hrefVolver={urlBandeja(estado)}
            className="flex-1"
          />
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-crm-feed px-6 text-center lg:flex">
            <span className="flex size-14 items-center justify-center rounded-full bg-background text-crm-hora">
              <Icono className="size-6" aria-hidden />
            </span>
            <p className="text-[15px] font-bold text-crm-texto">Selecciona una conversación</p>
            <p className="max-w-sm text-sm text-crm-hora">
              Verás el caso con su etapa y sus datos, y la conversación completa para responder a
              mano. La IA nunca responde por el equipo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
