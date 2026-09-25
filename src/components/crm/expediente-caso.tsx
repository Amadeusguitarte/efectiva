"use client";

import { ExternalLink, FolderPlus, Link2, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import {
  buscarClientes,
  crearExpedienteDesdeCaso,
  vincularCliente,
} from "@/app/admin/crm/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { Campo } from "@/components/formularios/campo";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/acciones";
import type { CasoDetalle } from "@/lib/datos/crm";

type ExpedienteCasoProps = { caso: Pick<CasoDetalle, "id" | "email" | "cliente"> };

/** Vínculo del caso con el expediente (cliente + propuesta) de la plataforma. */
export function ExpedienteCaso({ caso }: ExpedienteCasoProps) {
  const [estadoCrear, crear] = useActionState(crearExpedienteDesdeCaso, ESTADO_INICIAL);
  const [estadoVincular, vincular] = useActionState(vincularCliente, ESTADO_INICIAL);
  const [modo, setModo] = useState<"crear" | "vincular" | null>(null);
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<
    { id: string; nombre_completo: string; email: string }[]
  >([]);
  const [buscando, startTransition] = useTransition();

  if (caso.cliente) {
    return (
      <div className="grid gap-3">
        <div>
          <p className="font-medium text-foreground">{caso.cliente.nombre}</p>
          <p className="text-sm text-muted-foreground">{caso.cliente.email}</p>
        </div>
        {caso.cliente.estadoPropuesta ? (
          <EstadoBadge estado={caso.cliente.estadoPropuesta} />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/clientes/${caso.cliente.id}` as Route}>
              <ExternalLink />
              Abrir expediente
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/clientes/${caso.cliente.id}/diagnostico` as Route}>
              Matriz de diagnóstico
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Sin expediente. Créalo para registrar la matriz de diagnóstico y la propuesta, o vincula uno
        existente.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={modo === "crear" ? "default" : "outline"}
          onClick={() => setModo("crear")}
        >
          <FolderPlus />
          Crear expediente
        </Button>
        <Button
          type="button"
          size="sm"
          variant={modo === "vincular" ? "default" : "outline"}
          onClick={() => setModo("vincular")}
        >
          <Link2 />
          Vincular existente
        </Button>
      </div>

      {modo === "crear" ? (
        <form
          action={crear}
          className="grid gap-3 rounded-lg border bg-surface-soft/60 p-3"
          noValidate
        >
          <input type="hidden" name="caso_id" value={caso.id} />
          <MensajeFormulario estado={estadoCrear} />
          {caso.email ? (
            <p className="text-sm text-muted-foreground">Se creará con el correo {caso.email}.</p>
          ) : (
            <Campo
              etiqueta="Correo del cliente"
              errores={estadoCrear.errores?.email}
              ayuda="El expediente y el portal del cliente usan el correo."
            >
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  name="email"
                  defaultValue={estadoCrear.valores?.email ?? ""}
                />
              )}
            </Campo>
          )}
          <div className="flex justify-end">
            <BotonEnviar size="sm" textoPendiente="Creando…">
              Crear y vincular
            </BotonEnviar>
          </div>
        </form>
      ) : null}

      {modo === "vincular" ? (
        <div className="grid gap-3 rounded-lg border bg-surface-soft/60 p-3">
          <MensajeFormulario estado={estadoVincular} />
          <div className="flex gap-2">
            <Input
              value={termino}
              onChange={(evento) => setTermino(evento.target.value)}
              placeholder="Nombre, correo o teléfono"
              aria-label="Buscar expediente"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={buscando}
              onClick={() =>
                startTransition(async () => {
                  setResultados(await buscarClientes(termino));
                })
              }
            >
              <Search />
              Buscar
            </Button>
          </div>
          {resultados.length > 0 ? (
            <ul className="grid gap-1">
              {resultados.map((cliente) => (
                <li key={cliente.id}>
                  <form
                    action={vincular}
                    className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
                  >
                    <input type="hidden" name="caso_id" value={caso.id} />
                    <input type="hidden" name="cliente_id" value={cliente.id} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {cliente.nombre_completo}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {cliente.email}
                      </span>
                    </span>
                    <BotonEnviar size="sm" variant="outline" textoPendiente="Vinculando…">
                      Vincular
                    </BotonEnviar>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
