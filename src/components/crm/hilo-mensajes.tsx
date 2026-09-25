"use client";

import { AlertCircle, Clock, Mail, MessageCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { enviarMensaje } from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import type { CanalCrm } from "@/lib/crm/catalogos";
import { formatearTelefono } from "@/lib/crm/telefono";
import type { MensajeCaso } from "@/lib/datos/crm";
import { formatearFechaHora } from "@/lib/formato";
import { cn } from "cn";

type HiloMensajesProps = {
  casoId: string;
  mensajes: MensajeCaso[];
  telefono: string | null;
  email: string | null;
  canalInicial?: CanalCrm;
  /** Si es false, solo se muestra el canal inicial (bandejas). */
  permitirCambiarCanal?: boolean;
  whatsappConectado: boolean;
  correoActivo: boolean;
  /** Segundos entre actualizaciones automáticas; 0 desactiva. */
  actualizarCada?: number;
};

const SEGUNDOS_POR_DEFECTO = 8;

/** Conversación de un caso por WhatsApp o correo, con respuesta manual desde el panel. */
export function HiloMensajes({
  casoId,
  mensajes,
  telefono,
  email,
  canalInicial = "whatsapp",
  permitirCambiarCanal = true,
  whatsappConectado,
  correoActivo,
  actualizarCada = SEGUNDOS_POR_DEFECTO,
}: HiloMensajesProps) {
  const router = useRouter();
  const [canal, setCanal] = useState<CanalCrm>(canalInicial);
  const [contenido, setContenido] = useState("");
  const [asunto, setAsunto] = useState(() => {
    const ultimoCorreo = [...mensajes]
      .reverse()
      .find((m) => m.canal === "correo" && m.direccion === "entrada");
    if (!ultimoCorreo?.asunto) return "";
    return /^re:/i.test(ultimoCorreo.asunto) ? ultimoCorreo.asunto : `Re: ${ultimoCorreo.asunto}`;
  });
  // Al enviar con éxito se vacía el redactor (el asunto se conserva para seguir el hilo).
  const [estado, accion] = useActionState(async (previo: EstadoAccion, formData: FormData) => {
    const resultado = await enviarMensaje(previo, formData);
    if (resultado.ok) setContenido("");
    return resultado;
  }, ESTADO_INICIAL);
  const listaRef = useRef<HTMLOListElement>(null);

  const visibles = mensajes.filter((m) => m.canal === canal);
  const cantidad = { whatsapp: 0, correo: 0 };
  for (const m of mensajes) cantidad[m.canal] += 1;

  // Refresca la conversación mientras la pestaña está visible.
  useEffect(() => {
    if (!actualizarCada) return;
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, actualizarCada * 1000);
    return () => window.clearInterval(intervalo);
  }, [actualizarCada, router]);

  // Baja al último mensaje cuando cambian.
  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [visibles.length, canal]);

  const contacto = canal === "whatsapp" ? formatearTelefono(telefono) : (email ?? "");
  const disponible = canal === "whatsapp" ? Boolean(telefono) : Boolean(email);

  return (
    <div className="grid gap-3">
      {permitirCambiarCanal ? (
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Canal">
          {(["whatsapp", "correo"] as const).map((c) => (
            <Button
              key={c}
              type="button"
              role="tab"
              aria-selected={canal === c}
              variant={canal === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCanal(c)}
            >
              {c === "whatsapp" ? <MessageCircle /> : <Mail />}
              {c === "whatsapp" ? "WhatsApp" : "Correo"}
              <span className="ml-1 rounded-full bg-background/20 px-1.5 text-[11px] tabular-nums">
                {cantidad[c]}
              </span>
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{contacto}</span>
        </div>
      ) : null}

      <ol
        ref={listaRef}
        className="grid max-h-[28rem] min-h-40 content-start gap-2 overflow-y-auto rounded-lg border bg-surface-soft/60 p-3"
        aria-live="polite"
      >
        {visibles.length === 0 ? (
          <li className="py-10 text-center text-sm text-muted-foreground">
            {disponible
              ? `Todavía no hay mensajes por ${canal === "whatsapp" ? "WhatsApp" : "correo"}.`
              : `Este caso no tiene ${canal === "whatsapp" ? "teléfono" : "correo"}; agrégalo en sus datos.`}
          </li>
        ) : null}
        {visibles.map((mensaje) => {
          const salida = mensaje.direccion === "salida";
          return (
            <li key={mensaje.id} className={cn("flex", salida ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-xs",
                  salida ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
                )}
              >
                {mensaje.asunto ? <p className="mb-1 font-medium">{mensaje.asunto}</p> : null}
                <p className="break-words whitespace-pre-line">{mensaje.contenido}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-[11px]",
                    salida ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {salida && mensaje.autor ? <span>{mensaje.autor} · </span> : null}
                  {formatearFechaHora(mensaje.enviadoAt ?? mensaje.createdAt)}
                  {mensaje.estadoEnvio === "pendiente" ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="size-3" aria-hidden /> En cola
                    </span>
                  ) : null}
                  {mensaje.estadoEnvio === "fallido" ? (
                    <span
                      className="inline-flex items-center gap-0.5 text-warning"
                      title={mensaje.error ?? undefined}
                    >
                      <AlertCircle className="size-3" aria-hidden /> No enviado
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {disponible ? (
        <form action={accion} className="grid gap-2" noValidate>
          <input type="hidden" name="caso_id" value={casoId} />
          <input type="hidden" name="canal" value={canal} />
          <MensajeFormulario estado={estado.ok ? ESTADO_INICIAL : estado} />
          {canal === "correo" ? (
            <Input
              name="asunto"
              placeholder="Asunto"
              maxLength={300}
              value={asunto}
              onChange={(evento) => setAsunto(evento.target.value)}
              aria-invalid={Boolean(estado.errores?.asunto)}
              aria-label="Asunto"
            />
          ) : null}
          <Textarea
            name="contenido"
            rows={3}
            maxLength={20000}
            value={contenido}
            onChange={(evento) => setContenido(evento.target.value)}
            placeholder={
              canal === "whatsapp"
                ? `Escribe el mensaje para ${contacto}`
                : `Escribe el correo para ${contacto}`
            }
            aria-label="Mensaje"
            aria-invalid={Boolean(estado.errores?.contenido)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {canal === "whatsapp" && !whatsappConectado
                ? "WhatsApp no está conectado: el mensaje quedará en cola hasta que se conecte."
                : canal === "correo" && !correoActivo
                  ? "El correo no está configurado: el mensaje quedará en cola hasta configurarlo."
                  : "Se envía a mano desde el panel; la IA nunca responde por ti."}
            </p>
            <BotonEnviar size="sm" textoPendiente="Enviando…" disabled={!contenido.trim()}>
              <Send />
              Enviar
            </BotonEnviar>
          </div>
        </form>
      ) : null}
    </div>
  );
}
