import type { Metadata, Route } from "next";
import Link from "next/link";

import { FiltrosPipeline } from "@/components/crm/filtros-pipeline";
import { FilaTarea } from "@/components/crm/tareas-caso";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listarTareas, obtenerEquipo } from "@/lib/datos/crm";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Tareas",
};

function texto(valor: string | string[] | undefined) {
  return typeof valor === "string" ? valor : undefined;
}

const VISTAS = [
  { valor: "pendientes", etiqueta: "Pendientes" },
  { valor: "completadas", etiqueta: "Completadas" },
  { valor: "todas", etiqueta: "Todas" },
] as const;

function hoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export default async function TareasPage({ searchParams }: PageProps<"/admin/crm/tareas">) {
  const parametros = await searchParams;
  const vista = texto(parametros.vista) ?? "pendientes";
  const responsable = texto(parametros.responsable);

  const [tareas, equipo] = await Promise.all([
    listarTareas({
      estado:
        vista === "pendientes" ? "pendiente" : vista === "completadas" ? "completada" : undefined,
      responsable,
    }),
    obtenerEquipo(),
  ]);
  const vencidas = tareas.filter((t) => t.vencida).length;
  const hoy = hoyBogota();

  const enlaceVista = (valor: string) => {
    const query = new URLSearchParams();
    if (valor !== "pendientes") query.set("vista", valor);
    if (responsable) query.set("responsable", responsable);
    const cadena = query.toString();
    return `/admin/crm/tareas${cadena ? `?${cadena}` : ""}` as Route;
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Tareas"
        descripcion={`${tareas.length} ${tareas.length === 1 ? "tarea" : "tareas"}${vencidas ? ` · ${vencidas} vencidas` : ""}`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {VISTAS.map((v) => (
          <Button
            key={v.valor}
            asChild
            size="sm"
            variant={vista === v.valor ? "default" : "outline"}
          >
            <Link href={enlaceVista(v.valor)}>{v.etiqueta}</Link>
          </Button>
        ))}
      </div>
      <FiltrosPipeline equipo={equipo} conCanal={false} conBusqueda={false} />

      <Card>
        <CardContent>
          {tareas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay tareas en esta vista.
            </p>
          ) : (
            <ul className="grid gap-2">
              {tareas.map((tarea) => (
                <FilaTarea
                  key={tarea.id}
                  tarea={tarea}
                  hoy={hoy}
                  mostrarCaso={
                    <Link
                      href={`/admin/crm/casos/${tarea.caso.id}` as Route}
                      className={cn("font-medium text-primary underline-offset-4 hover:underline")}
                    >
                      · {tarea.caso.nombre}
                    </Link>
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
