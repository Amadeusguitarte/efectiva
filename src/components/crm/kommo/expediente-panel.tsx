"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState, useId, useState, useTransition } from "react";

import {
  buscarClientes,
  crearExpedienteDesdeCaso,
  vincularCliente,
} from "@/app/admin/crm/acciones";
import { EstadoBadge } from "@/components/propuestas/estado-badge";
import { ESTADO_INICIAL } from "@/lib/acciones";
import type { CasoDetalle } from "@/lib/datos/crm";
import { cn } from "cn";

import { BOTON_CRM_SECUNDARIO, BotonEnviarCrm, CAMPO_CRM, FilaDato } from "./piezas";

type Modo = "crear" | "vincular" | null;

/**
 * Fila «Expediente» del panel: el cliente y su propuesta en la plataforma si el caso está
 * vinculado; si no, crear el expediente con los datos del caso o vincular uno existente.
 */
export function ExpedientePanel({ caso }: { caso: Pick<CasoDetalle, "id" | "email" | "cliente"> }) {
  const [modo, setModo] = useState<Modo>(null);

  if (caso.cliente) {
    return (
      <dl>
        <FilaDato etiqueta="Expediente" className="py-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/admin/clientes/${caso.cliente.id}` as Route}
              className="truncate text-crm-seleccion underline-offset-2 hover:underline"
            >
              {caso.cliente.nombre}
            </Link>
            {caso.cliente.estadoPropuesta ? (
              <EstadoBadge estado={caso.cliente.estadoPropuesta} className="px-2 text-[11px]" />
            ) : null}
            <Link
              href={`/admin/clientes/${caso.cliente.id}/diagnostico` as Route}
              className="text-sm text-crm-hora underline-offset-2 hover:text-crm-seleccion hover:underline"
            >
              Matriz
            </Link>
          </span>
        </FilaDato>
      </dl>
    );
  }

  return (
    <>
      <dl>
        <FilaDato etiqueta="Expediente">
          <span className="flex items-center gap-3 text-[15px]">
            <button
              type="button"
              onClick={() => setModo(modo === "crear" ? null : "crear")}
              aria-expanded={modo === "crear"}
              className="text-crm-seleccion underline-offset-2 hover:underline"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setModo(modo === "vincular" ? null : "vincular")}
              aria-expanded={modo === "vincular"}
              className="text-crm-seleccion underline-offset-2 hover:underline"
            >
              Vincular
            </button>
          </span>
        </FilaDato>
      </dl>
      {modo === "crear" ? (
        <CrearExpediente casoId={caso.id} email={caso.email} alCerrar={() => setModo(null)} />
      ) : null}
      {modo === "vincular" ? (
        <VincularExpediente casoId={caso.id} alCerrar={() => setModo(null)} />
      ) : null}
    </>
  );
}

function CrearExpediente({
  casoId,
  email,
  alCerrar,
}: {
  casoId: string;
  email: string | null;
  alCerrar: () => void;
}) {
  const id = useId();
  const [estado, accion] = useActionState(crearExpedienteDesdeCaso, ESTADO_INICIAL);
  return (
    <form action={accion} className="my-2 grid gap-2 rounded-sm bg-crm-feed p-3 text-sm" noValidate>
      <input type="hidden" name="caso_id" value={casoId} />
      {estado.mensaje ? (
        <p
          role={estado.ok ? "status" : "alert"}
          className={estado.ok ? "text-success" : "text-destructive"}
        >
          {estado.mensaje}
        </p>
      ) : null}
      {email ? (
        <p className="text-crm-texto-suave">
          Se crea el cliente con el correo {email} para registrar la matriz y la propuesta.
        </p>
      ) : (
        <>
          <label htmlFor={id} className="text-crm-hora">
            Correo del cliente (lo usan el expediente y su portal)
          </label>
          <input
            id={id}
            type="email"
            name="email"
            defaultValue={estado.valores?.email ?? ""}
            aria-invalid={Boolean(estado.errores?.email)}
            className={CAMPO_CRM}
          />
          {estado.errores?.email ? (
            <p className="text-xs text-destructive">{estado.errores.email[0]}</p>
          ) : null}
        </>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={BOTON_CRM_SECUNDARIO} onClick={alCerrar}>
          Cancelar
        </button>
        <BotonEnviarCrm textoPendiente="Creando…">Crear y vincular</BotonEnviarCrm>
      </div>
    </form>
  );
}

function VincularExpediente({ casoId, alCerrar }: { casoId: string; alCerrar: () => void }) {
  const [estado, accion] = useActionState(vincularCliente, ESTADO_INICIAL);
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<
    { id: string; nombre_completo: string; email: string }[] | null
  >(null);
  const [buscando, startTransition] = useTransition();

  function buscar() {
    startTransition(async () => {
      setResultados(await buscarClientes(termino));
    });
  }

  return (
    <div className="my-2 grid gap-2 rounded-sm bg-crm-feed p-3 text-sm">
      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="text-destructive">
          {estado.mensaje}
        </p>
      ) : null}
      <div className="flex gap-2">
        <input
          value={termino}
          onChange={(evento) => setTermino(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") {
              evento.preventDefault();
              buscar();
            }
          }}
          placeholder="Nombre, correo o teléfono"
          aria-label="Buscar expediente"
          className={CAMPO_CRM}
        />
        <button
          type="button"
          onClick={buscar}
          disabled={buscando}
          className={BOTON_CRM_SECUNDARIO}
          aria-label="Buscar"
        >
          <Search />
        </button>
      </div>
      {resultados?.length === 0 ? (
        <p className="text-crm-hora">No hay expedientes con esa búsqueda.</p>
      ) : null}
      {resultados && resultados.length > 0 ? (
        <ul className="grid gap-1">
          {resultados.map((cliente) => (
            <li key={cliente.id}>
              <form
                action={accion}
                className="flex items-center justify-between gap-2 rounded-sm border border-crm-borde bg-background px-2.5 py-1.5"
              >
                <input type="hidden" name="caso_id" value={casoId} />
                <input type="hidden" name="cliente_id" value={cliente.id} />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-crm-texto">
                    {cliente.nombre_completo}
                  </span>
                  <span className="block truncate text-xs text-crm-hora">{cliente.email}</span>
                </span>
                <BotonEnviarCrm textoPendiente="…" className="h-7 px-3">
                  Vincular
                </BotonEnviarCrm>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex justify-end">
        <button type="button" className={cn(BOTON_CRM_SECUNDARIO, "h-7")} onClick={alCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
