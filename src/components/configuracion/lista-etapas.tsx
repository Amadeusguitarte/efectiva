"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { eliminarEtapa, moverOrdenEtapa } from "@/app/admin/configuracion/acciones";
import { PuntoEtapa } from "@/components/crm/insignias";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INFO_CIERRE } from "@/lib/crm/catalogos";
import type { Etapa } from "@/lib/datos/crm";

import { FormularioEtapa } from "./formulario-etapa";

export function ListaEtapas({ etapas }: { etapas: Etapa[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [pendiente, startTransition] = useTransition();

  function ejecutar(accion: () => Promise<{ ok: boolean; mensaje?: string }>) {
    startTransition(async () => {
      const resultado = await accion();
      if (!resultado.ok) toast.error(resultado.mensaje ?? "No se pudo completar.");
      else if (resultado.mensaje) toast.success(resultado.mensaje);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      <ol className="grid gap-3">
        {etapas.map((etapa, indice) => (
          <li key={etapa.id}>
            <Card className="gap-3 py-4">
              <CardHeader className="flex flex-row items-start justify-between gap-3 px-5">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <PuntoEtapa color={etapa.color} className="size-3" />
                    <span>
                      {indice + 1}. {etapa.nombre}
                    </span>
                    {etapa.cierre ? (
                      <Badge variant="outline">{INFO_CIERRE[etapa.cierre].etiqueta}</Badge>
                    ) : null}
                  </CardTitle>
                  {etapa.descripcion ? (
                    <CardDescription>{etapa.descripcion}</CardDescription>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {etapa.tareasAutomaticas.length === 0
                      ? "Sin tareas automáticas"
                      : `${etapa.tareasAutomaticas.length} ${etapa.tareasAutomaticas.length === 1 ? "tarea automática" : "tareas automáticas"}: ${etapa.tareasAutomaticas.map((t) => t.titulo).join(", ")}`}
                    {etapa.correoAutomatico
                      ? ` · Correo automático: «${etapa.correoAutomatico.asunto}»`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Subir"
                    disabled={pendiente || indice === 0}
                    onClick={() => ejecutar(() => moverOrdenEtapa(etapa.id, "arriba"))}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Bajar"
                    disabled={pendiente || indice === etapas.length - 1}
                    onClick={() => ejecutar(() => moverOrdenEtapa(etapa.id, "abajo"))}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditando(editando === etapa.id ? null : etapa.id)}
                  >
                    <Pencil />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar etapa"
                    className="text-destructive hover:text-destructive"
                    disabled={pendiente}
                    onClick={() => {
                      if (!window.confirm(`¿Eliminar la etapa «${etapa.nombre}»?`)) return;
                      ejecutar(() => eliminarEtapa(etapa.id));
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>
              {editando === etapa.id ? (
                <CardContent className="border-t px-5 pt-4">
                  <FormularioEtapa
                    etapa={etapa}
                    onGuardado={() => {
                      setEditando(null);
                      router.refresh();
                    }}
                    onCancelar={() => setEditando(null)}
                  />
                </CardContent>
              ) : null}
            </Card>
          </li>
        ))}
      </ol>

      {creando ? (
        <Card>
          <CardHeader>
            <CardTitle>Nueva etapa</CardTitle>
            <CardDescription>Se agrega al final; luego puedes ordenarla.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioEtapa
              onGuardado={() => {
                setCreando(false);
                router.refresh();
              }}
              onCancelar={() => setCreando(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div>
          <Button type="button" onClick={() => setCreando(true)}>
            <Plus />
            Nueva etapa
          </Button>
        </div>
      )}
    </div>
  );
}
