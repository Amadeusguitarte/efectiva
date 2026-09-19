"use client";

import { FileText, Loader2, Upload } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { confirmarDocumento, prepararSubidaDocumento } from "@/app/admin/clientes/acciones";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { BUCKET_PROPUESTAS, DOCUMENTO_MAX_BYTES } from "@/lib/propuestas/documentos";

type SubirDocumentoProps = {
  propuestaId: string;
  tieneDocumento: boolean;
};

export function SubirDocumento({ propuestaId, tieneDocumento }: SubirDocumentoProps) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function alSeleccionar(archivo: File | undefined) {
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      toast.error("El documento debe ser un PDF.");
      return;
    }
    if (archivo.size > DOCUMENTO_MAX_BYTES) {
      toast.error("El PDF supera el máximo de 10 MB.");
      return;
    }

    setSubiendo(true);
    try {
      const preparacion = await prepararSubidaDocumento(propuestaId);
      if (!preparacion.ok) throw new Error(preparacion.mensaje);

      const { error } = await createClient()
        .storage.from(BUCKET_PROPUESTAS)
        .uploadToSignedUrl(preparacion.ruta, preparacion.token, archivo, {
          contentType: "application/pdf",
        });
      if (error) throw new Error("No pudimos subir el archivo. Inténtalo de nuevo.");

      const confirmacion = await confirmarDocumento(propuestaId, preparacion.ruta);
      if (!confirmacion.ok) throw new Error(confirmacion.mensaje);

      toast.success(confirmacion.mensaje);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos subir el documento.");
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-5" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">
            {tieneDocumento ? "Documento final cargado" : "Sin documento final"}
          </p>
          <p className="text-muted-foreground">PDF de máximo 10 MB.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tieneDocumento ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={`/documentos/propuestas/${propuestaId}` as Route}
              target="_blank"
              rel="noopener"
            >
              Ver
            </a>
          </Button>
        ) : null}
        <input
          ref={entrada}
          type="file"
          accept="application/pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(evento) => alSeleccionar(evento.target.files?.[0])}
        />
        <Button
          type="button"
          size="sm"
          variant={tieneDocumento ? "outline" : "default"}
          disabled={subiendo}
          onClick={() => entrada.current?.click()}
        >
          {subiendo ? <Loader2 className="animate-spin" /> : <Upload />}
          {subiendo ? "Subiendo…" : tieneDocumento ? "Reemplazar" : "Subir PDF"}
        </Button>
      </div>
    </div>
  );
}
