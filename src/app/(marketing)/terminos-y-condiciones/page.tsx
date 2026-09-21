import type { Metadata } from "next";
import Link from "next/link";

import { PaginaLegal } from "@/components/marketing/pagina-legal";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: `Condiciones de uso del sitio web y del portal de clientes de ${siteConfig.name}.`,
  alternates: { canonical: "/terminos-y-condiciones" },
};

export default function TerminosPage() {
  const { contact } = siteConfig;

  return (
    <PaginaLegal titulo="Términos y condiciones de uso">
      <p>
        Al usar este sitio web o el portal de clientes de {siteConfig.name} aceptas estos términos.
        Si no estás de acuerdo con ellos, te pedimos no utilizar nuestros servicios digitales.
      </p>

      <h2>1. Naturaleza de la información</h2>
      <p>
        El contenido del sitio es informativo y general. No constituye asesoría jurídica para un
        caso concreto ni crea una relación profesional hasta que se formalice la contratación de
        nuestros servicios.
      </p>

      <h2>2. Consulta gratuita</h2>
      <p>
        La consulta inicial no tiene costo y sirve para evaluar tu situación. Tras ella te
        informaremos, antes de cualquier compromiso, las condiciones y honorarios del servicio.
      </p>

      <h2>3. Portal de clientes</h2>
      <ul>
        <li>El acceso es personal. Eres responsable de la seguridad de tu cuenta.</li>
        <li>
          Debes suministrar información veraz, completa y actualizada; el resultado del análisis
          depende de ella.
        </li>
        <li>
          Podemos suspender cuentas usadas de forma indebida o que pongan en riesgo la seguridad de
          la plataforma.
        </li>
      </ul>

      <h2>4. Propuestas y resultados</h2>
      <p>
        Las propuestas se elaboran con la información que nos entregas y son revisadas por nuestro
        equipo jurídico antes de su entrega. El resultado final de un proceso de insolvencia depende
        de cada caso y de las decisiones de acreedores, conciliadores y jueces, por lo que no
        garantizamos un resultado específico.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los textos, diseños, logotipos y demás contenidos del sitio pertenecen a {siteConfig.name} o
        a sus licenciantes. No pueden reproducirse sin autorización previa y por escrito.
      </p>

      <h2>6. Enlaces y servicios de terceros</h2>
      <p>
        El sitio integra servicios de terceros (por ejemplo, agenda de citas o mensajería). Su uso
        se rige por las condiciones de cada proveedor.
      </p>

      <h2>7. Responsabilidad</h2>
      <p>
        Trabajamos para que el sitio funcione correctamente, pero no garantizamos que esté libre de
        interrupciones o errores técnicos ajenos a nuestro control.
      </p>

      <h2>8. Datos personales</h2>
      <p>
        El tratamiento de tus datos se rige por nuestra{" "}
        <Link href="/politica-de-privacidad">Política de tratamiento de datos personales</Link>.
      </p>

      <h2>9. Ley aplicable y cambios</h2>
      <p>
        Estos términos se rigen por las leyes de la República de Colombia. Podemos actualizarlos; la
        versión vigente siempre estará publicada en esta página.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Para cualquier inquietud escríbenos a{" "}
        <a href={`mailto:${contact.email}`}>{contact.email}</a> o llámanos al {contact.phoneDisplay}
        .
      </p>
    </PaginaLegal>
  );
}
