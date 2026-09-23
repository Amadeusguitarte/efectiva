/**
 * Datos del negocio. Única fuente de verdad para textos de contacto, SEO y páginas legales:
 * cualquier cambio aquí se refleja en toda la web.
 */
export const siteConfig = {
  name: "Insolvencia Efectiva",
  shortDescription: "Ley de Insolvencia en Colombia",
  description:
    "Soluciona tus deudas legalmente con la Ley de Insolvencia. Detén embargos, reduce deudas y protege tus bienes. Consulta gratis.",
  locale: "es_CO",
  /** Año de inicio de operaciones; los "años de experiencia" se calculan a partir de aquí. */
  foundedYear: 2008,
  contact: {
    phoneDisplay: "+57 319 542 0600",
    phoneE164: "+573195420600",
    whatsappNumber: "573195420600",
    whatsappMessage: "Hola, necesito información sobre la Ley de Insolvencia",
    email: "insolvenciaefectivacolombia@gmail.com",
    city: "Bogotá",
    country: "Colombia",
  },
  social: {
    instagram: "https://www.instagram.com/insolvencia_efectiva/",
  },
  calendlyUrl: "https://calendly.com/insolvenciaefectivacolombia/30min",
  advisor: {
    name: "Juan Hernandez",
    role: "Representante Insolvencia Efectiva",
  },
  /** Cuentas del equipo: el usuario `nombre` inicia sesión como `nombre@<usernameDomain>`. */
  team: {
    usernameDomain: "insolvenciaefectiva.com",
  },
  /** Membrete de la propuesta legal en PDF (pie de página de la plantilla oficial). */
  letterhead: {
    phones: ["(+57) 312-320-2461", "(+57) 319-542-0600"],
    email: "insolvenciaefectiva@gmail.com",
    address: "Bogotá - Calle 104 #21-50 Oficina 503",
  },
  /** Abogada que firma las propuestas legales. */
  lawyer: {
    name: "Blanca Cecilia Buitrago Díaz",
    title: "Abogada Insolvencia",
  },
  /**
   * Datos del responsable del tratamiento de datos. Los campos vacíos no se muestran en las
   * páginas legales; complétalos antes de publicar.
   */
  legal: {
    razonSocial: "",
    nit: "",
    direccion: "",
    /** Versión vigente de la política de datos. Cambiarla pide un nuevo consentimiento. */
    politicaDatosVersion: "2026-09-17",
    politicaDatosFecha: "17 de septiembre de 2026",
  },
} as const;

export function yearsOfExperience(now: Date = new Date()): number {
  return now.getFullYear() - siteConfig.foundedYear;
}

export function whatsappUrl(
  message: string = siteConfig.contact.whatsappMessage,
  number: string = siteConfig.contact.whatsappNumber,
): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
