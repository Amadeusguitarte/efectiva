"use client";

import {
  CircleAlert,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  Save,
  TriangleAlert,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";

import { InputPesos } from "@/components/formularios/input-pesos";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Button } from "@/components/ui/button";
import logoBlanco from "@/assets/images/logo-blanco.png";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import {
  calcularDiagnostico,
  obligacionVacia,
  type Alerta,
  type DiagnosticoEntrada,
  type ObligacionCalculada,
  type ObligacionEntrada,
  type ResultadoDiagnostico,
} from "@/lib/diagnostico/calcular";
import {
  ESTADOS_CIVILES,
  TIPOS_SERVICIO,
  type EstadoCivil,
  type TipoServicio,
} from "@/lib/diagnostico/catalogos";
import {
  FILAS_MINIMAS,
  FILA_ENCABEZADO_TABLA,
  completarFilas,
  filasIncluidas,
  formulasHoja,
  pegarBloque,
  type FilaHoja,
} from "@/lib/diagnostico/hoja";
import { PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";
import { formatearPesos, formatearPorcentaje } from "@/lib/formato";
import { cn } from "cn";

import { AlertasDiagnostico } from "../alertas-diagnostico";
import { CONTROL_CELDA, Celda, Encabezado, Etiqueta, SELECT_CELDA } from "./celdas";
import { ANCHO_HOJA, PLANTILLA_COLUMNAS, ubicar } from "./columnas";
import { GuiaClases } from "./guia-clases";
import { ListaAcreedores, ResumenPorClase } from "./resumenes-hoja";
import { TablaObligaciones } from "./tabla-obligaciones";

type HojaDiagnosticoProps = {
  accion: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  inicial: DiagnosticoEntrada;
  /** `updated_at` del diagnóstico cargado; detecta guardados de otras personas. */
  actualizadoAt: string | null;
  nombreCliente: string;
  /** Hoja DATOS PROPUESTA; null mientras la matriz no se haya guardado nunca. */
  rutaDatosPropuesta: Route | null;
};

type Datos = Omit<DiagnosticoEntrada, "obligaciones">;
type Pestana = "diagnostico" | "guia";

const NOTAS = {
  observaciones:
    "¿Procesos/embargos? ¿Descuentos nómina? ¿Alimentos? ¿Codeudor? ¿Bienes/garantías? ¿Cobro jurídico?",
  situacion:
    "¿Qué está pasando hoy? ¿Qué es lo más urgente? ¿Riesgo de embargo/remate? ¿Fecha crítica? ¿Qué pasa si no actúa?",
  objetivo:
    "¿Qué quiere lograr? ¿Reducir cuota/detener cobros/proteger bienes? ¿Cuánto puede pagar? ¿Qué bien quiere conservar?",
};

/** Alturas de las filas 1 a 13 de la hoja (proporcionales a las del Excel). */
const ALTURAS_FILAS = [112, 10, 14, 32, 64, 46, 46, 54, 64, 46, 40, 12, 64];

function esValor<T extends string>(valores: readonly { valor: T }[], valor: string): valor is T {
  return valores.some((v) => v.valor === valor);
}

function textoElegibilidad(resultado: ResultadoDiagnostico): string {
  const { elegibilidad } = resultado;
  const { minimoObligacionesEnMora, minimoAcreedoresEnMora, umbralPasivoEnMora } =
    PARAMETROS_DIAGNOSTICO.elegibilidad;
  const marca = (cumple: boolean) => (cumple ? "✓" : "✗");
  return [
    `${marca(elegibilidad.cumple.obligaciones)} Obligaciones con mora > 90 días: ${elegibilidad.obligacionesEnMora} (mínimo ${minimoObligacionesEnMora})`,
    `${marca(elegibilidad.cumple.acreedores)} Acreedores distintos en mora: ${elegibilidad.acreedoresEnMora} (mínimo ${minimoAcreedoresEnMora})`,
    `${marca(elegibilidad.cumple.porcentaje)} Pasivo en mora: ${formatearPorcentaje(elegibilidad.porcentajeEnMora, 1)} (mínimo ${formatearPorcentaje(umbralPasivoEnMora)})`,
  ].join("\n");
}

/**
 * Matriz de diagnóstico con el aspecto y el funcionamiento de la hoja «Diagnóstico Cliente» del
 * Excel original: mismas secciones y colores, 20 filas de obligaciones, listas desplegables,
 * fórmulas visibles en la barra de fórmulas, navegación con Enter y flechas, pegado de bloques
 * copiados del Excel y guardado con Ctrl+S. Los cálculos los hace `calcularDiagnostico()`.
 */
export function HojaDiagnostico({
  accion,
  inicial,
  actualizadoAt,
  nombreCliente,
  rutaDatosPropuesta,
}: HojaDiagnosticoProps) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const errores = estado.errores ?? {};
  const id = useId();

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
    return completarFilas(cargadas, () => siguiente++);
  });
  const siguienteClave = useRef(Math.max(inicial.obligaciones.length, FILAS_MINIMAS));
  const nuevaClave = () => siguienteClave.current++;

  const incluidas = useMemo(() => filasIncluidas(filas), [filas]);
  const entrada = useMemo<DiagnosticoEntrada>(
    () => ({ ...datos, obligaciones: incluidas.map((f) => f.obligacion) }),
    [datos, incluidas],
  );
  const resultado = useMemo(() => calcularDiagnostico(entrada), [entrada]);
  const serializado = useMemo(() => JSON.stringify(entrada), [entrada]);

  const calculadas = useMemo(() => {
    const mapa = new Map<number, ObligacionCalculada>();
    incluidas.forEach((fila, indice) => {
      const calculada = resultado.obligaciones[indice];
      if (calculada) mapa.set(fila.clave, calculada);
    });
    return mapa;
  }, [incluidas, resultado]);

  // Las alertas del motor numeran las obligaciones guardadas; la hoja muestra el N° de la fila.
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
        mensaje: alerta.mensaje.replace(/^Obligación \d+/, `Obligación ${numero}`),
      };
    });
  }, [resultado, incluidas, filas]);

  // Al responder el servidor se recuerda qué filas se enviaron (para ubicar cada error en su
  // fila aunque después se agreguen o eliminen) y si el guardado fue correcto.
  const [ultimoGuardado, setUltimoGuardado] = useState(serializado);
  const [ultimoEstado, setUltimoEstado] = useState(estado);
  const [clavesEnviadas, setClavesEnviadas] = useState<number[]>([]);
  const [enviado, setEnviado] = useState(() => ({
    serializado,
    claves: incluidas.map((f) => f.clave),
  }));
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    setClavesEnviadas(enviado.claves);
    if (estado.ok) setUltimoGuardado(enviado.serializado);
  }
  const hayCambios = serializado !== ultimoGuardado;

  function errorObligacion(clave: number, campo: keyof ObligacionEntrada) {
    const indice = clavesEnviadas.indexOf(clave);
    return indice === -1 ? undefined : errores[`obligaciones.${indice}.${campo}`]?.[0];
  }

  const [ampliada, setAmpliada] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("diagnostico");
  const [celdaActiva, setCeldaActiva] = useState({ celda: "C6", contenido: "" });

  const refFormulario = useRef<HTMLFormElement>(null);
  const refMensaje = useRef<HTMLDivElement>(null);

  // Aviso del navegador si hay cambios sin guardar.
  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    // Los enlaces internos (Link) no disparan beforeunload: se confirma al hacer clic.
    const confirmarSalida = (evento: MouseEvent) => {
      const enlace = evento.target instanceof Element ? evento.target.closest("a[href]") : null;
      if (!enlace || enlace.getAttribute("target") === "_blank") return;
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

  // Ctrl+S guarda (como en Excel) y Esc sale de la pantalla completa.
  useEffect(() => {
    const alPresionar = (evento: globalThis.KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "s") {
        evento.preventDefault();
        refFormulario.current?.requestSubmit();
      } else if (evento.key === "Escape" && ampliada) {
        setAmpliada(false);
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [ampliada]);

  // Tras responder el servidor: foco en la primera celda con error o en el mensaje general.
  useEffect(() => {
    if (!estado.mensaje) return;
    const invalido = refFormulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalido) {
      invalido.focus({ preventScroll: true });
      invalido.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    } else {
      refMensaje.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [estado]);

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
      actuales.map((fila) =>
        fila.clave === clave
          ? { ...fila, enUso: true, obligacion: { ...fila.obligacion, ...cambios } }
          : fila,
      ),
    );
  }

  function eliminarFila(clave: number) {
    setFilas((actuales) =>
      completarFilas(
        actuales.filter((fila) => fila.clave !== clave),
        nuevaClave,
      ),
    );
  }

  function agregarFilas(cantidad = 5) {
    setFilas((actuales) => [
      ...actuales,
      ...Array.from({ length: cantidad }, () => ({
        clave: nuevaClave(),
        obligacion: obligacionVacia(),
        enUso: false,
      })),
    ]);
  }

  function pegar(fila: number, columna: number, bloque: string[][]) {
    setFilas((actuales) => pegarBloque(actuales, bloque, fila, columna, nuevaClave));
  }

  /** Muestra en la barra de fórmulas la celda seleccionada: su fórmula o su contenido. */
  function leerCelda(evento: SyntheticEvent) {
    const objetivo = evento.target;
    if (!(objetivo instanceof HTMLElement)) return;
    const contenedor = objetivo.closest<HTMLElement>("[data-celda]");
    if (!contenedor?.dataset.celda) return;
    let contenido = contenedor.dataset.formula ?? "";
    if (!contenedor.dataset.formula) {
      const control =
        objetivo instanceof HTMLInputElement ||
        objetivo instanceof HTMLTextAreaElement ||
        objetivo instanceof HTMLSelectElement
          ? objetivo
          : contenedor.querySelector("input, textarea, select");
      if (control instanceof HTMLSelectElement) {
        contenido = control.selectedOptions[0]?.text ?? "";
      } else if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
        contenido = control.value;
      } else {
        contenido = contenedor.textContent ?? "";
      }
    }
    setCeldaActiva({ celda: contenedor.dataset.celda, contenido });
  }

  // Enter en un campo de una línea no envía el formulario (en Excel solo cambia de celda).
  function evitarEnvioConEnter(evento: KeyboardEvent<HTMLFormElement>) {
    if (evento.key === "Enter" && evento.target instanceof HTMLInputElement) {
      evento.preventDefault();
    }
  }

  const formulas = formulasHoja(filas.length);
  const centroObligatorio = resultado.centroConciliacion.obligatorio;
  const cantidadErrores = alertas.filter((a) => a.nivel === "error").length;
  const avisos = alertas.length - cantidadErrores;
  const filaResumen = FILA_ENCABEZADO_TABLA + filas.length + 3;
  const filaAcreedores = filaResumen + 9;
  const idCampo = (nombre: string) => `${id}-${nombre}`;
  const elegibilidad = resultado.elegibilidad.estado;

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
        setEnviado({ serializado, claves: incluidas.map((f) => f.clave) });
        startTransition(() => accionFormulario(formData));
      }}
      onKeyDown={evitarEnvioConEnter}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden border border-hoja-cuadricula bg-hoja-marco font-hoja text-hoja-texto shadow-soft",
        ampliada ? "fixed inset-0 z-50" : "relative rounded-md",
      )}
    >
      <input type="hidden" name="datos" value={serializado} />
      <input type="hidden" name="actualizado_en" value={actualizadoAt ?? ""} />

      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hoja-cuadricula bg-hoja-fondo px-3 py-2 font-sans print:hidden">
        <Button type="submit" size="sm" disabled={pendiente} aria-busy={pendiente}>
          {pendiente ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl+S</span>
        <span
          className={cn("text-sm", hayCambios ? "text-warning" : "text-muted-foreground")}
          aria-live="polite"
        >
          {hayCambios ? "Cambios sin guardar" : "Todo guardado"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => agregarFilas()}>
            <Plus aria-hidden />
            Agregar filas
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAmpliada((valor) => !valor)}
            aria-pressed={ampliada}
          >
            {ampliada ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
            {ampliada ? "Salir de pantalla completa" : "Pantalla completa"}
          </Button>
        </div>
      </div>

      <div ref={refMensaje} className="font-sans print:hidden">
        <MensajeFormulario estado={estado} className="rounded-none border-x-0 border-t-0" />
        {alertas.length > 0 ? (
          <details className="group border-b border-hoja-cuadricula bg-hoja-fondo px-3 py-1.5 text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-3">
              <span className="font-medium">Revisión</span>
              {cantidadErrores > 0 ? (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <CircleAlert className="size-4" aria-hidden />
                  {cantidadErrores} {cantidadErrores === 1 ? "error" : "errores"}
                </span>
              ) : null}
              {avisos > 0 ? (
                <span className="inline-flex items-center gap-1 text-warning">
                  <TriangleAlert className="size-4" aria-hidden />
                  {avisos} {avisos === 1 ? "aviso" : "avisos"}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground group-open:hidden">Ver detalle</span>
              <span className="hidden text-xs text-muted-foreground group-open:inline">
                Ocultar
              </span>
            </summary>
            <AlertasDiagnostico alertas={alertas} className="mt-2 mb-1" />
          </details>
        ) : null}
      </div>

      {/* Barra de fórmulas */}
      <div
        className="flex items-stretch border-b border-hoja-cuadricula bg-hoja-fondo text-[13px] print:hidden"
        aria-label="Barra de fórmulas"
        role="group"
      >
        <output className="flex w-20 shrink-0 items-center border-r border-hoja-cuadricula px-2 tabular-nums">
          {pestana === "diagnostico" ? celdaActiva.celda : ""}
        </output>
        <span className="flex items-center border-r border-hoja-cuadricula px-2 text-hoja-texto/60 italic">
          fx
        </span>
        <output className="min-w-0 flex-1 truncate px-2 py-1">
          {pestana === "diagnostico" ? celdaActiva.contenido : ""}
        </output>
      </div>

      {/* Hoja */}
      <div
        className={cn("min-h-0 overflow-auto bg-hoja-marco", ampliada ? "flex-1" : "max-h-[78vh]")}
        onFocus={leerCelda}
        onChange={leerCelda}
      >
        <div hidden={pestana !== "diagnostico"} className="p-3">
          <div
            className="grid bg-hoja-fondo text-[14px] leading-snug"
            style={{
              width: ANCHO_HOJA,
              gridTemplateColumns: PLANTILLA_COLUMNAS,
              gridTemplateRows: ALTURAS_FILAS.map((h) => `${h}px`).join(" "),
            }}
          >
            {/* Fila 1: título con el logo, fila 2: banda azul */}
            <div
              style={ubicar("B", "M", 1)}
              className="relative flex items-center justify-center bg-hoja-titulo px-6"
            >
              <Image
                src={logoBlanco}
                alt="Insolvencia Efectiva"
                className="absolute top-1/2 left-6 h-auto w-40 -translate-y-1/2"
                priority
              />
              <h2 className="pl-40 text-center text-[26px] leading-tight font-bold text-white">
                MATRIZ DE DIAGNÓSTICO DE CLIENTES – INSOLVENCIA EFECTIVA
              </h2>
            </div>
            <div style={ubicar("B", "M", 2)} className="bg-hoja-banda" />

            {/* Fila 4: encabezados de sección */}
            <Encabezado style={ubicar("B", "C", 4)}>DATOS DEL CLIENTE</Encabezado>
            <Encabezado style={ubicar("E", "I", 4)}>
              INDICADORES DE ELEGIBILIDAD PRELIMINAR
            </Encabezado>
            <Encabezado style={ubicar("K", "M", 4)} comentario={NOTAS.observaciones}>
              Observaciones Jurídicas
            </Encabezado>

            {/* Datos del cliente (B5:C11) */}
            <Etiqueta style={ubicar("B", "B", 5)} vineta>
              Nombre
            </Etiqueta>
            <Celda celda="C5" style={ubicar("C", "C", 5)} calculada className="items-center px-1.5">
              <span title="Se edita en la ficha del cliente">{nombreCliente}</span>
            </Celda>

            <Etiqueta style={ubicar("B", "B", 6)} htmlFor={idCampo("ocupacion")} vineta>
              Ocupación
            </Etiqueta>
            <Celda celda="C6" style={ubicar("C", "C", 6)}>
              <input
                id={idCampo("ocupacion")}
                value={datos.ocupacion ?? ""}
                onChange={(e) => actualizar("ocupacion", e.target.value)}
                maxLength={200}
                aria-invalid={Boolean(errores.ocupacion) || undefined}
                title={errores.ocupacion?.[0]}
                className={CONTROL_CELDA}
              />
            </Celda>

            <Etiqueta style={ubicar("B", "B", 7)} htmlFor={idCampo("ingresos")} vineta>
              Ingresos mensuales
            </Etiqueta>
            <Celda celda="C7" style={ubicar("C", "C", 7)}>
              <InputPesos
                id={idCampo("ingresos")}
                valor={datos.ingresosMensuales}
                onCambio={(valor) => actualizar("ingresosMensuales", valor)}
                ocultarSimboloVacio
                aria-invalid={Boolean(errores.ingresosMensuales) || undefined}
                title={errores.ingresosMensuales?.[0]}
                className={cn(CONTROL_CELDA, "h-full pl-5 text-left")}
                classNameSimbolo="left-1.5 text-[14px] text-hoja-texto"
              />
            </Celda>

            <Etiqueta style={ubicar("B", "B", 8)} htmlFor={idCampo("gastos")} vineta>
              Gastos mensuales aproximados
            </Etiqueta>
            <Celda celda="C8" style={ubicar("C", "C", 8)}>
              <InputPesos
                id={idCampo("gastos")}
                valor={datos.gastosMensuales}
                onCambio={(valor) => actualizar("gastosMensuales", valor)}
                ocultarSimboloVacio
                aria-invalid={Boolean(errores.gastosMensuales) || undefined}
                title={errores.gastosMensuales?.[0]}
                className={cn(CONTROL_CELDA, "h-full pl-5 text-left")}
                classNameSimbolo="left-1.5 text-[14px] text-hoja-texto"
              />
            </Celda>

            <Etiqueta style={ubicar("B", "B", 9)} htmlFor={idCampo("bienes")} vineta>
              Bienes a nombre del deudor
            </Etiqueta>
            <Celda celda="C9" style={ubicar("C", "C", 9)}>
              <textarea
                id={idCampo("bienes")}
                value={datos.bienes ?? ""}
                onChange={(e) => actualizar("bienes", e.target.value)}
                maxLength={2000}
                aria-invalid={Boolean(errores.bienes) || undefined}
                title={errores.bienes?.[0]}
                className={cn(CONTROL_CELDA, "resize-none py-1")}
              />
            </Celda>

            <Etiqueta style={ubicar("B", "B", 10)} htmlFor={idCampo("estado-civil")} vineta>
              Estado civil
            </Etiqueta>
            <Celda celda="C10" style={ubicar("C", "C", 10)}>
              <select
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
                className={SELECT_CELDA}
              >
                <option value="" />
                {ESTADOS_CIVILES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>
            </Celda>

            <Etiqueta style={ubicar("B", "B", 11)} className="justify-start text-left">
              Elegibilidad del deudor
            </Etiqueta>
            <Celda
              celda="C11"
              formula={formulas.elegibilidad}
              style={ubicar("C", "C", 11)}
              calculada
              className={cn(
                "items-center justify-center font-bold",
                elegibilidad === "elegible" && "bg-hoja-elegible text-white",
                elegibilidad === "no_elegible" && "bg-danger-soft text-destructive",
              )}
            >
              <span title={textoElegibilidad(resultado)}>
                {elegibilidad === "elegible"
                  ? "ELEGIBLE"
                  : elegibilidad === "no_elegible"
                    ? "NO ELEGIBLE"
                    : ""}
              </span>
            </Celda>

            {/* Indicadores (E5:F9) */}
            <Etiqueta style={ubicar("E", "E", 5)}>Pasivo total</Etiqueta>
            <Celda
              celda="F5"
              formula={formulas.pasivoTotal}
              style={ubicar("F", "F", 5)}
              calculada
              className="items-center px-2 text-[18px] tabular-nums"
            >
              {formatearPesos(resultado.pasivoTotal)}
            </Celda>

            <Etiqueta style={ubicar("E", "E", 6)} htmlFor={idCampo("tipo-servicio")}>
              Tipo de servicio
            </Etiqueta>
            <Celda celda="F6" style={ubicar("F", "F", 6)}>
              <select
                id={idCampo("tipo-servicio")}
                value={datos.tipoServicio ?? ""}
                onChange={(e) => cambiarTipoServicio(e.target.value)}
                aria-invalid={Boolean(errores.tipoServicio) || undefined}
                title={
                  datos.tipoServicio
                    ? TIPOS_SERVICIO.find((t) => t.valor === datos.tipoServicio)?.descripcion
                    : undefined
                }
                className={cn(SELECT_CELDA, "text-[15px] leading-tight whitespace-normal")}
              >
                <option value="" />
                {TIPOS_SERVICIO.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiquetaPropuesta}
                  </option>
                ))}
              </select>
            </Celda>

            <Etiqueta style={ubicar("E", "E", 7)} htmlFor={idCampo("porcentaje")}>
              % Honorarios
            </Etiqueta>
            <Celda celda="F7" style={ubicar("F", "F", 7)} className="relative">
              <PorcentajeHonorarios
                id={idCampo("porcentaje")}
                inicial={inicial.porcentajeHonorarios}
                onCambio={(valor) => actualizar("porcentajeHonorarios", valor)}
                error={errores.porcentajeHonorarios?.[0]}
              />
            </Celda>

            <Etiqueta style={ubicar("E", "E", 8)}>$ Honorarios</Etiqueta>
            <Celda
              celda="F8"
              formula={formulas.honorarios}
              style={ubicar("F", "F", 8)}
              calculada
              className="items-center px-2 text-[18px] tabular-nums"
            >
              {formatearPesos(resultado.honorarios.valor)}
            </Celda>

            <Etiqueta style={ubicar("E", "E", 9)}>Costo del proceso</Etiqueta>
            <Celda
              celda="F9"
              formula={formulas.costoProceso}
              style={ubicar("F", "F", 9)}
              calculada
              className="items-center px-2 text-[18px] tabular-nums"
            >
              <span
                title={`Honorarios ${formatearPesos(resultado.honorarios.valor)} + gastos del proceso ${formatearPesos(resultado.gastosProceso)}${resultado.centroConciliacion.aplica ? ` + centro de conciliación ${formatearPesos(resultado.centroConciliacion.valor)}` : ""}`}
              >
                {formatearPesos(resultado.costoProceso)}
              </span>
            </Celda>

            {/* Indicadores (H5:I9) */}
            <Etiqueta style={ubicar("H", "H", 5)} htmlFor={idCampo("cuotas")}>
              Cuotas de honorarios
            </Etiqueta>
            <Celda celda="I5" style={ubicar("I", "I", 5)}>
              <select
                id={idCampo("cuotas")}
                value={datos.cuotasHonorarios}
                onChange={(e) => actualizar("cuotasHonorarios", Number(e.target.value))}
                aria-invalid={Boolean(errores.cuotasHonorarios) || undefined}
                className={cn(SELECT_CELDA, "text-center text-[18px] tabular-nums")}
              >
                {Array.from(
                  { length: PARAMETROS_DIAGNOSTICO.honorarios.cuotasMaximas },
                  (_, i) => i + 1,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Celda>

            <Etiqueta style={ubicar("H", "H", 6)}>Valor de la cuota</Etiqueta>
            <Celda
              celda="I6"
              formula={formulas.valorCuota}
              style={ubicar("I", "I", 6)}
              calculada
              className="items-center justify-center px-1 text-[18px] tabular-nums"
            >
              {formatearPesos(resultado.honorarios.valorCuota)}
            </Celda>

            <Etiqueta style={ubicar("H", "H", 7)} htmlFor={idCampo("centro")}>
              Requiere centro de conciliación
            </Etiqueta>
            <Celda celda="I7" style={ubicar("I", "I", 7)}>
              <select
                id={idCampo("centro")}
                value={datos.requiereCentroConciliacion ? "si" : "no"}
                onChange={(e) => actualizar("requiereCentroConciliacion", e.target.value === "si")}
                disabled={centroObligatorio}
                title={
                  centroObligatorio
                    ? "Obligatorio en los acuerdos de pago."
                    : "En liquidación patrimonial puede usarse la justicia ordinaria."
                }
                className={cn(SELECT_CELDA, "text-center text-[18px]")}
              >
                <option value="si">SI</option>
                <option value="no">NO</option>
              </select>
            </Celda>

            <Etiqueta style={ubicar("H", "H", 8)}>Valor del centro de conciliación</Etiqueta>
            <Celda
              celda="I8"
              formula={formulas.tarifaCentro}
              style={ubicar("I", "I", 8)}
              calculada
              className="items-center justify-center px-1 text-[18px] tabular-nums"
            >
              {formatearPesos(resultado.centroConciliacion.tarifa)}
            </Celda>

            <Etiqueta style={ubicar("H", "H", 9)} htmlFor={idCampo("descuento")}>
              Descuento centro de conciliación
            </Etiqueta>
            <Celda celda="I9" style={ubicar("I", "I", 9)}>
              <InputPesos
                id={idCampo("descuento")}
                valor={datos.descuentoCentroConciliacion || null}
                onCambio={(valor) => actualizar("descuentoCentroConciliacion", valor ?? 0)}
                aria-invalid={Boolean(errores.descuentoCentroConciliacion) || undefined}
                title={errores.descuentoCentroConciliacion?.[0]}
                className={cn(CONTROL_CELDA, "h-full pl-5 text-[18px]")}
                classNameSimbolo="left-1.5 text-[18px] text-hoja-texto"
              />
            </Celda>

            {/* Notas (K5:M13) */}
            <Celda celda="K5" style={ubicar("K", "M", 5, 6)} className="bg-hoja-etiqueta">
              <textarea
                aria-label="Observaciones jurídicas"
                placeholder={NOTAS.observaciones}
                value={datos.observacionesJuridicas ?? ""}
                onChange={(e) => actualizar("observacionesJuridicas", e.target.value)}
                maxLength={5000}
                aria-invalid={Boolean(errores.observacionesJuridicas) || undefined}
                className={cn(CONTROL_CELDA, "resize-none py-1 text-[13px] font-semibold")}
              />
            </Celda>
            <Encabezado style={ubicar("K", "M", 7)} comentario={NOTAS.situacion}>
              Situación/urgencia del cliente
            </Encabezado>
            <Celda celda="K8" style={ubicar("K", "M", 8, 9)} className="bg-hoja-etiqueta">
              <textarea
                aria-label="Situación y urgencia del cliente"
                placeholder={NOTAS.situacion}
                value={datos.situacionUrgencia ?? ""}
                onChange={(e) => actualizar("situacionUrgencia", e.target.value)}
                maxLength={5000}
                aria-invalid={Boolean(errores.situacionUrgencia) || undefined}
                className={cn(CONTROL_CELDA, "resize-none py-1 text-[13px] font-semibold")}
              />
            </Celda>
            <Encabezado style={ubicar("K", "M", 10)} comentario={NOTAS.objetivo}>
              Objetivo del cliente
            </Encabezado>
            <Celda celda="K11" style={ubicar("K", "M", 11, 13)} className="bg-hoja-etiqueta">
              <textarea
                aria-label="Objetivo del cliente"
                placeholder={NOTAS.objetivo}
                value={datos.objetivoCliente ?? ""}
                onChange={(e) => actualizar("objetivoCliente", e.target.value)}
                maxLength={5000}
                aria-invalid={Boolean(errores.objetivoCliente) || undefined}
                className={cn(CONTROL_CELDA, "resize-none py-1 text-[13px] font-semibold")}
              />
            </Celda>
          </div>

          <div className="bg-hoja-fondo pt-6" style={{ width: ANCHO_HOJA }}>
            {errores.obligaciones ? (
              <p className="px-2 pb-2 font-sans text-sm text-destructive" role="alert">
                {errores.obligaciones[0]}
              </p>
            ) : null}
            <TablaObligaciones
              filas={filas}
              calculadas={calculadas}
              error={errorObligacion}
              onCambiar={cambiarObligacion}
              onEliminar={eliminarFila}
              onPegar={pegar}
            />
            <div className="flex items-center gap-3 px-1 pt-2 pb-8 font-sans text-xs text-muted-foreground print:hidden">
              <button
                type="button"
                onClick={() => agregarFilas()}
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-hoja-vineta hover:bg-hoja-etiqueta focus-visible:outline-2 focus-visible:outline-hoja-seleccion"
              >
                <Plus className="size-3.5" aria-hidden />
                Agregar 5 filas
              </button>
              <span>
                Enter baja de fila · Mayús+Enter sube · flechas para moverse · puedes pegar filas
                copiadas del Excel
              </span>
            </div>

            <div className="grid gap-8 pb-10">
              <ResumenPorClase
                resultado={resultado}
                filaInicial={filaResumen}
                filasTabla={filas.length}
              />
              <ListaAcreedores resultado={resultado} filaInicial={filaAcreedores} />
            </div>
          </div>
        </div>

        <div hidden={pestana !== "guia"} className="bg-hoja-fondo">
          <GuiaClases />
        </div>
      </div>

      {/* Pestañas de las hojas, como en Excel */}
      <nav
        aria-label="Hojas"
        className="flex items-stretch gap-px border-t border-hoja-cuadricula bg-hoja-marco px-2 text-[13px] print:hidden"
      >
        <PestanaHoja activa={pestana === "diagnostico"} onClick={() => setPestana("diagnostico")}>
          Diagnóstico Cliente
        </PestanaHoja>
        {rutaDatosPropuesta ? (
          <Link
            href={rutaDatosPropuesta}
            className="px-4 py-1.5 hover:bg-hoja-fondo focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-hoja-seleccion"
          >
            DATOS PROPUESTA
          </Link>
        ) : (
          <span
            className="cursor-not-allowed px-4 py-1.5 text-hoja-texto/40"
            title="Guarda la matriz para ver los datos de la propuesta"
          >
            DATOS PROPUESTA
          </span>
        )}
        <PestanaHoja activa={pestana === "guia"} onClick={() => setPestana("guia")}>
          Guía 5 Clases
        </PestanaHoja>
      </nav>
    </form>
  );
}

function PestanaHoja({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={activa ? "page" : undefined}
      className={cn(
        "border-b-2 px-4 py-1.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-hoja-seleccion",
        activa
          ? "border-hoja-seleccion bg-hoja-fondo font-bold text-hoja-seleccion"
          : "border-transparent hover:bg-hoja-fondo",
      )}
    >
      {children}
    </button>
  );
}

/** % de honorarios (F7): número libre con las opciones de la lista del Excel. */
function PorcentajeHonorarios({
  id,
  inicial,
  onCambio,
  error,
}: {
  id: string;
  inicial: number;
  onCambio: (valor: number) => void;
  error?: string;
}) {
  const [texto, setTexto] = useState(String(inicial));
  const idLista = `${id}-lista`;
  return (
    <>
      <input
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
        aria-invalid={Boolean(error) || undefined}
        title={error}
        className={cn(CONTROL_CELDA, "pr-6 text-[18px] tabular-nums")}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[18px]"
      >
        %
      </span>
      <datalist id={idLista}>
        {PARAMETROS_DIAGNOSTICO.honorarios.porcentajesSugeridos.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  );
}
