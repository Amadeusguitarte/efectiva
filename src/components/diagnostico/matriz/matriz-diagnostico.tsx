"use client";

import {
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Loader2,
  Save,
  TriangleAlert,
} from "lucide-react";
import type { Route } from "next";
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { InputPesos } from "@/components/formularios/input-pesos";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import {
  calcularDiagnostico,
  type Alerta,
  type DiagnosticoEntrada,
  type ObligacionCalculada,
  type ObligacionEntrada,
} from "@/lib/diagnostico/calcular";
import {
  ESTADOS_CIVILES,
  INFO_TIPO_SERVICIO,
  TIPOS_SERVICIO,
  type EstadoCivil,
  type TipoServicio,
} from "@/lib/diagnostico/catalogos";
import {
  ajustarFilasLibres,
  filasIncluidas,
  pegarBloque,
  type FilaHoja,
} from "@/lib/diagnostico/hoja";
import { opcionesCuotas, PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";
import type { ResultadoBusquedaClientes } from "@/lib/diagnostico/selector-cliente";
import { formatearPesos, plural } from "@/lib/formato";
import type { EstadoPropuesta } from "@/lib/propuestas/estados";
import {
  CAMPOS_CLIENTE,
  TIPOS_DOCUMENTO,
  type CampoCliente,
  type ValoresCliente,
} from "@/lib/validaciones/cliente";

import { AlertasDiagnostico } from "../alertas-diagnostico";
import { FilaCalculada, FilaCampo, SelectNativo, TarjetaMatriz } from "./controles";
import { EncabezadoDashboard } from "./encabezado-dashboard";
import { GuiaClases } from "./guia-clases";
import { ResumenIndicadores } from "./resumen-indicadores";
import { ListaAcreedores, ResumenPorClase } from "./resumenes";
import { TablaObligaciones } from "./tabla-obligaciones";

type MatrizDiagnosticoProps = {
  accion: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  inicial: DiagnosticoEntrada;
  /** `updated_at` del diagnóstico cargado; detecta guardados de otras personas. */
  actualizadoAt: string | null;
  /** Fecha de la última actualización ya formateada en el servidor. */
  fechaActualizacion: string | null;
  /** Cliente de la matriz; null al crear un cliente nuevo desde la matriz. */
  cliente: { id: string; nombre: string } | null;
  /** Datos del cliente (nombre, correo, documento…) que se editan en «Datos del cliente». */
  valoresCliente: ValoresCliente;
  /** Recién creado desde la matriz: muestra el aviso una vez. */
  avisoCreado?: boolean;
  /** Búsqueda de la pestaña «Cambiar de cliente» (Server Action). */
  buscarClientes: (termino: string) => Promise<ResultadoBusquedaClientes>;
  /** Estado de la propuesta del cliente, si tiene. */
  estadoPropuesta: EstadoPropuesta | null;
};

type Datos = Omit<DiagnosticoEntrada, "obligaciones">;

/** Preguntas guía de las notas, las mismas de los comentarios de la hoja del Excel. */
const NOTAS = [
  {
    campo: "observacionesJuridicas",
    titulo: "Observaciones jurídicas",
    guia: "¿Procesos/embargos? ¿Descuentos nómina? ¿Alimentos? ¿Codeudor? ¿Bienes/garantías? ¿Cobro jurídico?",
  },
  {
    campo: "situacionUrgencia",
    titulo: "Situación / urgencia del cliente",
    guia: "¿Qué está pasando hoy? ¿Qué es lo más urgente? ¿Riesgo de embargo/remate? ¿Fecha crítica? ¿Qué pasa si no actúa?",
  },
  {
    campo: "objetivoCliente",
    titulo: "Objetivo del cliente",
    guia: "¿Qué quiere lograr? ¿Reducir cuota/detener cobros/proteger bienes? ¿Cuánto puede pagar? ¿Qué bien quiere conservar?",
  },
] as const;

function esValor<T extends string>(valores: readonly { valor: T }[], valor: string): valor is T {
  return valores.some((v) => v.valor === valor);
}

/**
 * Matriz de diagnóstico como panel de trabajo: franja de indicadores, tarjetas de datos con la
 * estética de la hoja «Diagnóstico Cliente» del Excel, tabla de obligaciones editable (Enter,
 * flechas y pegado desde el Excel) y resúmenes. Los cálculos los hace `calcularDiagnostico()`
 * mientras se escribe; se guarda con el botón, la barra inferior o Ctrl+S.
 */
export function MatrizDiagnostico({
  accion,
  inicial,
  actualizadoAt,
  fechaActualizacion,
  cliente,
  valoresCliente,
  avisoCreado = false,
  buscarClientes,
  estadoPropuesta,
}: MatrizDiagnosticoProps) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const errores = estado.errores ?? {};
  const id = useId();
  const idCampo = (nombre: string) => `${id}-${nombre}`;

  const [identidad, setIdentidad] = useState<ValoresCliente>(valoresCliente);
  const [datos, setDatos] = useState<Datos>(() => {
    const { obligaciones: _obligaciones, ...resto } = inicial;
    return resto;
  });
  const [filas, setFilas] = useState<FilaHoja[]>(() => {
    const cargadas = inicial.obligaciones.map((obligacion, clave) => ({
      clave,
      obligacion,
      enUso: true,
    }));
    let siguiente = cargadas.length;
    return ajustarFilasLibres(cargadas, () => siguiente++);
  });
  // Las claves iniciales van de 0 a filas.length - 1; las nuevas siguen desde ahí.
  const siguienteClave = useRef(filas.length);
  const nuevaClave = () => siguienteClave.current++;

  const incluidas = useMemo(() => filasIncluidas(filas), [filas]);
  const entrada = useMemo<DiagnosticoEntrada>(
    () => ({ ...datos, obligaciones: incluidas.map((f) => f.obligacion) }),
    [datos, incluidas],
  );
  const resultado = useMemo(() => calcularDiagnostico(entrada), [entrada]);
  const serializado = useMemo(() => JSON.stringify(entrada), [entrada]);
  const serializadoCliente = useMemo(
    () => JSON.stringify(Object.fromEntries(CAMPOS_CLIENTE.map((c) => [c, identidad[c]]))),
    [identidad],
  );
  // Lo que se compara para saber si hay cambios: la matriz y los datos del cliente.
  const huella = `${serializado}\n${serializadoCliente}`;

  const calculadas = useMemo(() => {
    const mapa = new Map<number, ObligacionCalculada>();
    incluidas.forEach((fila, indice) => {
      const calculada = resultado.obligaciones[indice];
      if (calculada) mapa.set(fila.clave, calculada);
    });
    return mapa;
  }, [incluidas, resultado]);

  // Las alertas del motor numeran las obligaciones guardadas; la tabla muestra el N° de la fila.
  // Los mensajes empiezan por «Obligación N» o «La obligación N».
  const alertas = useMemo<Alerta[]>(() => {
    const posicion = new Map(filas.map((f, indice) => [f.clave, indice + 1]));
    return resultado.alertas.map((alerta) => {
      if (!alerta.obligacion) return alerta;
      const fila = incluidas[alerta.obligacion - 1];
      const numero = fila ? posicion.get(fila.clave) : undefined;
      if (!numero || numero === alerta.obligacion) return alerta;
      return {
        ...alerta,
        obligacion: numero,
        mensaje: alerta.mensaje.replace(
          /^(La o|O)bligación \d+/,
          (_, inicio: string) => `${inicio}bligación ${numero}`,
        ),
      };
    });
  }, [resultado, incluidas, filas]);

  // Al responder el servidor se recuerda qué filas se enviaron (para ubicar cada error en su
  // fila aunque después se agreguen o eliminen) y si el guardado fue correcto.
  const [ultimoGuardado, setUltimoGuardado] = useState(huella);
  const [ultimoEstado, setUltimoEstado] = useState(estado);
  const [clavesEnviadas, setClavesEnviadas] = useState<number[]>([]);
  const [enviado, setEnviado] = useState(() => ({
    huella,
    claves: incluidas.map((f) => f.clave),
  }));
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    setClavesEnviadas(enviado.claves);
    if (estado.ok) setUltimoGuardado(enviado.huella);
  }
  const hayCambios = huella !== ultimoGuardado;
  const barraVisible = hayCambios || pendiente;

  function errorObligacion(clave: number, campo: keyof ObligacionEntrada) {
    const indice = clavesEnviadas.indexOf(clave);
    return indice === -1 ? undefined : errores[`obligaciones.${indice}.${campo}`]?.[0];
  }

  const refFormulario = useRef<HTMLFormElement>(null);
  const refMensaje = useRef<HTMLDivElement>(null);

  // Aviso del navegador si hay cambios sin guardar.
  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    // Los enlaces internos (Link, como las pestañas de hojas) no disparan beforeunload: se
    // confirma al hacer clic. Abrir en otra pestaña (Ctrl, Mayús…) o volver a la misma página
    // (la pestaña activa) no descarta los cambios.
    const confirmarSalida = (evento: MouseEvent) => {
      if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
      const enlace =
        evento.target instanceof Element
          ? evento.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!enlace || enlace.getAttribute("target") === "_blank") return;
      const destino = new URL(enlace.href, window.location.href);
      if (
        destino.origin === window.location.origin &&
        destino.pathname === window.location.pathname &&
        destino.search === window.location.search
      ) {
        return;
      }
      if (!window.confirm("Hay cambios sin guardar. ¿Quieres salir sin guardarlos?")) {
        evento.preventDefault();
        evento.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", avisar);
    document.addEventListener("click", confirmarSalida, true);
    return () => {
      window.removeEventListener("beforeunload", avisar);
      document.removeEventListener("click", confirmarSalida, true);
    };
  }, [hayCambios]);

  // Mientras se ve la barra fija de guardado, el desplazamiento al enfocar un campo (Tab, Enter)
  // reserva su alto para que el campo enfocado no quede debajo de ella.
  useEffect(() => {
    if (!barraVisible) return;
    const raiz = document.documentElement;
    const anterior = raiz.style.scrollPaddingBottom;
    raiz.style.scrollPaddingBottom = "6rem";
    return () => {
      raiz.style.scrollPaddingBottom = anterior;
    };
  }, [barraVisible]);

  // Ctrl+S guarda, como en Excel.
  useEffect(() => {
    const alPresionar = (evento: globalThis.KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "s") {
        evento.preventDefault();
        refFormulario.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  // Cliente recién creado desde la matriz: aviso una sola vez y se quita `?creado=1` de la URL.
  const router = useRouter();
  const ruta = usePathname();
  const avisoMostrado = useRef(false);
  useEffect(() => {
    if (!avisoCreado || avisoMostrado.current) return;
    avisoMostrado.current = true;
    toast.success("Cliente creado y matriz guardada.");
    router.replace(ruta as Route, { scroll: false });
  }, [avisoCreado, router, ruta]);

  // Tras responder el servidor: aviso de éxito, o foco en el primer campo con error (o en el
  // mensaje general si el error no es de un campo).
  useEffect(() => {
    if (!estado.mensaje) return;
    if (estado.ok) {
      toast.success(estado.mensaje);
      return;
    }
    const invalido = refFormulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalido) {
      invalido.focus({ preventScroll: true });
      invalido.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    } else {
      refMensaje.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [estado]);

  function actualizarCliente(campo: CampoCliente, valor: string) {
    setIdentidad((actual) => ({ ...actual, [campo]: valor }));
  }

  /** Error de un dato del cliente (llegan con el prefijo `cliente.`). */
  const errorCliente = (campo: CampoCliente) => errores[`cliente.${campo}`]?.[0];

  function actualizar<K extends keyof Datos>(campo: K, valor: Datos[K]) {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarTipoServicio(valor: string) {
    const tipo: TipoServicio | null = esValor(TIPOS_SERVICIO, valor) ? valor : null;
    setDatos((actual) => ({
      ...actual,
      tipoServicio: tipo,
      // Los acuerdos de pago exigen centro de conciliación.
      requiereCentroConciliacion:
        tipo !== null && tipo !== "liquidacion_patrimonial"
          ? true
          : actual.requiereCentroConciliacion,
    }));
  }

  function cambiarObligacion(clave: number, cambios: Partial<ObligacionEntrada>) {
    setFilas((actuales) =>
      ajustarFilasLibres(
        actuales.map((fila) =>
          fila.clave === clave
            ? { ...fila, enUso: true, obligacion: { ...fila.obligacion, ...cambios } }
            : fila,
        ),
        nuevaClave,
      ),
    );
  }

  function eliminarFila(clave: number) {
    setFilas((actuales) =>
      ajustarFilasLibres(
        actuales.filter((fila) => fila.clave !== clave),
        nuevaClave,
      ),
    );
  }

  function pegar(fila: number, columna: number, bloque: string[][]) {
    setFilas((actuales) =>
      ajustarFilasLibres(pegarBloque(actuales, bloque, fila, columna, nuevaClave), nuevaClave),
    );
  }

  // Enter en un campo de una línea no envía el formulario (en Excel solo cambia de celda).
  function evitarEnvioConEnter(evento: KeyboardEvent<HTMLFormElement>) {
    if (evento.key === "Enter" && evento.target instanceof HTMLInputElement) {
      evento.preventDefault();
    }
  }

  const centroObligatorio = resultado.centroConciliacion.obligatorio;
  const cantidadErrores = alertas.filter((a) => a.nivel === "error").length;
  const cantidadAvisos = alertas.length - cantidadErrores;

  const botonGuardar = (
    <Button type="submit" disabled={pendiente} aria-busy={pendiente}>
      {pendiente ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
      {pendiente ? "Guardando…" : "Guardar"}
    </Button>
  );

  return (
    <form
      ref={refFormulario}
      noValidate
      // La acción se invoca a mano: con `action={...}` React 19 reinicia el formulario al
      // terminar y los <select> de las filas añadidas en el navegador pierden su opción.
      onSubmit={(evento) => {
        evento.preventDefault();
        if (pendiente) return;
        const formData = new FormData(evento.currentTarget);
        setEnviado({ huella, claves: incluidas.map((f) => f.clave) });
        startTransition(() => accionFormulario(formData));
      }}
      onKeyDown={evitarEnvioConEnter}
      className="@container grid min-w-0 gap-6"
    >
      <input type="hidden" name="datos" value={serializado} />
      <input type="hidden" name="cliente" value={serializadoCliente} />
      <input type="hidden" name="actualizado_en" value={actualizadoAt ?? ""} />

      <EncabezadoDashboard
        hoja="diagnostico"
        cliente={cliente}
        estadoPropuesta={estadoPropuesta}
        fechaActualizacion={fechaActualizacion}
        buscarClientes={buscarClientes}
        hayCambios={hayCambios}
        acciones={
          <>
            <GuiaClases />
            {botonGuardar}
          </>
        }
        aviso={
          estado.mensaje && !estado.ok ? (
            <div ref={refMensaje}>
              <MensajeFormulario estado={estado} />
            </div>
          ) : null
        }
        franja={<ResumenIndicadores resultado={resultado} tipoServicio={datos.tipoServicio} />}
      />

      {alertas.length > 0 ? (
        <details
          open
          className="group overflow-hidden rounded-xl border bg-card shadow-soft print:hidden"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <ClipboardCheck className="size-4 text-hoja-encabezado" aria-hidden />
            <span className="text-sm font-semibold">Revisión</span>
            {cantidadErrores > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-destructive">
                <CircleAlert className="size-3.5" aria-hidden />
                {plural(cantidadErrores, "error", "errores")}
              </span>
            ) : null}
            {cantidadAvisos > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                <TriangleAlert className="size-3.5" aria-hidden />
                {plural(cantidadAvisos, "aviso", "avisos")}
              </span>
            ) : null}
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="group-open:hidden">Ver detalle</span>
              <span className="hidden group-open:inline">Ocultar</span>
              <ChevronDown
                className="size-4 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </span>
          </summary>
          <AlertasDiagnostico alertas={alertas} className="border-t px-4 py-3 @4xl:grid-cols-2" />
        </details>
      ) : null}

      {/* Dos tarjetas por fila desde 56rem y tres desde 80rem: así cada tarjeta mide al menos
          unos 26rem y las etiquetas caben en una o dos líneas. */}
      <div className="grid gap-6 @4xl:grid-cols-2 @7xl:grid-cols-3">
        <TarjetaMatriz id={idCampo("titulo-datos")} titulo="Datos del cliente">
          <FilaCampo
            etiqueta="Nombre completo"
            htmlFor={idCampo("nombre")}
            vineta
            error={errorCliente("nombre_completo")}
          >
            {(control) => (
              <Input
                {...control}
                id={idCampo("nombre")}
                value={identidad.nombre_completo}
                onChange={(e) => actualizarCliente("nombre_completo", e.target.value)}
                maxLength={160}
                autoComplete="off"
                aria-required
                aria-invalid={Boolean(errorCliente("nombre_completo")) || undefined}
                className="font-semibold"
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Documento"
            htmlFor={idCampo("documento")}
            vineta
            error={errorCliente("tipo_documento") ?? errorCliente("numero_documento")}
          >
            {(control) => (
              <div className="flex min-w-0 gap-2">
                <SelectNativo
                  aria-label="Tipo de documento"
                  aria-describedby={control["aria-describedby"]}
                  value={identidad.tipo_documento}
                  onChange={(e) => actualizarCliente("tipo_documento", e.target.value)}
                  aria-invalid={Boolean(errorCliente("tipo_documento")) || undefined}
                  className="w-24"
                >
                  <option value="">Tipo</option>
                  {Object.keys(TIPOS_DOCUMENTO).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </SelectNativo>
                <Input
                  {...control}
                  id={idCampo("documento")}
                  aria-label="Número de documento"
                  value={identidad.numero_documento}
                  onChange={(e) => actualizarCliente("numero_documento", e.target.value)}
                  maxLength={20}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={Boolean(errorCliente("numero_documento")) || undefined}
                  className="tabular-nums"
                />
              </div>
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Correo"
            htmlFor={idCampo("correo")}
            vineta
            error={errorCliente("email")}
            ayuda={cliente ? undefined : "Con este correo el cliente entra a su portal."}
          >
            {(control) => (
              <Input
                {...control}
                id={idCampo("correo")}
                type="email"
                value={identidad.email}
                onChange={(e) => actualizarCliente("email", e.target.value)}
                maxLength={254}
                autoComplete="off"
                aria-required
                aria-invalid={Boolean(errorCliente("email")) || undefined}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Teléfono"
            htmlFor={idCampo("telefono")}
            vineta
            error={errorCliente("telefono")}
          >
            {(control) => (
              <Input
                {...control}
                id={idCampo("telefono")}
                type="tel"
                value={identidad.telefono}
                onChange={(e) => actualizarCliente("telefono", e.target.value)}
                maxLength={20}
                autoComplete="off"
                placeholder="+57 300 000 0000"
                aria-invalid={Boolean(errorCliente("telefono")) || undefined}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Ciudad"
            htmlFor={idCampo("ciudad")}
            vineta
            error={errorCliente("ciudad")}
          >
            {(control) => (
              <Input
                {...control}
                id={idCampo("ciudad")}
                value={identidad.ciudad}
                onChange={(e) => actualizarCliente("ciudad", e.target.value)}
                maxLength={80}
                autoComplete="off"
                aria-invalid={Boolean(errorCliente("ciudad")) || undefined}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Ocupación"
            htmlFor={idCampo("ocupacion")}
            vineta
            error={errores.ocupacion?.[0]}
          >
            {(control) => (
              <Input
                {...control}
                id={idCampo("ocupacion")}
                value={datos.ocupacion ?? ""}
                onChange={(e) => actualizar("ocupacion", e.target.value)}
                maxLength={200}
                aria-invalid={Boolean(errores.ocupacion) || undefined}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Ingresos mensuales"
            htmlFor={idCampo("ingresos")}
            vineta
            error={errores.ingresosMensuales?.[0]}
          >
            {(control) => (
              <InputPesos
                {...control}
                id={idCampo("ingresos")}
                valor={datos.ingresosMensuales}
                onCambio={(valor) => actualizar("ingresosMensuales", valor)}
                aria-invalid={Boolean(errores.ingresosMensuales) || undefined}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Gastos mensuales aproximados"
            htmlFor={idCampo("gastos")}
            vineta
            error={errores.gastosMensuales?.[0]}
          >
            {(control) => (
              <InputPesos
                {...control}
                id={idCampo("gastos")}
                valor={datos.gastosMensuales}
                onCambio={(valor) => actualizar("gastosMensuales", valor)}
                aria-invalid={Boolean(errores.gastosMensuales) || undefined}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Bienes a nombre del deudor"
            htmlFor={idCampo("bienes")}
            vineta
            error={errores.bienes?.[0]}
          >
            {(control) => (
              <Textarea
                {...control}
                id={idCampo("bienes")}
                value={datos.bienes ?? ""}
                onChange={(e) => actualizar("bienes", e.target.value)}
                maxLength={2000}
                rows={2}
                aria-invalid={Boolean(errores.bienes) || undefined}
                className="min-h-9 py-1.5"
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Estado civil"
            htmlFor={idCampo("estado-civil")}
            vineta
            error={errores.estadoCivil?.[0]}
          >
            {(control) => (
              <SelectNativo
                {...control}
                id={idCampo("estado-civil")}
                value={datos.estadoCivil ?? ""}
                onChange={(e) =>
                  actualizar(
                    "estadoCivil",
                    esValor(ESTADOS_CIVILES, e.target.value)
                      ? (e.target.value as EstadoCivil)
                      : null,
                  )
                }
                aria-invalid={Boolean(errores.estadoCivil) || undefined}
              >
                <option value="">Sin definir</option>
                {ESTADOS_CIVILES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </SelectNativo>
            )}
          </FilaCampo>
        </TarjetaMatriz>

        <TarjetaMatriz id={idCampo("titulo-servicio")} titulo="Servicio y honorarios">
          <FilaCampo
            etiqueta="Tipo de servicio"
            htmlFor={idCampo("tipo-servicio")}
            error={errores.tipoServicio?.[0]}
            ayuda={
              datos.tipoServicio ? INFO_TIPO_SERVICIO[datos.tipoServicio].descripcion : undefined
            }
          >
            {(control) => (
              <SelectNativo
                {...control}
                id={idCampo("tipo-servicio")}
                value={datos.tipoServicio ?? ""}
                onChange={(e) => cambiarTipoServicio(e.target.value)}
                aria-invalid={Boolean(errores.tipoServicio) || undefined}
              >
                <option value="">Selecciona…</option>
                {TIPOS_SERVICIO.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </SelectNativo>
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="% Honorarios"
            htmlFor={idCampo("porcentaje")}
            error={errores.porcentajeHonorarios?.[0]}
          >
            {(control) => (
              <PorcentajeHonorarios
                id={idCampo("porcentaje")}
                descripcion={control["aria-describedby"]}
                inicial={inicial.porcentajeHonorarios}
                onCambio={(valor) => actualizar("porcentajeHonorarios", valor)}
                invalido={Boolean(errores.porcentajeHonorarios)}
              />
            )}
          </FilaCampo>
          <FilaCampo
            etiqueta="Cuotas de honorarios"
            htmlFor={idCampo("cuotas")}
            error={errores.cuotasHonorarios?.[0]}
          >
            {(control) => (
              <SelectNativo
                {...control}
                id={idCampo("cuotas")}
                value={datos.cuotasHonorarios}
                onChange={(e) => actualizar("cuotasHonorarios", Number(e.target.value))}
                aria-invalid={Boolean(errores.cuotasHonorarios) || undefined}
                className="tabular-nums"
              >
                {opcionesCuotas().map((n) => (
                  <option key={n} value={n}>
                    {plural(n, "cuota", "cuotas")}
                  </option>
                ))}
              </SelectNativo>
            )}
          </FilaCampo>
          <FilaCalculada etiqueta="Valor de la cuota">
            {formatearPesos(resultado.honorarios.valorCuota)}
          </FilaCalculada>
          <FilaCampo
            etiqueta="Requiere centro de conciliación"
            htmlFor={idCampo("centro")}
            ayuda={
              centroObligatorio
                ? "Obligatorio en los acuerdos de pago."
                : "En liquidación patrimonial puede usarse la justicia ordinaria."
            }
          >
            {(control) => (
              <SelectNativo
                {...control}
                id={idCampo("centro")}
                value={datos.requiereCentroConciliacion ? "si" : "no"}
                onChange={(e) => actualizar("requiereCentroConciliacion", e.target.value === "si")}
                disabled={centroObligatorio}
              >
                <option value="si">Sí</option>
                <option value="no">No</option>
              </SelectNativo>
            )}
          </FilaCampo>
          <FilaCalculada etiqueta="Tarifa del centro">
            {formatearPesos(resultado.centroConciliacion.tarifa)}
          </FilaCalculada>
          <FilaCampo
            etiqueta="Descuento del centro"
            htmlFor={idCampo("descuento")}
            error={errores.descuentoCentroConciliacion?.[0]}
          >
            {(control) => (
              <InputPesos
                {...control}
                id={idCampo("descuento")}
                valor={datos.descuentoCentroConciliacion || null}
                onCambio={(valor) => actualizar("descuentoCentroConciliacion", valor ?? 0)}
                aria-invalid={Boolean(errores.descuentoCentroConciliacion) || undefined}
              />
            )}
          </FilaCampo>
        </TarjetaMatriz>

        <TarjetaMatriz
          id={idCampo("titulo-notas")}
          titulo="Notas del caso"
          className="@4xl:col-span-2 @7xl:col-span-1"
        >
          <div className="grid flex-1 gap-4 p-4 @2xl/tarjeta:grid-cols-3">
            {NOTAS.map(({ campo, titulo, guia }) => {
              const error = errores[campo]?.[0];
              const idError = `${idCampo(campo)}-error`;
              return (
                <div key={campo} className="grid content-start gap-1.5">
                  <label
                    htmlFor={idCampo(campo)}
                    className="flex items-center gap-2 text-[13px] font-semibold text-hoja-titulo"
                  >
                    <span aria-hidden className="size-1.5 rounded-full bg-hoja-vineta" />
                    {titulo}
                  </label>
                  <Textarea
                    id={idCampo(campo)}
                    placeholder={guia}
                    value={datos[campo] ?? ""}
                    onChange={(e) => actualizar(campo, e.target.value)}
                    maxLength={5000}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={error ? idError : undefined}
                    className="min-h-24 border-hoja-encabezado/20 bg-hoja-etiqueta text-sm placeholder:text-muted-foreground"
                  />
                  {error ? (
                    <p id={idError} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </TarjetaMatriz>
      </div>

      <TablaObligaciones
        filas={filas}
        calculadas={calculadas}
        resultado={resultado}
        errorGeneral={errores.obligaciones?.[0]}
        error={errorObligacion}
        onCambiar={cambiarObligacion}
        onEliminar={eliminarFila}
        onPegar={pegar}
      />

      {/* Las dos tarjetas miden lo mismo: la más corta reparte el espacio sobrante en su tabla. */}
      <div className="grid gap-6 @5xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ResumenPorClase resultado={resultado} />
        <ListaAcreedores resultado={resultado} />
      </div>

      {barraVisible ? (
        <div className="sticky bottom-4 z-30 print:hidden">
          <div className="flex animate-in flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/30 bg-card py-2.5 pr-2.5 pl-4 shadow-elegant duration-200 fade-in slide-in-from-bottom-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-warning" />
            <p role="status" className="text-sm font-semibold text-foreground">
              {pendiente ? "Guardando los cambios…" : "Tienes cambios sin guardar"}
            </p>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Ctrl+S para guardar
            </span>
            <div className="ml-auto">{botonGuardar}</div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

/** % de honorarios: número libre con las opciones de la lista del Excel como sugerencias. */
function PorcentajeHonorarios({
  id,
  descripcion,
  inicial,
  onCambio,
  invalido,
}: {
  id: string;
  /** Id del error del campo (`aria-describedby`). */
  descripcion: string | undefined;
  inicial: number;
  onCambio: (valor: number) => void;
  invalido: boolean;
}) {
  const [texto, setTexto] = useState(String(inicial));
  const idLista = `${id}-lista`;
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step={0.5}
        list={idLista}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          onCambio(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 0);
        }}
        aria-invalid={invalido || undefined}
        aria-describedby={descripcion}
        className="[appearance:textfield] pr-8 text-right tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
      >
        %
      </span>
      <datalist id={idLista}>
        {PARAMETROS_DIAGNOSTICO.honorarios.porcentajesSugeridos.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </div>
  );
}
