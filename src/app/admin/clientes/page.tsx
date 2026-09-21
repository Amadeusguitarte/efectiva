import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { FiltrosClientes } from "@/components/admin/filtros-clientes";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarClientes } from "@/lib/datos/admin";
import { formatearFecha } from "@/lib/formato";
import { esEstadoPropuesta } from "@/lib/propuestas/estados";

export const metadata: Metadata = {
  title: "Clientes",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

export default async function ClientesPage({ searchParams }: PageProps<"/admin/clientes">) {
  const parametros = await searchParams;
  const busqueda = texto(parametros.q);
  const estadoParam = texto(parametros.estado);
  const estado = esEstadoPropuesta(estadoParam) ? estadoParam : undefined;
  const pagina = Math.max(1, Number.parseInt(texto(parametros.pagina) ?? "1", 10) || 1);

  const { clientes, total, paginas } = await listarClientes({ busqueda, estado, pagina });

  const enlacePagina = (numero: number) => {
    const query = new URLSearchParams();
    if (busqueda) query.set("q", busqueda);
    if (estado) query.set("estado", estado);
    if (numero > 1) query.set("pagina", String(numero));
    const cadena = query.toString();
    return `/admin/clientes${cadena ? `?${cadena}` : ""}` as Route;
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion={`${total} ${total === 1 ? "cliente" : "clientes"}${busqueda || estado ? " con los filtros aplicados" : " en total"}`}
        acciones={
          <Button asChild>
            <Link href="/admin/clientes/nuevo">
              <UserPlus />
              Nuevo cliente
            </Link>
          </Button>
        }
      />

      <FiltrosClientes />

      <Card className="gap-0 overflow-hidden py-0">
        {clientes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-medium text-foreground">No encontramos clientes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {busqueda || estado
                ? "Prueba con otros filtros o limpia la búsqueda."
                : "Cuando un cliente ingrese con Google aparecerá aquí."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-surface-soft">
              <TableRow>
                <TableHead className="pl-6">Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Cuenta</TableHead>
                <TableHead className="hidden pr-6 text-right xl:table-cell">Actualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id} className="relative">
                  <TableCell className="max-w-72 pl-6">
                    <Link
                      href={`/admin/clientes/${cliente.id}` as Route}
                      className="block truncate font-medium text-foreground after:absolute after:inset-0 hover:text-primary"
                    >
                      {cliente.nombre_completo}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{cliente.email}</p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                    {cliente.telefono ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {cliente.ciudad ?? "—"}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={cliente.propuestas.estado} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {cliente.perfil_id ? (
                      <Badge variant="secondary">Activa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sin registrar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden pr-6 text-right text-muted-foreground tabular-nums xl:table-cell">
                    {formatearFecha(cliente.propuestas.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {paginas > 1 ? (
        <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Página {pagina} de {paginas}
          </p>
          <div className="flex gap-2">
            {pagina > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={enlacePagina(pagina - 1)}>
                  <ChevronLeft />
                  Anterior
                </Link>
              </Button>
            ) : null}
            {pagina < paginas ? (
              <Button asChild variant="outline" size="sm">
                <Link href={enlacePagina(pagina + 1)}>
                  Siguiente
                  <ChevronRight />
                </Link>
              </Button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
