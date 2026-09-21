import { formatearFechaHora } from "@/lib/formato";
import { INFO_ESTADO, type EstadoPropuesta } from "@/lib/propuestas/estados";
import { cn } from "cn";

export type EventoHistorial = {
  id: number;
  estado_anterior: EstadoPropuesta | null;
  estado_nuevo: EstadoPropuesta;
  mensaje: string | null;
  created_at: string;
  autor?: { nombre_completo: string | null; email: string } | null;
};

type HistorialPropuestaProps = {
  eventos: EventoHistorial[];
  /** En el panel se muestra quién hizo cada cambio. */
  mostrarAutor?: boolean;
};

function tituloEvento(evento: EventoHistorial) {
  if (!evento.estado_anterior) return "Proceso iniciado";
  if (evento.estado_anterior === evento.estado_nuevo) return "Nuevo mensaje del equipo";
  return INFO_ESTADO[evento.estado_nuevo].etiqueta;
}

/** Línea de tiempo de la propuesta, del evento más reciente al más antiguo. */
export function HistorialPropuesta({ eventos, mostrarAutor }: HistorialPropuestaProps) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay movimientos.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l pl-6">
      {eventos.map((evento, indice) => (
        <li key={evento.id} className="relative">
          <span
            aria-hidden
            className={cn(
              "absolute top-1 -left-[1.9rem] size-3 rounded-full border-2 border-background",
              indice === 0 ? "bg-primary" : "bg-muted-foreground/40",
            )}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-medium text-foreground">{tituloEvento(evento)}</p>
            <time
              dateTime={evento.created_at}
              className="text-xs text-muted-foreground tabular-nums"
            >
              {formatearFechaHora(evento.created_at)}
            </time>
          </div>
          {evento.mensaje ? (
            <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
              {evento.mensaje}
            </p>
          ) : null}
          {mostrarAutor && evento.autor ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Por {evento.autor.nombre_completo || evento.autor.email}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
