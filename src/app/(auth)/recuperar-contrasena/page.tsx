import type { Metadata } from "next";
import Link from "next/link";

import { FormularioRecuperacion } from "@/components/auth/formulario-recuperacion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
};

export default function RecuperarContrasenaPage() {
  return (
    <Card className="shadow-elegant">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
        <CardDescription>
          Solo para cuentas del equipo. Los clientes ingresan con Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormularioRecuperacion />
        <Link
          href="/ingresar"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Volver a ingresar
        </Link>
      </CardContent>
    </Card>
  );
}
