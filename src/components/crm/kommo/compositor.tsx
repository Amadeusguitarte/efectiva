"use client";

import { CalendarCheck, ChevronDown, Mail, MessageCircle, Send, StickyNote } from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { agregarNotaCaso, crearTarea, enviarMensaje } from "@/app/admin/crm/acciones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import { INFO_CANAL, TIPOS_TAREA, type CanalCrm } from "@/lib/crm/catalogos";
import { claveDia } from "@/lib/crm/linea-tiempo";
import type { MensajeCaso, MiembroEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

import { BotonEnviarCrm } from "./piezas";

export type ModoCompositor = "chat" | "nota" | "tarea";

const MODOS: { valor: ModoCompositor; etiqueta: string; icono: typeof MessageCircle }[] = [
  { valor: "chat", etiqueta: "Chat", icono: MessageCircle },
  { valor: "nota", etiqueta: "Nota", icono: StickyNote },
  { valor: "tarea", etiqueta: "Tarea", icono: CalendarCheck },
];

type CompositorProps = {
  caso: {
    id: string;
    codigo: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
    responsableId: string | null;
  };
  mensajes: MensajeCaso[];
  equipo: MiembroEquipo[];
  canalInicial: CanalCrm;
  whatsappConectado: boolean;
  correoActivo: boolean;
  ahora: string;
  modo: ModoCompositor;
  /** Cambia cuando otra parte de la vista pide el compositor: se enfoca el campo. */
  foco: number;
  alPedirModo: (modo: ModoCompositor) => void;
};

/**
 * Compositor del feed, como el de Kommo: «Chat ▾ para <contacto>: Escribe un mensaje…». El modo
 * cambia entre Chat (WhatsApp o correo, siempre escrito por una persona), Nota interna y Tarea.
 * Enter envía y Mayús+Enter hace un salto de línea.
 */
export function Compositor(props: CompositorProps) {
  const { modo } = props;
  return (
    <div
      className={cn(
        "shrink-0 border-t border-crm-borde px-4 py-3 transition-colors",
        modo === "nota" ? "bg-crm-nota" : "bg-background",
      )}
    >
      {modo === "chat" ? <FormularioChat {...props} /> : null}
      {modo === "nota" ? <FormularioNota {...props} /> : null}
      {modo === "tarea" ? <FormularioTarea {...props} /> : null}
    </div>
  );
}

function SelectorModo({
  modo,
  alPedirModo,
}: {
  modo: ModoCompositor;
  alPedirModo: (modo: ModoCompositor) => void;
}) {
  const actual = MODOS.find((m) => m.valor === modo) ?? MODOS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-0.5 rounded-sm text-crm-seleccion underline decoration-crm-seleccion/40 underline-offset-4 outline-none hover:decoration-crm-seleccion focus-visible:ring-2 focus-visible:ring-crm-seleccion/40"
        aria-label={`Tipo: ${actual?.etiqueta}. Cambiar entre chat, nota y tarea`}
      >
        {actual?.etiqueta}
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-40 font-crm text-crm-texto">
        {MODOS.map(({ valor, etiqueta, icono: Icono }) => (
          <DropdownMenuItem key={valor} onSelect={() => alPedirModo(valor)} className="text-[15px]">
            <Icono />
            {etiqueta}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Enfoca el campo cuando la vista pide el compositor (no al cargar la página). */
function useEnfocar(foco: number, ref: RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    if (foco > 0) ref.current?.focus();
  }, [foco, ref]);
}

/** Enter envía el formulario y Mayús+Enter hace un salto de línea. */
function enviarConEnter(
  evento: KeyboardEvent<HTMLTextAreaElement>,
  puedeEnviar: boolean,
  formulario: HTMLFormElement | null,
) {
  if (evento.key !== "Enter" || evento.shiftKey || evento.nativeEvent.isComposing) return;
  evento.preventDefault();
  if (puedeEnviar) formulario?.requestSubmit();
}

const CLASE_TEXTO =
  "field-sizing-content max-h-40 min-h-12 min-w-56 flex-1 basis-56 resize-none bg-transparent py-0 text-[15px] leading-6 text-crm-texto outline-none placeholder:text-crm-hora disabled:cursor-not-allowed";

/** «Chat ▾ para <contacto>:» y el campo; si no caben en una línea, el campo baja a la siguiente. */
function LineaPrincipal({ inicio, children }: { inicio: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-x-2 text-[15px] leading-6">
      <span className="flex max-w-full min-w-0 items-baseline gap-1 whitespace-nowrap">
        {inicio}
      </span>
      {children}
    </div>
  );
}

function ErrorFormulario({ estado }: { estado: EstadoAccion }) {
  if (estado.ok || !estado.mensaje) return null;
  const detalle = estado.errores ? Object.values(estado.errores).flat()[0] : undefined;
  return (
    <p role="alert" className="text-xs text-destructive">
      {detalle ?? estado.mensaje}
    </p>
  );
}

function asuntoDeRespuesta(mensajes: MensajeCaso[]): string {
  const ultimoCorreo = mensajes.findLast((m) => m.canal === "correo" && m.direccion === "entrada");
  if (!ultimoCorreo?.asunto) return "";
  return /^re:/i.test(ultimoCorreo.asunto) ? ultimoCorreo.asunto : `Re: ${ultimoCorreo.asunto}`;
}

function FormularioChat({
  caso,
  mensajes,
  canalInicial,
  whatsappConectado,
  correoActivo,
  modo,
  foco,
  alPedirModo,
}: CompositorProps) {
  const [canal, setCanal] = useState<CanalCrm>(canalInicial);
  const [contenido, setContenido] = useState("");
  const [asunto, setAsunto] = useState(() => asuntoDeRespuesta(mensajes));
  const [estado, accion, enviando] = useActionState(
    async (previo: EstadoAccion, formData: FormData) => {
      const resultado = await enviarMensaje(previo, formData);
      if (resultado.ok) setContenido("");
      return resultado;
    },
    ESTADO_INICIAL,
  );
  const formulario = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  useEnfocar(foco, campo);

  const disponible = canal === "whatsapp" ? Boolean(caso.telefono) : Boolean(caso.email);
  const aviso = !disponible
    ? `El caso no tiene ${canal === "whatsapp" ? "teléfono" : "correo"}: agrégalo en el contacto.`
    : canal === "whatsapp" && !whatsappConectado
      ? "WhatsApp desconectado: quedará en cola."
      : canal === "correo" && !correoActivo
        ? "Correo sin configurar: quedará en cola."
        : "Enter envía · Mayús+Enter, salto de línea";

  return (
    <form ref={formulario} action={accion} noValidate className="grid gap-2">
      <input type="hidden" name="caso_id" value={caso.id} />
      <input type="hidden" name="canal" value={canal} />
      {canal === "correo" && disponible ? (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-crm-hora">Asunto:</span>
          <input
            name="asunto"
            value={asunto}
            onChange={(evento) => setAsunto(evento.target.value)}
            maxLength={300}
            aria-invalid={Boolean(estado.errores?.asunto)}
            className="h-7 min-w-0 flex-1 border-b border-crm-borde bg-transparent text-crm-texto outline-none focus:border-crm-seleccion aria-invalid:border-destructive"
          />
        </label>
      ) : null}
      <LineaPrincipal
        inicio={
          <>
            <SelectorModo modo={modo} alPedirModo={alPedirModo} />
            <span className="text-crm-hora">para</span>
            <span className="truncate">
              <span className="text-crm-seleccion underline decoration-crm-seleccion/40 underline-offset-4">
                {caso.nombre}
              </span>
              <span className="text-crm-hora">:</span>
            </span>
          </>
        }
      >
        <textarea
          ref={campo}
          name="contenido"
          rows={2}
          maxLength={20000}
          value={contenido}
          disabled={!disponible}
          onChange={(evento) => setContenido(evento.target.value)}
          onKeyDown={(evento) =>
            enviarConEnter(evento, Boolean(contenido.trim()) && !enviando, formulario.current)
          }
          placeholder="Escribe un mensaje…"
          aria-label={`Mensaje por ${INFO_CANAL[canal].etiqueta} para ${caso.nombre}`}
          aria-invalid={Boolean(estado.errores?.contenido)}
          className={CLASE_TEXTO}
        />
      </LineaPrincipal>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="radiogroup"
          aria-label="Canal"
          className="flex rounded-sm border border-crm-borde p-0.5"
        >
          {(["whatsapp", "correo"] as const).map((opcion) => {
            const Icono = opcion === "whatsapp" ? MessageCircle : Mail;
            return (
              <button
                key={opcion}
                type="button"
                role="radio"
                aria-checked={canal === opcion}
                onClick={() => setCanal(opcion)}
                className={cn(
                  "flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors",
                  canal === opcion
                    ? "bg-crm-seleccion-suave font-bold text-crm-seleccion"
                    : "text-crm-hora hover:text-crm-texto",
                )}
              >
                <Icono
                  className={cn("size-3.5", opcion === "whatsapp" && "text-crm-whatsapp")}
                  aria-hidden
                />
                {INFO_CANAL[opcion].etiqueta}
              </button>
            );
          })}
        </div>
        <p className="min-w-0 flex-1 truncate text-xs text-crm-hora">{aviso}</p>
        <ErrorFormulario estado={estado} />
        <BotonEnviarCrm disabled={!contenido.trim() || !disponible} textoPendiente="Enviando…">
          <Send />
          Enviar
        </BotonEnviarCrm>
      </div>
    </form>
  );
}

function FormularioNota({ caso, modo, foco, alPedirModo }: CompositorProps) {
  const [contenido, setContenido] = useState("");
  const [estado, accion, guardando] = useActionState(
    async (previo: EstadoAccion, formData: FormData) => {
      const resultado = await agregarNotaCaso(previo, formData);
      if (resultado.ok) setContenido("");
      return resultado;
    },
    ESTADO_INICIAL,
  );
  const formulario = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  useEnfocar(foco, campo);

  return (
    <form ref={formulario} action={accion} noValidate className="grid gap-2">
      <input type="hidden" name="caso_id" value={caso.id} />
      <LineaPrincipal
        inicio={
          <>
            <SelectorModo modo={modo} alPedirModo={alPedirModo} />
            <span className="text-crm-hora">interna:</span>
          </>
        }
      >
        <textarea
          ref={campo}
          name="contenido"
          rows={2}
          maxLength={5000}
          value={contenido}
          onChange={(evento) => setContenido(evento.target.value)}
          onKeyDown={(evento) =>
            enviarConEnter(evento, Boolean(contenido.trim()) && !guardando, formulario.current)
          }
          placeholder="Escribe una nota para el equipo (el contacto no la ve)…"
          aria-label="Nota interna"
          aria-invalid={Boolean(estado.errores?.contenido)}
          className={CLASE_TEXTO}
        />
      </LineaPrincipal>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="min-w-0 flex-1 truncate text-xs text-crm-hora">
          Solo la ve el equipo · Enter guarda
        </p>
        <ErrorFormulario estado={estado} />
        <BotonEnviarCrm disabled={!contenido.trim()} textoPendiente="Guardando…">
          Guardar nota
        </BotonEnviarCrm>
      </div>
    </form>
  );
}

function FormularioTarea({ caso, equipo, ahora, modo, foco, alPedirModo }: CompositorProps) {
  const [titulo, setTitulo] = useState("");
  const [estado, accion, creando] = useActionState(
    async (previo: EstadoAccion, formData: FormData) => {
      const resultado = await crearTarea(previo, formData);
      if (resultado.ok) setTitulo("");
      return resultado;
    },
    ESTADO_INICIAL,
  );
  const formulario = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  useEnfocar(foco, campo);
  const control =
    "h-7 rounded-sm border border-crm-borde bg-background px-1.5 text-sm text-crm-texto outline-none focus-visible:border-crm-seleccion aria-invalid:border-destructive";

  return (
    <form ref={formulario} action={accion} noValidate className="grid gap-2">
      <input type="hidden" name="caso_id" value={caso.id} />
      <LineaPrincipal
        inicio={
          <>
            <SelectorModo modo={modo} alPedirModo={alPedirModo} />
            <span className="text-crm-hora">para</span>
            <select
              name="responsable_id"
              defaultValue={estado.valores?.responsable_id ?? caso.responsableId ?? ""}
              aria-label="Responsable de la tarea"
              className="max-w-40 truncate rounded-sm bg-transparent text-crm-seleccion underline decoration-crm-seleccion/40 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-crm-seleccion/40"
            >
              <option value="">Sin asignar</option>
              {equipo.map((miembro) => (
                <option key={miembro.id} value={miembro.id}>
                  {miembro.nombre}
                </option>
              ))}
            </select>
            <span className="-ml-1 text-crm-hora">:</span>
          </>
        }
      >
        <textarea
          ref={campo}
          name="titulo"
          rows={2}
          maxLength={200}
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          onKeyDown={(evento) =>
            enviarConEnter(evento, Boolean(titulo.trim()) && !creando, formulario.current)
          }
          placeholder="Qué hay que hacer…"
          aria-label="Título de la tarea"
          aria-invalid={Boolean(estado.errores?.titulo)}
          className={CLASE_TEXTO}
        />
      </LineaPrincipal>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-crm-hora">
          Vence
          <input
            type="date"
            name="vence_at"
            defaultValue={estado.valores?.vence_at ?? claveDia(ahora)}
            aria-invalid={Boolean(estado.errores?.vence_at)}
            className={control}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-crm-hora">
          Tipo
          <select
            name="tipo"
            defaultValue={estado.valores?.tipo ?? "seguimiento"}
            className={control}
          >
            {TIPOS_TAREA.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <span className="min-w-0 flex-1" />
        <ErrorFormulario estado={estado} />
        <BotonEnviarCrm disabled={!titulo.trim()} textoPendiente="Creando…">
          Crear tarea
        </BotonEnviarCrm>
      </div>
    </form>
  );
}
