/**
 * Textos fijos de la propuesta legal, tomados de la plantilla oficial de Insolvencia Efectiva.
 * El prompt de la propuesta exige conservarlos exactamente (encabezado, párrafo fijo del punto 3,
 * puntos 5 y 6, cierre y firma). No los cambies sin el visto bueno del equipo.
 */

export const TITULO_PROPUESTA = "PROPUESTA LEGAL – LEY DE INSOLVENCIA (LEY 2445 DE 2025)";

export const SALUDO = "Reciba un cordial saludo.";

export const INTRODUCCION =
  "Con base en la información financiera que usted nos ha compartido a continuación le presento el análisis de su caso, y la mejor opción para acudir al proceso de insolvencia.";

export const FRASE_DEUDAS = "Sus deudas reportadas son las siguientes:";

export const TITULOS_SECCIONES = {
  situacionEconomica: "Análisis de su situación económica actual",
  situacionLegal: "Análisis de su situación legal actual",
  recomendacion: "Recomendación jurídica",
  honorarios: "Honorarios",
  gestion: "Gestión",
  idoneidad: "Idoneidad",
} as const;

/** Va siempre después de la recomendación jurídica, sin cambiar una palabra. */
export const PARRAFO_FIJO_RECOMENDACION =
  "Con el fin de reducir los costos del proceso, podrá solicitarse al Juez que la abogada Blanca Cecilia Buitrago Díaz sea designada como liquidadora, sin generar honorarios adicionales por esta función. Esto representa un ahorro directo para el cliente y puede contribuir a agilizar la actuación judicial y, por ende, el desarrollo de su caso.";

export const GESTION: readonly string[] = [
  "Nuestro acompañamiento comprende la asesoría jurídica integral durante todas las etapas del proceso de insolvencia, desde la revisión inicial de la situación financiera y jurídica del cliente, la preparación y presentación de la solicitud correspondiente, hasta la intervención ante el Centro de Conciliación o la autoridad competente, según la ruta definida para el caso.",
  "Durante el desarrollo del proceso brindaremos acompañamiento permanente en la preparación de propuestas, revisión de actuaciones, atención de requerimientos y manejo de las comunicaciones con acreedores y terceros. Asimismo, orientaremos al cliente frente a las decisiones que deban adoptarse durante el trámite, procurando que cada actuación sea comprensible, estratégica y acorde con los objetivos definidos desde la asesoría inicial.",
  "Nuestro propósito es que el cliente cuente con acompañamiento jurídico cercano, información clara y seguimiento permanente, de manera que pueda afrontar el proceso con mayor seguridad y conocimiento de cada una de sus etapas.",
];

export const IDONEIDAD: readonly string[] = [
  "El caso será atendido por Blanca Cecilia Buitrago Díaz, abogada especializada en Derecho Administrativo y certificada en procesos de insolvencia, con experiencia en el manejo de este tipo de procedimientos y vinculada desde el año 2008 a la lista de expertos, liquidadores y promotores de la Superintendencia de Sociedades.",
  "La trayectoria y participación profesional de la abogada Blanca Cecilia Buitrago Díaz puede ser verificada directamente en los registros oficiales de la Superintendencia de Sociedades, siguiendo la siguiente ruta de consulta:",
];

export const RUTA_CONSULTA: readonly string[] = [
  "www.supersociedades.gov.co",
  "Sede electrónica Superintendencia de Sociedades",
  "Delegaturas",
  "Procedimientos de Insolvencia",
  "Auxiliares de la Justicia",
  "Lista de auxiliares y evaluadores",
  "Lista de auxiliares de la justicia",
  "Buitrago Diaz Blanca Cecilia.",
];

export const IDONEIDAD_CIERRE: readonly string[] = [
  "Su experiencia profesional permite brindar una asesoría enfocada no solo en el cumplimiento de los requisitos legales del proceso, sino también en el análisis estratégico de la situación patrimonial, financiera y jurídica de cada cliente, con el objetivo de estructurar soluciones adecuadas a las circunstancias particulares de cada caso.",
  "La información profesional puede ser consultada y verificada ante las entidades competentes, incluyendo la Superintendencia de Sociedades y el Consejo Superior de la Judicatura, conforme a los datos profesionales incorporados en esta propuesta.",
];

export const DESPEDIDA =
  "Quedo atenta para atender y resolver las inquietudes y/o sugerencias de su parte.";

export const CORDIALMENTE = "Cordialmente,";

/** Frases que van en negrita dentro de los textos fijos. */
export const FRASES_EN_NEGRITA: readonly string[] = [
  "Blanca Cecilia Buitrago Díaz",
  "Superintendencia de Sociedades y el Consejo Superior de la Judicatura",
];
