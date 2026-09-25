import { KeyRound } from "lucide-react";
import type { Metadata } from "next";

import { probarIa } from "@/app/admin/configuracion/acciones";
import { BotonProbar } from "@/components/configuracion/boton-probar";
import { FormularioAjustesIa } from "@/components/configuracion/formulario-ajustes-ia";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerAjustes } from "@/lib/datos/crm";
import { formatearFechaHora } from "@/lib/formato";

export const metadata: Metadata = {
  title: "IA",
};

export default async function ConfiguracionIaPage() {
  const ajustes = await obtenerAjustes();

  return (
    <div className="grid max-w-3xl gap-6">
      {!ajustes.hayClaveCifrado ? (
        <Alert variant="destructive">
          <KeyRound />
          <AlertTitle>Falta la clave de cifrado del servidor</AlertTitle>
          <AlertDescription>
            <p>
              Las claves de API y contraseñas se guardan cifradas con la variable de entorno{" "}
              <code>CRM_CLAVE_CIFRADO</code>. Genera una con <code>openssl rand -hex 32</code> (o
              desde Node:{" "}
              <code>
                node -e
                &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
              </code>
              ), defínela en Railway para el servicio web y el worker, y vuelve a desplegar.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Inteligencia artificial</CardTitle>
            <CardDescription>
              Elige el proveedor y el modelo con el que se analizan los casos. Última actualización:{" "}
              {formatearFechaHora(ajustes.ia.actualizadoAt)}.
            </CardDescription>
          </div>
          <BotonProbar accion={probarIa} />
        </CardHeader>
        <CardContent>
          <FormularioAjustesIa ajustes={ajustes.ia} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qué hace la IA</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-sm text-muted-foreground">
            <li>Lee la conversación del caso (WhatsApp y correo) y las notas del equipo.</li>
            <li>
              Devuelve un resumen, la prioridad, la etapa sugerida, la próxima acción y los
              documentos pendientes.
            </li>
            <li>
              Se ejecuta desde la ficha del caso o con «Analizar con IA» en el pipeline (casos con
              mensajes nuevos).
            </li>
            <li>No escribe ni envía mensajes: todas las respuestas las redacta el equipo.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
