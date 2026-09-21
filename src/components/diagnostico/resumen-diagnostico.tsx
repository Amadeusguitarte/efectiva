import { Check, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultadoDiagnostico } from "@/lib/diagnostico/calcular";
import { CLASES } from "@/lib/diagnostico/catalogos";
import { PARAMETROS_DIAGNOSTICO } from "@/lib/diagnostico/parametros";
import {
  formatearNumero,
  formatearPesos,
  formatearPorcentaje,
  formatearPorcentajeHonorarios,
} from "@/lib/formato";
import { cn } from "cn";

import { AlertasDiagnostico } from "./alertas-diagnostico";
import { ElegibilidadBadge } from "./elegibilidad-badge";

function Fila({
  etiqueta,
  valor,
  detalle,
  destacada,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  destacada?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-sm text-muted-foreground">
        {etiqueta}
        {detalle ? <span className="block text-xs text-muted-foreground/80">{detalle}</span> : null}
      </dt>
      <dd
        className={cn(
          "text-right tabular-nums",
          destacada ? "text-base font-semibold text-foreground" : "text-sm text-foreground",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

function Condicion({ cumple, texto, valor }: { cumple: boolean; texto: string; valor: string }) {
  const Icono = cumple ? Check : X;
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
          cumple ? "bg-success-soft text-success" : "bg-danger-soft text-destructive",
        )}
      >
        <Icono className="size-3" aria-hidden />
        <span className="sr-only">{cumple ? "Cumple" : "No cumple"}</span>
      </span>
      <span className="flex-1 text-muted-foreground">{texto}</span>
      <span className="font-medium tabular-nums">{valor}</span>
    </li>
  );
}

/** Indicadores de la matriz (los que antes calculaba el Excel), listos para el panel lateral. */
export function ResumenDiagnostico({ resultado }: { resultado: ResultadoDiagnostico }) {
  const { elegibilidad, honorarios, centroConciliacion } = resultado;
  const reglas = PARAMETROS_DIAGNOSTICO.elegibilidad;
  const clasesConDeudas = CLASES.filter((c) => resultado.resumenPorClase[c.valor].cantidad > 0);

  return (
    <div className="grid gap-4">
      <Card className="gap-3 py-5">
        <CardContent className="px-5">
          <p className="text-sm text-muted-foreground">Pasivo total</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatearPesos(resultado.pasivoTotal)}
          </p>
          <p className="text-xs text-muted-foreground">
            {resultado.numeroObligaciones === 1
              ? "1 obligación"
              : `${formatearNumero(resultado.numeroObligaciones)} obligaciones`}
            {resultado.excedenteMensual !== null
              ? ` · excedente mensual ${formatearPesos(resultado.excedenteMensual)}`
              : ""}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            Elegibilidad preliminar
            <ElegibilidadBadge estado={elegibilidad.estado} />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <ul className="grid gap-2">
            <Condicion
              cumple={elegibilidad.cumple.obligaciones}
              texto={`${reglas.minimoObligacionesEnMora} o más obligaciones con mora mayor a 90 días`}
              valor={String(elegibilidad.obligacionesEnMora)}
            />
            <Condicion
              cumple={elegibilidad.cumple.acreedores}
              texto={`${reglas.minimoAcreedoresEnMora} o más acreedores distintos en mora`}
              valor={String(elegibilidad.acreedoresEnMora)}
            />
            <Condicion
              cumple={elegibilidad.cumple.porcentaje}
              texto={`Al menos ${formatearPorcentaje(reglas.umbralPasivoEnMora)} del pasivo en mora`}
              valor={formatearPorcentaje(elegibilidad.porcentajeEnMora, 1)}
            />
          </ul>
        </CardContent>
      </Card>

      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Honorarios y costo</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <dl className="divide-y">
            <Fila
              etiqueta={`Honorarios (${formatearPorcentajeHonorarios(honorarios.porcentaje)})`}
              valor={formatearPesos(honorarios.valor)}
            />
            <Fila
              etiqueta="Cuotas"
              valor={`${honorarios.cuotas} × ${formatearPesos(honorarios.valorCuota)}`}
            />
            <Fila
              etiqueta="Centro de conciliación"
              detalle={
                centroConciliacion.aplica
                  ? `Tarifa ${formatearPesos(centroConciliacion.tarifa)}${
                      centroConciliacion.descuento > 0
                        ? ` − descuento ${formatearPesos(centroConciliacion.descuento)}`
                        : ""
                    }`
                  : `Tarifa según pasivo: ${formatearPesos(centroConciliacion.tarifa)}`
              }
              valor={
                centroConciliacion.aplica ? formatearPesos(centroConciliacion.valor) : "No aplica"
              }
            />
            <Fila etiqueta="Gastos del proceso" valor={formatearPesos(resultado.gastosProceso)} />
            <Fila
              etiqueta="Costo total del proceso"
              valor={formatearPesos(resultado.costoProceso)}
              destacada
            />
          </dl>
        </CardContent>
      </Card>

      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-base">Por clase de crédito</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {clasesConDeudas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin obligaciones registradas.</p>
          ) : (
            <ul className="grid gap-3">
              {clasesConDeudas.map((clase) => {
                const resumen = resultado.resumenPorClase[clase.valor];
                return (
                  <li key={clase.valor} className="grid gap-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>
                        {clase.etiqueta}
                        <span className="text-muted-foreground"> · {resumen.cantidad}</span>
                      </span>
                      <span className="tabular-nums">
                        {formatearPesos(resumen.total)}
                        <span className="text-muted-foreground">
                          {" "}
                          ({formatearPorcentaje(resumen.porcentajePasivo)})
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-primary/10" aria-hidden>
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(resumen.porcentajePasivo * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertasDiagnostico alertas={resultado.alertas} />
    </div>
  );
}
