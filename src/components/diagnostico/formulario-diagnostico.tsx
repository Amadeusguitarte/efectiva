"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Campo } from "@/components/formularios/campo";
import { InputPesos } from "@/components/formularios/input-pesos";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { SelectNativo } from "@/components/formularios/select-nativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADO_INICIAL, type EstadoAccion } from "@/lib/acciones";
import {
  calcularDiagnostico,
  moraSegunDias,
  obligacionVacia,
  type DiagnosticoEntrada,
  type ObligacionEntrada,
} from "@/lib/diagnostico/calcular";
import {
  CLASES,
  CLASE_ESPERADA_POR_GARANTIA,
  ESTADOS_CIVILES,
  INFO_TIPO_SERVICIO,
  MORAS,
  TIPOS_GARANTIA,
  TIPOS_SERVICIO,
  type ClaseCredito,
  type EstadoCivil,
  type MoraObligacion,
  type TipoGarantia,
  type TipoServicio,
} from "@/lib/diagnostico/catalogos";
import { PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";
import { formatearPesos, formatearPorcentaje } from "@/lib/formato";

import { ResumenDiagnostico } from "./resumen-diagnostico";

type FormularioDiagnosticoProps = {
  accion: (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;
  inicial: DiagnosticoEntrada;
  /** `updated_at` del diagnóstico cargado; detecta guardados de otras personas. */
  actualizadoAt: string | null;
};

type Fila = { clave: number; obligacion: ObligacionEntrada };

type Datos = Omit<DiagnosticoEntrada, "obligaciones">;

function esValor<T extends string>(valores: readonly { valor: T }[], valor: string): valor is T {
  return valores.some((v) => v.valor === valor);
}

const numeroOCero = (valor: number) => (Number.isFinite(valor) ? valor : 0);

/**
 * Matriz de diagnóstico completa. Mantiene el estado en el cliente para recalcular los
 * indicadores en vivo y lo envía como JSON (campo `datos`) a la Server Action.
 */
export function FormularioDiagnostico({
  accion,
  inicial,
  actualizadoAt,
}: FormularioDiagnosticoProps) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const errores = estado.errores ?? {};

  const [datos, setDatos] = useState<Datos>(() => {
    const { obligaciones: _obligaciones, ...resto } = inicial;
    return resto;
  });
  const siguienteClave = useRef(inicial.obligaciones.length);
  const [filas, setFilas] = useState<Fila[]>(() =>
    inicial.obligaciones.map((obligacion, clave) => ({ clave, obligacion })),
  );

  const entrada = useMemo<DiagnosticoEntrada>(
    () => ({ ...datos, obligaciones: filas.map((f) => f.obligacion) }),
    [datos, filas],
  );
  const resultado = useMemo(() => calcularDiagnostico(entrada), [entrada]);
  const serializado = useMemo(() => JSON.stringify(entrada), [entrada]);

  // Al llegar la respuesta del servidor: se recuerda qué filas se enviaron (para mostrar cada
  // error en su fila aunque después se agreguen o eliminen) y si el guardado fue correcto.
  const [ultimoGuardado, setUltimoGuardado] = useState(serializado);
  const [ultimoEstado, setUltimoEstado] = useState(estado);
  const [clavesEnviadas, setClavesEnviadas] = useState<number[]>([]);
  // Lo que se envió al servidor: se fija al enviar, no al recibir la respuesta.
  const [enviado, setEnviado] = useState(() => ({
    serializado,
    claves: filas.map((f) => f.clave),
  }));
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    setClavesEnviadas(enviado.claves);
    if (estado.ok) setUltimoGuardado(enviado.serializado);
  }
  const hayCambios = serializado !== ultimoGuardado;

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

  // Tras responder el servidor: foco en el primer campo con error o en el mensaje general.
  const refFormulario = useRef<HTMLFormElement>(null);
  const refMensaje = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!estado.mensaje) return;
    const invalido = refFormulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalido) {
      invalido.focus({ preventScroll: true });
      invalido.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      refMensaje.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [estado]);

  // Foco al agregar o eliminar obligaciones.
  const refBotonAgregar = useRef<HTMLButtonElement>(null);
  const focoPendiente = useRef<"nueva" | "agregar" | null>(null);
  useEffect(() => {
    if (focoPendiente.current === "nueva") {
      refFormulario.current
        ?.querySelector<HTMLInputElement>('fieldset:last-of-type [data-campo="acreedor"]')
        ?.focus();
    } else if (focoPendiente.current === "agregar") {
      refBotonAgregar.current?.focus();
    }
    focoPendiente.current = null;
  }, [filas.length]);

  const idPorcentajes = useId();
  const [porcentajeTexto, setPorcentajeTexto] = useState(String(inicial.porcentajeHonorarios));
  const [cuotasTexto, setCuotasTexto] = useState(String(inicial.cuotasHonorarios));

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

  function actualizarObligacion(clave: number, cambios: Partial<ObligacionEntrada>) {
    setFilas((actuales) =>
      actuales.map((fila) =>
        fila.clave === clave ? { ...fila, obligacion: { ...fila.obligacion, ...cambios } } : fila,
      ),
    );
  }

  function agregarObligacion() {
    focoPendiente.current = "nueva";
    setFilas((actuales) => [
      ...actuales,
      { clave: siguienteClave.current++, obligacion: obligacionVacia() },
    ]);
  }

  function eliminarObligacion(clave: number) {
    focoPendiente.current = "agregar";
    setFilas((actuales) => actuales.filter((fila) => fila.clave !== clave));
  }

  const centroObligatorio = resultado.centroConciliacion.obligatorio;

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
        setEnviado({ serializado, claves: filas.map((f) => f.clave) });
        startTransition(() => accionFormulario(formData));
      }}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <input type="hidden" name="datos" value={serializado} />
      <input type="hidden" name="actualizado_en" value={actualizadoAt ?? ""} />

      <div className="grid min-w-0 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Situación económica</CardTitle>
            <CardDescription>
              Lo que el cliente reporta en la reunión de diagnóstico.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Campo etiqueta="Ocupación" errores={errores.ocupacion} opcional>
              {(control) => (
                <Input
                  {...control}
                  value={datos.ocupacion ?? ""}
                  onChange={(e) => actualizar("ocupacion", e.target.value)}
                  placeholder="Ej.: administrativa en empresa de colchones"
                  maxLength={200}
                />
              )}
            </Campo>
            <Campo etiqueta="Estado civil" errores={errores.estadoCivil} opcional>
              {(control) => (
                <SelectNativo
                  {...control}
                  value={datos.estadoCivil ?? ""}
                  onChange={(e) =>
                    actualizar(
                      "estadoCivil",
                      esValor(ESTADOS_CIVILES, e.target.value)
                        ? (e.target.value as EstadoCivil)
                        : null,
                    )
                  }
                >
                  <option value="">Sin especificar</option>
                  {ESTADOS_CIVILES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </SelectNativo>
              )}
            </Campo>
            <Campo etiqueta="Ingresos mensuales" errores={errores.ingresosMensuales} opcional>
              {(control) => (
                <InputPesos
                  {...control}
                  valor={datos.ingresosMensuales}
                  onCambio={(valor) => actualizar("ingresosMensuales", valor)}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Gastos mensuales aproximados"
              errores={errores.gastosMensuales}
              opcional
            >
              {(control) => (
                <InputPesos
                  {...control}
                  valor={datos.gastosMensuales}
                  onCambio={(valor) => actualizar("gastosMensuales", valor)}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Bienes a nombre del deudor"
              errores={errores.bienes}
              opcional
              className="md:col-span-2"
              ayuda="Inmuebles, vehículos y otros activos, con su situación (hipoteca, prenda, patrimonio de familia)."
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={2}
                  maxLength={2000}
                  value={datos.bienes ?? ""}
                  onChange={(e) => actualizar("bienes", e.target.value)}
                  placeholder="Ej.: apartamento en hipoteca con Davivienda"
                />
              )}
            </Campo>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obligaciones</CardTitle>
            <CardDescription>
              Una fila por acreedor y producto. El total adeudado es capital más intereses y otros
              conceptos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {errores.obligaciones ? (
              <p className="text-sm text-destructive">{errores.obligaciones[0]}</p>
            ) : null}
            {filas.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                Aún no hay obligaciones registradas.
              </p>
            ) : null}
            {filas.map(({ clave, obligacion }, indice) => {
              const calculada = resultado.obligaciones[indice];
              const enviada = clavesEnviadas[indice] === clave;
              const error = (campo: keyof ObligacionEntrada) =>
                enviada ? errores[`obligaciones.${indice}.${campo}`] : undefined;
              return (
                <fieldset
                  key={clave}
                  className="grid gap-4 rounded-lg border bg-surface-soft/60 p-4"
                >
                  <legend className="sr-only">Obligación {indice + 1}</legend>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold" aria-hidden>
                      Obligación {indice + 1}
                      {calculada ? (
                        <span className="ml-2 font-normal text-muted-foreground tabular-nums">
                          {formatearPesos(calculada.total)} ·{" "}
                          {formatearPorcentaje(calculada.porcentajePasivo, 1)} del pasivo
                        </span>
                      ) : null}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarObligacion(clave)}
                      aria-label={`Eliminar obligación ${indice + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-6">
                    <Campo
                      etiqueta="Acreedor"
                      errores={error("acreedor")}
                      className="md:col-span-3"
                    >
                      {(control) => (
                        <Input
                          {...control}
                          data-campo="acreedor"
                          value={obligacion.acreedor}
                          onChange={(e) =>
                            actualizarObligacion(clave, { acreedor: e.target.value })
                          }
                          placeholder="Ej.: Davivienda"
                          maxLength={160}
                          required
                        />
                      )}
                    </Campo>
                    <Campo
                      etiqueta="Concepto / producto"
                      errores={error("concepto")}
                      opcional
                      className="md:col-span-3"
                    >
                      {(control) => (
                        <Input
                          {...control}
                          value={obligacion.concepto ?? ""}
                          onChange={(e) =>
                            actualizarObligacion(clave, { concepto: e.target.value })
                          }
                          placeholder="Ej.: tarjeta de crédito"
                          maxLength={160}
                        />
                      )}
                    </Campo>
                    <Campo etiqueta="Capital" errores={error("capital")} className="md:col-span-2">
                      {(control) => (
                        <InputPesos
                          {...control}
                          valor={obligacion.capital}
                          onCambio={(valor) => actualizarObligacion(clave, { capital: valor ?? 0 })}
                        />
                      )}
                    </Campo>
                    <Campo
                      etiqueta="Intereses y otros"
                      errores={error("intereses")}
                      className="md:col-span-2"
                    >
                      {(control) => (
                        <InputPesos
                          {...control}
                          valor={obligacion.intereses}
                          onCambio={(valor) =>
                            actualizarObligacion(clave, { intereses: valor ?? 0 })
                          }
                        />
                      )}
                    </Campo>
                    <Campo etiqueta="Total adeudado" className="md:col-span-2">
                      {(control) => (
                        <Input
                          {...control}
                          readOnly
                          tabIndex={-1}
                          value={formatearPesos(obligacion.capital + obligacion.intereses)}
                          className="bg-muted/40 text-right tabular-nums"
                        />
                      )}
                    </Campo>
                    <Campo etiqueta="Mora" errores={error("mora")} className="md:col-span-2">
                      {(control) => (
                        <SelectNativo
                          {...control}
                          value={obligacion.mora}
                          onChange={(e) => {
                            if (esValor(MORAS, e.target.value))
                              actualizarObligacion(clave, {
                                mora: e.target.value as MoraObligacion,
                              });
                          }}
                        >
                          {MORAS.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.etiqueta}
                            </option>
                          ))}
                        </SelectNativo>
                      )}
                    </Campo>
                    <Campo
                      etiqueta="Días de mora"
                      errores={error("diasMora")}
                      opcional
                      className="md:col-span-2"
                    >
                      {(control) => (
                        <Input
                          {...control}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={36500}
                          step={1}
                          value={obligacion.diasMora ?? ""}
                          onChange={(e) => {
                            const dias =
                              e.target.value === ""
                                ? null
                                : Math.max(0, Math.trunc(numeroOCero(e.target.valueAsNumber)));
                            actualizarObligacion(
                              clave,
                              dias === null
                                ? { diasMora: null }
                                : { diasMora: dias, mora: moraSegunDias(dias) },
                            );
                          }}
                        />
                      )}
                    </Campo>
                    <Campo
                      etiqueta="Tipo de garantía"
                      errores={error("tipoGarantia")}
                      className="md:col-span-2"
                    >
                      {(control) => (
                        <SelectNativo
                          {...control}
                          value={obligacion.tipoGarantia}
                          onChange={(e) => {
                            if (!esValor(TIPOS_GARANTIA, e.target.value)) return;
                            const tipoGarantia = e.target.value as TipoGarantia;
                            const claseEsperada = CLASE_ESPERADA_POR_GARANTIA[tipoGarantia];
                            const claseActual = obligacion.clase;
                            const clase: ClaseCredito =
                              claseEsperada ??
                              (claseActual === "segunda" || claseActual === "tercera"
                                ? "quinta"
                                : claseActual);
                            actualizarObligacion(clave, { tipoGarantia, clase });
                          }}
                        >
                          {TIPOS_GARANTIA.map((o) => (
                            <option key={o.valor} value={o.valor}>
                              {o.etiqueta}
                            </option>
                          ))}
                        </SelectNativo>
                      )}
                    </Campo>
                    <Campo etiqueta="Clase" errores={error("clase")} className="md:col-span-2">
                      {(control) => (
                        <SelectNativo
                          {...control}
                          value={obligacion.clase}
                          onChange={(e) => {
                            if (esValor(CLASES, e.target.value))
                              actualizarObligacion(clave, {
                                clase: e.target.value as ClaseCredito,
                              });
                          }}
                        >
                          {CLASES.map((o) => (
                            <option key={o.valor} value={o.valor} title={o.ejemplos}>
                              {o.etiqueta}
                            </option>
                          ))}
                        </SelectNativo>
                      )}
                    </Campo>
                    <div className="flex items-center gap-2 self-end pb-2 md:col-span-4">
                      <input
                        id={`nomina-${clave}`}
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={obligacion.descuentoNomina}
                        onChange={(e) =>
                          actualizarObligacion(clave, { descuentoNomina: e.target.checked })
                        }
                      />
                      <label htmlFor={`nomina-${clave}`} className="text-sm leading-tight">
                        Descuento de nómina activo
                      </label>
                    </div>
                  </div>
                </fieldset>
              );
            })}
            <div>
              <Button
                ref={refBotonAgregar}
                type="button"
                variant="outline"
                onClick={agregarObligacion}
              >
                <Plus />
                Agregar obligación
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicio y honorarios</CardTitle>
            <CardDescription>
              {datos.tipoServicio
                ? INFO_TIPO_SERVICIO[datos.tipoServicio].descripcion
                : "El tipo de servicio define la estrategia jurídica y si se cobra centro de conciliación."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Campo
              etiqueta="Tipo de servicio"
              errores={errores.tipoServicio}
              className="md:col-span-2"
            >
              {(control) => (
                <SelectNativo
                  {...control}
                  value={datos.tipoServicio ?? ""}
                  onChange={(e) => cambiarTipoServicio(e.target.value)}
                >
                  <option value="">Sin definir</option>
                  {TIPOS_SERVICIO.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </SelectNativo>
              )}
            </Campo>
            <Campo
              etiqueta="Porcentaje de honorarios"
              errores={errores.porcentajeHonorarios}
              ayuda={`Sobre el pasivo total. Habitual: ${PARAMETROS_DIAGNOSTICO.honorarios.porcentajesSugeridos.join(", ")} %.`}
            >
              {(control) => (
                <div className="relative">
                  <Input
                    {...control}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.5}
                    list={idPorcentajes}
                    value={porcentajeTexto}
                    onChange={(e) => {
                      setPorcentajeTexto(e.target.value);
                      actualizar("porcentajeHonorarios", numeroOCero(e.target.valueAsNumber));
                    }}
                    className="pr-8 tabular-nums"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
                  >
                    %
                  </span>
                  <datalist id={idPorcentajes}>
                    {PARAMETROS_DIAGNOSTICO.honorarios.porcentajesSugeridos.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              )}
            </Campo>
            <Campo
              etiqueta="Cuotas de honorarios"
              errores={errores.cuotasHonorarios}
              ayuda={`Entre 1 y ${PARAMETROS_DIAGNOSTICO.honorarios.cuotasMaximas}.`}
            >
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={PARAMETROS_DIAGNOSTICO.honorarios.cuotasMaximas}
                  step={1}
                  value={cuotasTexto}
                  onChange={(e) => {
                    setCuotasTexto(e.target.value);
                    actualizar("cuotasHonorarios", Math.trunc(numeroOCero(e.target.valueAsNumber)));
                  }}
                  className="tabular-nums"
                />
              )}
            </Campo>
            <div className="flex items-start gap-2 md:col-span-2">
              <input
                id="requiere-centro"
                type="checkbox"
                className="mt-0.5 size-4 accent-primary"
                checked={datos.requiereCentroConciliacion}
                disabled={centroObligatorio}
                onChange={(e) => actualizar("requiereCentroConciliacion", e.target.checked)}
              />
              <label htmlFor="requiere-centro" className="grid gap-0.5 text-sm">
                <span className="font-medium">Requiere centro de conciliación</span>
                <span className="text-xs text-muted-foreground">
                  {centroObligatorio
                    ? "Obligatorio para los acuerdos de pago."
                    : "En liquidación patrimonial puede usarse la justicia ordinaria (sin costo de centro, pero más lenta)."}
                </span>
              </label>
            </div>
            <Campo
              etiqueta="Descuento del centro de conciliación"
              errores={errores.descuentoCentroConciliacion}
              opcional
              ayuda={`Tarifa según el pasivo: ${formatearPesos(resultado.centroConciliacion.tarifa)}.`}
            >
              {(control) => (
                <InputPesos
                  {...control}
                  valor={datos.descuentoCentroConciliacion}
                  onCambio={(valor) => actualizar("descuentoCentroConciliacion", valor ?? 0)}
                />
              )}
            </Campo>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas para la propuesta</CardTitle>
            <CardDescription>
              Se incorporan tal cual a los datos de la propuesta; escríbelas pensando en el abogado
              que la redacta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Campo
              etiqueta="Observaciones jurídicas"
              errores={errores.observacionesJuridicas}
              opcional
              ayuda="¿Procesos o embargos? ¿Descuentos de nómina? ¿Alimentos? ¿Codeudor? ¿Bienes o garantías? ¿Cobro jurídico?"
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={4}
                  maxLength={5000}
                  value={datos.observacionesJuridicas ?? ""}
                  onChange={(e) => actualizar("observacionesJuridicas", e.target.value)}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Situación y urgencia del cliente"
              errores={errores.situacionUrgencia}
              opcional
              ayuda="¿Qué está pasando hoy? ¿Qué es lo más urgente? ¿Riesgo de embargo o remate? ¿Fecha crítica? ¿Qué pasa si no actúa?"
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={4}
                  maxLength={5000}
                  value={datos.situacionUrgencia ?? ""}
                  onChange={(e) => actualizar("situacionUrgencia", e.target.value)}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Objetivo del cliente"
              errores={errores.objetivoCliente}
              opcional
              ayuda="¿Qué quiere lograr? ¿Reducir cuota, detener cobros, proteger bienes? ¿Cuánto puede pagar? ¿Qué bien quiere conservar?"
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={3}
                  maxLength={5000}
                  value={datos.objetivoCliente ?? ""}
                  onChange={(e) => actualizar("objetivoCliente", e.target.value)}
                />
              )}
            </Campo>
          </CardContent>
        </Card>

        <div ref={refMensaje} className="grid gap-4">
          <MensajeFormulario estado={estado} />
          <div className="flex flex-wrap items-center justify-end gap-3">
            {hayCambios ? (
              <span className="text-sm text-muted-foreground" aria-live="polite">
                Hay cambios sin guardar.
              </span>
            ) : null}
            <Button type="submit" disabled={pendiente} aria-busy={pendiente}>
              {pendiente ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {pendiente ? "Guardando…" : "Guardar diagnóstico"}
            </Button>
          </div>
        </div>
      </div>

      <aside className="min-w-0 xl:sticky xl:top-20" aria-label="Indicadores del diagnóstico">
        <ResumenDiagnostico resultado={resultado} />
      </aside>
    </form>
  );
}
