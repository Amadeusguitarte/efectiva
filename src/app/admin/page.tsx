import { ArrowRight, UserPlus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerResumen } from "@/lib/datos/admin";
import { formatearFecha } from "@/lib/formato";
import { ESTADOS_PROPUESTA, INFO_ESTADO } from "@/lib/propuestas/estados";

export const metadata: Metadata = {
  title: "Resumen",
};

const numero = new Intl.NumberFormat("es-CO");

function TarjetaIndicador({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: number;
  detalle: string;
}) {
  return (
    <Card className="gap-2 py-5">
      <CardContent className="space-y-1 px-5">
        <p className="text-sm text-muted-foreground">{etiqueta}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {numero.format(valor)}
        </p>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}

export default async function ResumenAdminPage() {
  const resumen = await obtenerResumen();
  const maximo = Math.max(1, ...Object.values(resumen.porEstado));

  return (
    <>
      <EncabezadoPagina
        titulo="Resumen"
        descripcion="Estado general de los clientes y sus propuestas."
        acciones={
          <Button asChild>
            <Link href="/admin/clientes/nuevo">
              <UserPlus />
              Nuevo cliente
            </Link>
          </Button>
        }
      />

      <section
        aria-label="Indicadores"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <TarjetaIndicador
          etiqueta="Clientes"
          valor={resumen.totalClientes}
          detalle="Registrados en la plataforma"
        />
        <TarjetaIndicador
          etiqueta="Nuevos"
          valor={resumen.nuevosUltimos30Dias}
          detalle="En los últimos 30 días"
        />
        <TarjetaIndicador
          etiqueta="En curso"
          valor={resumen.enCurso}
          detalle="Propuestas aún no entregadas"
        />
        <TarjetaIndicador
          etiqueta="Finalizadas"
          valor={resumen.porEstado.finalizada}
          detalle="Propuestas entregadas al cliente"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Clientes por estado</CardTitle>
            <CardDescription>Selecciona un estado para ver sus clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1">
              {ESTADOS_PROPUESTA.map((estado) => {
                const cantidad = resumen.porEstado[estado];
                const porcentaje = resumen.totalClientes
                  ? Math.round((cantidad / resumen.totalClientes) * 100)
                  : 0;
                const descripcion = `${INFO_ESTADO[estado].etiqueta}: ${numero.format(cantidad)} ${
                  cantidad === 1 ? "cliente" : "clientes"
                } (${porcentaje}%)`;
                return (
                  <li key={estado}>
                    <Link
                      href={`/admin/clientes?estado=${estado}` as Route}
                      title={descripcion}
                      aria-label={descripcion}
                      className="grid grid-cols-[9.5rem_1fr_2.5rem] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="truncate text-sm text-foreground">
                        {INFO_ESTADO[estado].etiqueta}
                      </span>
                      <span className="h-2.5" aria-hidden>
                        {cantidad > 0 ? (
                          <span
                            className="block h-full rounded-r-[4px] bg-primary"
                            style={{ width: `${Math.max(2, (cantidad / maximo) * 100)}%` }}
                          />
                        ) : null}
                      </span>
                      <span className="text-right text-sm font-medium text-foreground tabular-nums">
                        {numero.format(cantidad)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Clientes recientes</CardTitle>
              <CardDescription>Últimos registros en la plataforma.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/clientes">
                Ver todos
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {resumen.recientes.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay clientes. Se crearán automáticamente cuando ingresen con Google, o puedes
                crearlos manualmente.
              </p>
            ) : (
              <ul className="divide-y">
                {resumen.recientes.map((cliente) => (
                  <li key={cliente.id}>
                    <Link
                      href={`/admin/clientes/${cliente.id}` as Route}
                      className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {cliente.nombre_completo}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {cliente.email} · {formatearFecha(cliente.created_at)}
                        </p>
                      </div>
                      {cliente.propuestas ? (
                        <EstadoBadge estado={cliente.propuestas.estado} />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
