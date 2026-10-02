"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Loader2,
  Search,
  SearchX,
  Table2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { rutaHoja, type HojaDiagnostico } from "@/lib/diagnostico/hojas";
import {
  moverIndice,
  type ClienteSelector,
  type ResultadoBusquedaClientes,
} from "@/lib/diagnostico/selector-cliente";
import { iniciales } from "@/lib/formato";
import { cn } from "cn";

/** Espera desde la última tecla antes de buscar en el servidor. */
const ESPERA_BUSQUEDA_MS = 250;

const AVISO_CAMBIOS = "Hay cambios sin guardar. ¿Quieres cambiar de cliente sin guardarlos?";
const ERROR_CONEXION = "No pudimos cargar los clientes. Revisa tu conexión e inténtalo de nuevo.";

/**
 * Cliente cuyo botón «Cambiar de cliente» recibe el foco al montarse. Al elegir otro cliente se abre
 * otra página (o la matriz se vuelve a montar entera, `key={cliente.id}`) y el foco caería en
 * <body>: el botón nuevo lo recupera, y el lector de pantalla anuncia el cliente que se abrió.
 */
let botonPorEnfocar: string | null = null;

function enfocarBotonAlMontar(clienteId: string) {
  botonPorEnfocar = clienteId;
}

/** Si el botón de este cliente debe recibir el foco; lo consume para que ocurra una sola vez. */
function tomarFocoPendiente(clienteId: string): boolean {
  if (botonPorEnfocar !== clienteId) return false;
  botonPorEnfocar = null;
  return true;
}

type SelectorClienteProps = {
  clienteId: string;
  nombreCliente: string;
  /** Hoja abierta: al elegir otro cliente se abre la misma hoja de ese cliente. */
  hoja: HojaDiagnostico;
  /** La matriz tiene cambios sin guardar: se pide confirmación antes de cambiar de cliente. */
  hayCambios: boolean;
  /** Server Action de búsqueda; sin texto devuelve los clientes más recientes. */
  buscarClientes: (termino: string) => Promise<ResultadoBusquedaClientes>;
};

type Resultados = { termino: string; clientes: ClienteSelector[] };

/**
 * Botón «Cambiar de cliente» del encabezado de las hojas del diagnóstico. Al abrirlo despliega un
 * buscador (combobox accesible: flechas, Enter y Esc) con los clientes recientes o los resultados
 * de la búsqueda, y abre la misma hoja (diagnóstico, datos para la propuesta o listas) del cliente
 * elegido.
 */
export function SelectorCliente({
  clienteId,
  nombreCliente,
  hoja,
  hayCambios,
  buscarClientes,
}: SelectorClienteProps) {
  const router = useRouter();
  const id = useId();
  const idLista = `${id}-lista`;
  const idTitulo = `${id}-titulo`;
  const idOpcion = (cliente: ClienteSelector) => `${id}-opcion-${cliente.id}`;
  const refBoton = useRef<HTMLButtonElement>(null);
  const refEntrada = useRef<HTMLInputElement>(null);
  const refLista = useRef<HTMLDivElement>(null);

  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activo, setActivo] = useState(0);
  const [reintentos, setReintentos] = useState(0);
  const [navegando, iniciarNavegacion] = useTransition();

  // Respuestas ya recibidas (por término) mientras el panel está abierto, y número de la última
  // petición: una respuesta que llega tarde, de un término anterior, se descarta.
  const guardados = useRef(new Map<string, ClienteSelector[]>());
  const ultimaPeticion = useRef(0);

  const termino = texto.trim();

  useEffect(() => {
    if (tomarFocoPendiente(clienteId)) refBoton.current?.focus();
  }, [clienteId]);

  useEffect(() => {
    if (!abierto) return;
    const peticion = ++ultimaPeticion.current;
    const guardado = guardados.current.get(termino);
    const vigente = () => peticion === ultimaPeticion.current;
    const mostrar = (clientes: ClienteSelector[]) => {
      setResultados({ termino, clientes });
      setActivo(0);
      setError(null);
      setCargando(false);
    };

    const temporizador = window.setTimeout(
      async () => {
        if (guardado) {
          mostrar(guardado);
          return;
        }
        setCargando(true);
        setError(null);
        try {
          const respuesta = await buscarClientes(termino);
          if (respuesta.ok) guardados.current.set(termino, respuesta.clientes);
          if (!vigente()) return;
          if (respuesta.ok) {
            mostrar(respuesta.clientes);
          } else {
            setError(respuesta.mensaje);
            setCargando(false);
          }
        } catch {
          if (!vigente()) return;
          setError(ERROR_CONEXION);
          setCargando(false);
        }
      },
      guardado || termino === "" ? 0 : ESPERA_BUSQUEDA_MS,
    );
    return () => window.clearTimeout(temporizador);
  }, [abierto, termino, buscarClientes, reintentos]);

  const clientes = resultados?.clientes ?? [];
  // Mientras se escribe se ven los resultados anteriores, atenuados, hasta que llegan los nuevos.
  const desactualizados = resultados !== null && resultados.termino !== termino;
  const buscando = !error && (cargando || resultados === null || desactualizados);
  const opcionActiva = desactualizados ? undefined : clientes[activo];
  const hayOpciones = clientes.length > 0 && !error;

  // La opción activa siempre queda visible dentro de la lista.
  useEffect(() => {
    if (!abierto) return;
    refLista.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [abierto, activo, resultados]);

  function cambiarAbierto(abrir: boolean) {
    setAbierto(abrir);
    if (abrir) {
      // Los datos pudieron cambiar desde la última vez (un guardado, otra persona del equipo): se
      // vuelve a consultar. Mientras tanto se ven los recientes anteriores.
      guardados.current.clear();
      return;
    }
    // Al cerrar se descarta la búsqueda en curso y se limpia el texto; al volver a abrir se ven
    // los recientes de antes, sin esqueleto, mientras llegan los actualizados.
    ultimaPeticion.current += 1;
    const recientes = guardados.current.get("");
    setTexto("");
    setResultados(recientes ? { termino: "", clientes: recientes } : null);
    setActivo(0);
    setError(null);
    setCargando(false);
  }

  function elegir(cliente: ClienteSelector) {
    if (cliente.id === clienteId) {
      cambiarAbierto(false);
      return;
    }
    if (hayCambios && !window.confirm(AVISO_CAMBIOS)) return;
    cambiarAbierto(false);
    enfocarBotonAlMontar(cliente.id);
    iniciarNavegacion(() => {
      router.push(rutaHoja(cliente.id, hoja));
    });
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.nativeEvent.isComposing) return;
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      if (desactualizados) return;
      const paso = evento.key === "ArrowDown" ? 1 : -1;
      setActivo((actual) => moverIndice(actual, clientes.length, paso));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      if (opcionActiva) elegir(opcionActiva);
    }
  }

  let anuncio = "";
  if (error) anuncio = error;
  else if (buscando) anuncio = "Buscando clientes…";
  else if (clientes.length === 0) anuncio = termino ? "Sin resultados" : "Aún no hay clientes";
  else anuncio = clientes.length === 1 ? "1 cliente" : `${clientes.length} clientes`;

  let contenido: ReactNode;
  if (error) {
    contenido = (
      <div className="grid justify-items-center gap-2 px-4 py-6 text-center">
        <CircleAlert className="size-5 text-destructive" aria-hidden />
        <p className="text-sm text-foreground">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setReintentos((n) => n + 1);
            refEntrada.current?.focus();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  } else if (resultados === null) {
    contenido = (
      <div className="grid gap-1 p-1.5" aria-hidden>
        {[0, 1, 2, 3].map((fila) => (
          <div key={fila} className="flex items-center gap-3 px-2.5 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (clientes.length === 0) {
    contenido = (
      <div
        className={cn(
          "grid justify-items-center gap-1 px-4 py-8 text-center",
          desactualizados && "opacity-60",
        )}
      >
        <SearchX className="mb-1 size-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-semibold text-foreground">Sin resultados</p>
        <p className="text-xs text-muted-foreground">
          {resultados.termino
            ? `Ningún cliente coincide con «${resultados.termino}».`
            : "Aún no hay clientes registrados."}
        </p>
      </div>
    );
  } else {
    contenido = (
      <div
        ref={refLista}
        id={idLista}
        role="listbox"
        aria-labelledby={idTitulo}
        aria-busy={desactualizados || undefined}
        className={cn(
          "grid max-h-[min(23rem,calc(var(--radix-popover-content-available-height)_-_8rem))] min-h-16 gap-0.5 overflow-y-auto overscroll-contain p-1.5 transition-opacity",
          desactualizados && "opacity-60",
        )}
      >
        {clientes.map((cliente, indice) => {
          const esActual = cliente.id === clienteId;
          const esActiva = !desactualizados && indice === activo;
          // En pantallas angostas el estado va en la línea del nombre, para dejar ancho al detalle.
          const estado = (clase: string) =>
            cliente.estadoPropuesta ? (
              <EstadoBadge estado={cliente.estadoPropuesta} className={cn("shrink-0", clase)} />
            ) : null;
          return (
            <div
              key={cliente.id}
              id={idOpcion(cliente)}
              role="option"
              aria-selected={esActiva}
              aria-current={esActual || undefined}
              // El foco se queda en el buscador mientras se elige con el ratón.
              onMouseDown={(evento) => evento.preventDefault()}
              onMouseMove={() => {
                if (!desactualizados && indice !== activo) setActivo(indice);
              }}
              onClick={() => elegir(cliente)}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-lg py-2 pr-2.5 pl-3 transition-colors",
                esActiva && "bg-hoja-etiqueta",
                esActual && "cursor-default",
              )}
            >
              {esActiva ? (
                <span
                  aria-hidden
                  className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-hoja-vineta"
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                  esActual ? "bg-hoja-titulo text-white" : "bg-hoja-franja-suave text-hoja-titulo",
                )}
              >
                {esActual ? <Check className="size-4" /> : iniciales(cliente.nombre)}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {cliente.nombre}
                  </span>
                  {esActual ? (
                    <span className="shrink-0 rounded-full bg-hoja-titulo px-1.5 py-px text-[10px] font-semibold tracking-wide text-white uppercase">
                      Actual
                    </span>
                  ) : null}
                  {estado("ml-auto sm:hidden")}
                </span>
                {/* Sobre el azul claro de la opción activa, el gris no llega a 4,5:1 de contraste. */}
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground group-aria-selected:text-hoja-titulo/80">
                  <span className="truncate">{cliente.detalle}</span>
                  <span aria-hidden>·</span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1",
                      cliente.tieneMatriz && "font-medium text-hoja-vineta",
                    )}
                  >
                    <Table2 className="size-3.5" aria-hidden />
                    {cliente.tieneMatriz ? "Con matriz" : "Sin matriz"}
                  </span>
                </span>
              </span>
              {estado("max-sm:hidden")}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Popover open={abierto} onOpenChange={cambiarAbierto}>
      <PopoverTrigger asChild>
        <button
          ref={refBoton}
          type="button"
          aria-busy={navegando || undefined}
          className="group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-hoja-encabezado/30 bg-card pr-2 pl-2.5 text-[13px] font-semibold text-hoja-titulo shadow-xs transition-colors outline-none hover:border-hoja-encabezado/60 hover:bg-hoja-etiqueta focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-hoja-encabezado/60 data-[state=open]:bg-hoja-etiqueta print:hidden"
        >
          <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden />
          {navegando ? "Abriendo cliente…" : "Cambiar de cliente"}
          {/* Al volver a montarse tras el cambio, el foco llega aquí y se anuncia el cliente. */}
          <span className="sr-only"> (cliente actual: {nombreCliente})</span>
          {navegando ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <ChevronDown
              className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={16}
        aria-label="Cambiar de cliente"
        onOpenAutoFocus={(evento) => {
          evento.preventDefault();
          refEntrada.current?.focus();
        }}
        className="flex w-[min(30rem,calc(100vw_-_2rem))] flex-col overflow-hidden rounded-xl border-hoja-titulo/15 p-0 shadow-elegant"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={refEntrada}
            type="text"
            role="combobox"
            aria-label="Buscar cliente"
            aria-autocomplete="list"
            aria-expanded={hayOpciones}
            aria-controls={hayOpciones ? idLista : undefined}
            aria-activedescendant={opcionActiva ? idOpcion(opcionActiva) : undefined}
            placeholder="Nombre, documento, correo o teléfono"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={alPresionarTecla}
            maxLength={100}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-ellipsis text-foreground outline-none placeholder:text-[13px] placeholder:text-muted-foreground sm:placeholder:text-sm md:text-sm"
          />
          {/* Hueco fijo para la carga o el botón de borrar: el texto de ayuda no se mueve. */}
          <span className="grid size-7 shrink-0 place-items-center">
            {buscando ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            ) : texto ? (
              <button
                type="button"
                aria-label="Borrar la búsqueda"
                onClick={() => {
                  setTexto("");
                  refEntrada.current?.focus();
                }}
                className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-b bg-hoja-etiqueta px-4 py-1.5 text-[11px] font-semibold tracking-wider text-hoja-titulo uppercase">
          <span id={idTitulo}>{termino ? "Resultados" : "Clientes recientes"}</span>
          {hayOpciones && !desactualizados ? (
            <span className="font-medium tabular-nums">{clientes.length}</span>
          ) : null}
        </div>

        {contenido}

        <p role="status" className="sr-only">
          {anuncio}
        </p>

        <div className="flex items-center gap-3 border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span aria-hidden className="hidden items-center gap-1.5 sm:inline-flex">
            <Tecla>↑</Tecla>
            <Tecla>↓</Tecla>
            <span className="mr-1">moverse</span>
            <Tecla>Enter</Tecla>
            <span className="mr-1">abrir</span>
            <Tecla>Esc</Tecla>
            <span>cerrar</span>
          </span>
          <Link
            href="/admin/clientes"
            onClick={() => cambiarAbierto(false)}
            className="ml-auto inline-flex items-center gap-1 rounded-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Ver todos los clientes
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Tecla({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border bg-card px-1 font-sans text-[10px] font-semibold text-foreground shadow-xs">
      {children}
    </kbd>
  );
}
