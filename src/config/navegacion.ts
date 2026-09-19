export const SECCIONES = {
  beneficios: "beneficios",
  comoFunciona: "como-funciona",
  elegibilidad: "elegibilidad",
  nosotros: "nosotros",
  preguntas: "preguntas-frecuentes",
  agenda: "agenda",
} as const;

export type Seccion = (typeof SECCIONES)[keyof typeof SECCIONES];

export const enlacesPrincipales = [
  { nombre: "Beneficios", seccion: SECCIONES.beneficios },
  { nombre: "Cómo funciona", seccion: SECCIONES.comoFunciona },
  { nombre: "Nosotros", seccion: SECCIONES.nosotros },
] as const;

export const enlacesPie = [
  ...enlacesPrincipales,
  { nombre: "¿Quién puede aplicar?", seccion: SECCIONES.elegibilidad },
  { nombre: "Preguntas frecuentes", seccion: SECCIONES.preguntas },
] as const;

export const enlacesLegales = [
  { nombre: "Política de tratamiento de datos", href: "/politica-de-privacidad" },
  { nombre: "Términos y condiciones", href: "/terminos-y-condiciones" },
  { nombre: "Aviso legal", href: "/aviso-legal" },
] as const;
