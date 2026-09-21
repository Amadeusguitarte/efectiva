/**
 * Eventos de conversión. Si GA4 o Meta Pixel no están configurados, las llamadas no hacen nada.
 */

type ParametrosEvento = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const EVENTOS_META: Record<string, string> = {
  generate_lead: "Lead",
  contact: "Contact",
  schedule: "Schedule",
};

export function registrarEvento(nombre: string, parametros: ParametrosEvento = {}) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", nombre, parametros);

  const eventoMeta = EVENTOS_META[nombre];
  if (eventoMeta) {
    window.fbq?.("track", eventoMeta, parametros);
  }
}
