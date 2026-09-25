import type { Metadata } from "next";

import { NavConfiguracion } from "@/components/configuracion/nav-configuracion";
import { EncabezadoPagina } from "@/components/plataforma/encabezado-pagina";

export const metadata: Metadata = {
  title: {
    default: "Configuración",
    template: "%s · Configuración | Panel · Insolvencia Efectiva",
  },
};

export default function ConfiguracionLayout({ children }: LayoutProps<"/admin/configuracion">) {
  return (
    <>
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Etapas del pipeline, inteligencia artificial y conexión de WhatsApp y correo."
        className="mb-4"
      />
      <NavConfiguracion />
      {children}
    </>
  );
}
