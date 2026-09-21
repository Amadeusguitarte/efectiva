import type { Metadata } from "next";
import Link from "next/link";

import { DatosResponsable, PaginaLegal } from "@/components/marketing/pagina-legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: `Información legal sobre el titular del sitio web de ${siteConfig.name}.`,
  alternates: { canonical: "/aviso-legal" },
};

export default function AvisoLegalPage() {
  return (
    <PaginaLegal titulo="Aviso legal">
      <h2>1. Titular del sitio</h2>
      <DatosResponsable />

      <h2>2. Actividad</h2>
      <p>
        {siteConfig.name} presta servicios de asesoría y acompañamiento jurídico en procesos de
        insolvencia de persona natural no comerciante, conforme al Código General del Proceso (Ley
        1564 de 2012) y las normas que lo modifican o reglamentan.
      </p>

      <h2>3. Uso del sitio</h2>
      <p>
        El uso de este sitio está sujeto a nuestros{" "}
        <Link href="/terminos-y-condiciones">Términos y condiciones</Link> y a nuestra{" "}
        <Link href="/politica-de-privacidad">Política de tratamiento de datos personales</Link>.
      </p>

      <h2>4. Propiedad intelectual</h2>
      <p>
        La marca, el logotipo y los contenidos del sitio están protegidos por las normas de
        propiedad intelectual. Queda prohibido su uso sin autorización.
      </p>

      <h2>5. Exención de responsabilidad</h2>
      <p>
        La información publicada tiene carácter general y puede cambiar por reformas legales. Antes
        de tomar decisiones sobre tu caso, consulta con nuestro equipo.
      </p>
    </PaginaLegal>
  );
}
