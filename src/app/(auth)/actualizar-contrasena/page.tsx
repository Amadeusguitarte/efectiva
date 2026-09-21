import type { Metadata } from "next";

import { FormularioNuevaContrasena } from "@/components/auth/formulario-nueva-contrasena";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requerirUsuario } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Crear contraseña",
};

export default async function ActualizarContrasenaPage() {
  const usuario = await requerirUsuario();

  return (
    <Card className="shadow-elegant">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Crea tu contraseña</CardTitle>
        <CardDescription>
          Cuenta: <span className="font-medium text-foreground">{usuario.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormularioNuevaContrasena />
      </CardContent>
    </Card>
  );
}
