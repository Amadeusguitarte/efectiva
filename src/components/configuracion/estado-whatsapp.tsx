"use client";

import { Loader2, LogOut, QrCode, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { cerrarSesionWhatsApp, reiniciarWhatsApp } from "@/app/admin/configuracion/acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INFO_ESTADO_WHATSAPP, type EstadoWhatsApp } from "@/lib/crm/catalogos";
import type { CuentaWhatsApp } from "@/lib/datos/crm";
import { formatearFechaHora } from "@/lib/formato";
import { cn } from "cn";

type EstadoRemoto = {
  estado: EstadoWhatsApp;
  telefono: string | null;
  qrImagen: string | null;
  workerActivo: boolean;
  ultimoError: string | null;
  conectadoAt: string | null;
  actualizadoAt: string;
};

const TONO: Record<EstadoWhatsApp, string> = {
  desconectado: "bg-muted text-muted-foreground",
  qr: "bg-warning-soft text-warning",
  conectando: "bg-info-soft text-info",
  conectado: "bg-success-soft text-success",
  error: "bg-destructive/10 text-destructive",
};

/** Estado de la conexión de WhatsApp con el QR para vincular; consulta el estado cada 3 segundos. */
export function EstadoWhatsApp({ inicial }: { inicial: CuentaWhatsApp | null }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoRemoto | null>(
    inicial
      ? {
          estado: inicial.estado,
          telefono: inicial.telefono,
          qrImagen: null,
          workerActivo: inicial.workerActivo,
          ultimoError: inicial.ultimoError,
          conectadoAt: inicial.conectadoAt,
          actualizadoAt: inicial.actualizadoAt,
        }
      : null,
  );
  const [pendiente, startTransition] = useTransition();

  useEffect(() => {
    let activo = true;
    async function consultar() {
      if (document.visibilityState !== "visible") return;
      try {
        const respuesta = await fetch("/admin/configuracion/whatsapp/estado", {
          cache: "no-store",
        });
        if (!respuesta.ok) return;
        const datos = (await respuesta.json()) as EstadoRemoto;
        if (activo) setEstado(datos);
      } catch {
        // Sin conexión momentánea: se reintenta en el siguiente ciclo.
      }
    }
    void consultar();
    const intervalo = window.setInterval(() => void consultar(), 3000);
    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  function ejecutar(accion: () => Promise<{ ok: boolean; mensaje?: string }>) {
    startTransition(async () => {
      const resultado = await accion();
      if (resultado.ok) toast.success(resultado.mensaje ?? "Listo.");
      else toast.error(resultado.mensaje ?? "No se pudo completar.");
      router.refresh();
    });
  }

  if (!estado) {
    return (
      <p className="text-sm text-muted-foreground">No hay una cuenta de WhatsApp configurada.</p>
    );
  }
  const info = INFO_ESTADO_WHATSAPP[estado.estado];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
            TONO[estado.estado],
          )}
        >
          <span className="size-2 rounded-full bg-current" aria-hidden />
          {info.etiqueta}
        </span>
        {estado.telefono ? (
          <span className="text-sm text-foreground">+{estado.telefono}</span>
        ) : null}
        <Badge
          variant="outline"
          className={estado.workerActivo ? "text-success" : "text-destructive"}
        >
          {estado.workerActivo ? "Worker activo" : "Worker apagado"}
        </Badge>
      </div>

      {!estado.workerActivo ? (
        <p className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
          El proceso «worker» no está reportando actividad. En Railway debe existir el servicio
          worker corriendo (ver instructivo); en local, ejecuta <code>npm run worker</code>.
        </p>
      ) : null}

      {estado.estado === "qr" && estado.qrImagen ? (
        <div className="grid gap-3 sm:grid-cols-[18rem_1fr] sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR generado en el servidor, cambia cada pocos segundos */}
          <img
            src={estado.qrImagen}
            alt="Código QR para vincular WhatsApp"
            width={288}
            height={288}
            className="rounded-lg border bg-white p-2"
          />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Escanea el código desde el teléfono del número que atenderá el CRM.
            </p>
            <p className="mt-1">
              WhatsApp → Menú (⋮) o Configuración → Dispositivos vinculados → Vincular un
              dispositivo.
            </p>
            <p className="mt-1">
              El código se renueva solo; si caduca, pulsa «Generar QR de nuevo».
            </p>
          </div>
        </div>
      ) : null}

      {estado.estado === "conectado" && estado.conectadoAt ? (
        <p className="text-sm text-muted-foreground">
          Conectado desde {formatearFechaHora(estado.conectadoAt)}. Los mensajes que lleguen crean
          casos en el pipeline.
        </p>
      ) : null}

      {estado.ultimoError ? (
        <p className="text-sm text-destructive">Último error: {estado.ultimoError}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={estado.estado === "conectado" ? "outline" : "default"}
          disabled={pendiente}
          onClick={() => ejecutar(reiniciarWhatsApp)}
        >
          {pendiente ? (
            <Loader2 className="animate-spin" />
          ) : estado.estado === "conectado" ? (
            <RefreshCw />
          ) : (
            <QrCode />
          )}
          {estado.estado === "conectado" ? "Reconectar" : "Generar QR de nuevo"}
        </Button>
        {estado.estado === "conectado" ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={pendiente}
            onClick={() => {
              if (
                !window.confirm("¿Cerrar la sesión de WhatsApp? Tendrás que escanear un QR nuevo.")
              )
                return;
              ejecutar(cerrarSesionWhatsApp);
            }}
          >
            <LogOut />
            Cerrar sesión
          </Button>
        ) : null}
      </div>
    </div>
  );
}
