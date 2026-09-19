import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { crearCliente } from "@/app/admin/clientes/acciones";
import { FormularioCliente } from "@/components/admin/formulario-cliente";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";
import { Card, CardContent } from "@/components/ui/card";
import { requerirAdmin } from "@/lib/auth/sesion";

export const metadata: Metadata = {
  title: "Nuevo cliente",
};

export default async function NuevoClientePage() {
  await requerirAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/clientes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Clientes
      </Link>
      <EncabezadoPagina
        titulo="Nuevo cliente"
        descripcion="Crea el expediente antes de que el cliente ingrese. Cuando entre con Google usando este mismo correo, verá su proceso automáticamente."
      />
      <Card>
        <CardContent>
          <FormularioCliente accion={crearCliente} textoBoton="Crear cliente" />
        </CardContent>
      </Card>
    </div>
  );
}
