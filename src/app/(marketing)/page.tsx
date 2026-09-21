import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { AgendaConsulta } from "@/components/marketing/agenda-consulta";
import { Beneficios } from "@/components/marketing/beneficios";
import { Elegibilidad } from "@/components/marketing/elegibilidad";
import { Hero } from "@/components/marketing/hero";
import { PorQueElegirnos } from "@/components/marketing/por-que-elegirnos";
import { PreguntasFrecuentes } from "@/components/marketing/preguntas-frecuentes";
import { Proceso } from "@/components/marketing/proceso";
import { siteConfig } from "@/config/site";
import { preguntasFrecuentes } from "@/content/preguntas-frecuentes";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const datosEstructurados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LegalService",
      "@id": `${env.NEXT_PUBLIC_SITE_URL}/#organizacion`,
      name: siteConfig.name,
      description: siteConfig.description,
      url: env.NEXT_PUBLIC_SITE_URL,
      logo: `${env.NEXT_PUBLIC_SITE_URL}/icon.png`,
      image: `${env.NEXT_PUBLIC_SITE_URL}/opengraph-image`,
      telephone: siteConfig.contact.phoneE164,
      email: siteConfig.contact.email,
      foundingDate: String(siteConfig.foundedYear),
      areaServed: { "@type": "Country", name: siteConfig.contact.country },
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.contact.city,
        addressCountry: "CO",
      },
      sameAs: [siteConfig.social.instagram],
    },
    {
      "@type": "FAQPage",
      mainEntity: preguntasFrecuentes.map(({ pregunta, respuesta }) => ({
        "@type": "Question",
        name: pregunta,
        acceptedAnswer: { "@type": "Answer", text: respuesta },
      })),
    },
  ],
};

export default function InicioPage() {
  return (
    <>
      <JsonLd datos={datosEstructurados} />
      <Hero />
      <Beneficios />
      <Proceso />
      <Elegibilidad />
      <PorQueElegirnos />
      <PreguntasFrecuentes />
      <AgendaConsulta />
    </>
  );
}
