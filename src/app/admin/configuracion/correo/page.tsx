import type { Metadata } from "next";

import { probarCorreo } from "@/app/admin/configuracion/acciones";
import { BotonProbar } from "@/components/configuracion/boton-probar";
import { FormularioAjustesCorreo } from "@/components/configuracion/formulario-ajustes-correo";
import { InstructivoCorreo } from "@/components/configuracion/instructivos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerAjustes } from "@/lib/datos/crm";
import { formatearFechaHora } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Correo",
};

export default async function ConfiguracionCorreoPage() {
  const ajustes = await obtenerAjustes();
  const correo = ajustes.correo;

  return (
    <div className="grid max-w-3xl gap-6">
      {!ajustes.hayClaveCifrado ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Falta <code>CRM_CLAVE_CIFRADO</code> en el servidor: no se puede guardar la contraseña del
          correo. Ver Configuración → Inteligencia artificial.
        </p>
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Cuenta de correo</CardTitle>
            <CardDescription>
              {correo.revisadoAt
                ? `Última revisión de la bandeja: ${formatearFechaHora(correo.revisadoAt)}.`
                : "Todavía no se ha revisado la bandeja."}
              {correo.ultimoError ? ` Último error: ${correo.ultimoError}` : ""}
            </CardDescription>
          </div>
          <BotonProbar accion={probarCorreo} />
        </CardHeader>
        <CardContent>
          <FormularioAjustesCorreo ajustes={correo} />
        </CardContent>
      </Card>
      <InstructivoCorreo />
    </div>
  );
}
