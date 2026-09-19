import { ClipboardList, FileText, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiagnosticoCliente } from "@/lib/datos/diagnostico";
import { INFO_TIPO_SERVICIO } from "@/lib/diagnostico/catalogos";
import { formatearFechaHora, formatearPesos } from "@/lib/formato";

import { ElegibilidadBadge } from "./elegibilidad-badge";

function Indicador({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-surface-soft/60 p-3">
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <div className="text-base font-semibold tabular-nums">{children}</div>
    </div>
  );
}

/** Resumen de la matriz en la ficha del cliente, con acceso a editarla y a los datos de la propuesta. */
export function TarjetaDiagnostico({ diagnostico }: { diagnostico: DiagnosticoCliente }) {
  const { cliente, existe, resultado, entrada, actualizadoAt, actualizadoPor } = diagnostico;
  const rutaMatriz = `/admin/clientes/${cliente.id}/diagnostico` as Route;
  const rutaDatos = `/admin/clientes/${cliente.id}/diagnostico/datos-propuesta` as Route;
  const errores = resultado.alertas.filter((a) => a.nivel === "error").length;
  const avisos = resultado.alertas.length - errores;

  if (!existe) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz de diagnóstico</CardTitle>
          <CardDescription>
            Aún no se ha registrado. Con la matriz se calculan la elegibilidad, los honorarios y el
            costo del proceso, y se preparan los datos de la propuesta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={rutaMatriz}>
              <ClipboardList />
              Registrar diagnóstico
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de diagnóstico</CardTitle>
        <CardDescription>
          {actualizadoAt ? `Actualizada el ${formatearFechaHora(actualizadoAt)}` : "Registrada"}
          {actualizadoPor ? ` por ${actualizadoPor.nombre_completo ?? actualizadoPor.email}` : ""}.
          {entrada.tipoServicio
            ? ` Servicio: ${INFO_TIPO_SERVICIO[entrada.tipoServicio].etiqueta}.`
            : " Sin tipo de servicio definido."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Indicador etiqueta="Pasivo total">{formatearPesos(resultado.pasivoTotal)}</Indicador>
          <Indicador etiqueta="Elegibilidad">
            <ElegibilidadBadge estado={resultado.elegibilidad.estado} />
          </Indicador>
          <Indicador etiqueta="Honorarios">
            {formatearPesos(resultado.honorarios.valor)}
            <span className="block text-xs font-normal text-muted-foreground">
              {resultado.honorarios.cuotas} × {formatearPesos(resultado.honorarios.valorCuota)}
            </span>
          </Indicador>
          <Indicador etiqueta="Costo del proceso">
            {formatearPesos(resultado.costoProceso)}
          </Indicador>
        </div>

        <p className="text-sm text-muted-foreground">
          {resultado.numeroObligaciones === 1
            ? "1 obligación registrada"
            : `${resultado.numeroObligaciones} obligaciones registradas`}
          {errores > 0
            ? ` · ${errores === 1 ? "1 error por resolver" : `${errores} errores por resolver`}`
            : ""}
          {avisos > 0 ? ` · ${avisos === 1 ? "1 aviso" : `${avisos} avisos`}` : ""}
          {resultado.alertas.length === 0 ? " · sin alertas" : ""}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={rutaMatriz}>
              <Pencil />
              Editar matriz
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={rutaDatos}>
              <FileText />
              Datos para la propuesta
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
