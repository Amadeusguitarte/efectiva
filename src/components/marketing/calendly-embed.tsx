"use client";

import { useSearchParams } from "next/navigation";
import { InlineWidget, useCalendlyEventListener } from "react-calendly";

import { siteConfig } from "@/config/site";
import { registrarEvento } from "@/lib/analytics";

/**
 * Agenda de Calendly. No se precarga ningún dato: el interesado escribe su propio nombre y correo.
 * Los parámetros UTM de la URL se envían a Calendly para atribuir cada cita a su campaña.
 */
export function CalendlyEmbed() {
  const params = useSearchParams();

  useCalendlyEventListener({
    onDateAndTimeSelected: () => registrarEvento("schedule", { etapa: "horario_seleccionado" }),
    onEventScheduled: () => registrarEvento("generate_lead", { canal: "calendly" }),
  });

  return (
    <InlineWidget
      url={siteConfig.calendlyUrl}
      styles={{ height: "100%", minHeight: "650px", width: "100%" }}
      pageSettings={{
        hideGdprBanner: true,
        hideEventTypeDetails: false,
        hideLandingPageDetails: false,
      }}
      utm={{
        utmCampaign: params.get("utm_campaign") ?? undefined,
        utmContent: params.get("utm_content") ?? undefined,
        utmMedium: params.get("utm_medium") ?? undefined,
        utmSource: params.get("utm_source") ?? undefined,
        utmTerm: params.get("utm_term") ?? undefined,
      }}
    />
  );
}
