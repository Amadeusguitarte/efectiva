"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { aceptarPoliticaDatos } from "@/app/portal/acciones";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { MensajeFormulario } from "@/components/formularios/mensaje-formulario";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ESTADO_INICIAL } from "@/lib/acciones";

export function ConsentimientoDatos() {
  const [estado, accion] = useActionState(aceptarPoliticaDatos, ESTADO_INICIAL);

  return (
    <Card className="mx-auto max-w-2xl shadow-elegant">
      <CardHeader>
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <CardTitle className="text-xl">Antes de continuar</CardTitle>
        <CardDescription>
          Para analizar tu caso necesitamos tratar tus datos personales y financieros de forma
          segura y confidencial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={accion} className="grid gap-5">
          <MensajeFormulario estado={estado} />
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Usaremos tu información solo para evaluar y adelantar tu proceso de insolvencia.
            </li>
            <li>Tus documentos se guardan de forma privada y solo nuestro equipo puede verlos.</li>
            <li>
              Puedes consultar, actualizar o pedir la eliminación de tus datos escribiendo a{" "}
              {siteConfig.contact.email}.
            </li>
          </ul>
          <label className="flex items-start gap-3 rounded-lg border bg-surface-soft p-4 text-sm">
            <input
              type="checkbox"
              name="acepto"
              value="si"
              required
              className="mt-0.5 size-4 shrink-0 accent-primary"
              aria-invalid={Boolean(estado.errores?.acepto)}
            />
            <span>
              Autorizo a {siteConfig.name} el tratamiento de mis datos personales conforme a la{" "}
              <Link
                href="/politica-de-privacidad"
                target="_blank"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Política de tratamiento de datos
              </Link>{" "}
              (Ley 1581 de 2012).
            </span>
          </label>
          <BotonEnviar className="w-full sm:w-auto sm:justify-self-end" textoPendiente="Guardando…">
            Aceptar y continuar
          </BotonEnviar>
        </form>
      </CardContent>
    </Card>
  );
}
