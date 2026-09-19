import { CircleAlert } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ingresarConGoogle } from "@/app/(auth)/acciones";
import { FormularioIngresoEquipo } from "@/components/auth/formulario-ingreso-equipo";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { GoogleIcon } from "@/components/iconos/google";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { destinoTrasIngreso, rutaSegura } from "@/lib/auth/rutas";
import { obtenerUsuario } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Ingresar",
};

const MENSAJES_ERROR: Record<string, string> = {
  google: "No pudimos conectar con Google. Inténtalo de nuevo.",
  auth: "No pudimos completar el inicio de sesión. Inténtalo de nuevo.",
  enlace: "El enlace no es válido o ya expiró. Solicita uno nuevo.",
};

export default async function IngresarPage({ searchParams }: PageProps<"/ingresar">) {
  const parametros = await searchParams;
  const siguiente = rutaSegura(
    typeof parametros.siguiente === "string" ? parametros.siguiente : null,
  );

  const usuario = await obtenerUsuario();
  if (usuario) redirect(destinoTrasIngreso(usuario.rol, siguiente) as Route);

  const error = typeof parametros.error === "string" ? MENSAJES_ERROR[parametros.error] : undefined;

  return (
    <Card className="shadow-elegant">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bienvenido a tu portal</CardTitle>
        <CardDescription>
          Consulta el avance de tu proceso y descarga tu propuesta legal.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form action={ingresarConGoogle} className="grid gap-3">
          {siguiente ? <input type="hidden" name="siguiente" value={siguiente} /> : null}
          <BotonEnviar
            variant="outline"
            size="lg"
            className="h-12 w-full text-base"
            textoPendiente="Conectando con Google…"
          >
            <GoogleIcon className="size-5" />
            Continuar con Google
          </BotonEnviar>
          <p className="text-center text-xs text-muted-foreground">
            Al continuar aceptas los{" "}
            <Link href="/terminos-y-condiciones" className="underline underline-offset-4">
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/politica-de-privacidad" className="underline underline-offset-4">
              política de tratamiento de datos
            </Link>
            .
          </p>
        </form>

        <details className="group rounded-lg border bg-surface-soft px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
            ¿Eres parte del equipo?
            <span className="text-muted-foreground transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="pt-4">
            <FormularioIngresoEquipo siguiente={siguiente} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
