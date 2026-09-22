import { CircleAlert } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ingresarConGoogle } from "@/app/(auth)/acciones";
import { FormularioIngreso } from "@/components/auth/formulario-ingreso";
import { BotonEnviar } from "@/components/formularios/boton-enviar";
import { GoogleIcon } from "@/components/iconos/google";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { destinoTrasIngreso, rutaSegura } from "@/lib/auth/rutas";
import { obtenerUsuario } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Iniciar sesión",
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
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Entra con tu usuario y contraseña. Si eres cliente, usa tu cuenta de Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <FormularioIngreso siguiente={siguiente} />

        <div
          aria-hidden
          className="flex items-center gap-3 text-xs tracking-wide text-muted-foreground uppercase"
        >
          <span className="h-px flex-1 bg-border" />
          <span>o</span>
          <span className="h-px flex-1 bg-border" />
        </div>

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
      </CardContent>
    </Card>
  );
}
