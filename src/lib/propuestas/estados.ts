import type { Enums } from "@/types/database";

export type EstadoPropuesta = Enums<"estado_propuesta">;

export type TonoEstado = "neutral" | "info" | "warning" | "success" | "danger";

type InfoEstado = {
  etiqueta: string;
  /** Texto que ve el cliente en su portal. */
  descripcionCliente: string;
  /** Ayuda para el equipo al elegir el estado. */
  descripcionEquipo: string;
  tono: TonoEstado;
};

export const ESTADOS_PROPUESTA = [
  "pendiente",
  "requiere_informacion",
  "en_diagnostico",
  "en_elaboracion",
  "verificando",
  "finalizada",
  "cancelada",
] as const satisfies readonly EstadoPropuesta[];

export const INFO_ESTADO: Record<EstadoPropuesta, InfoEstado> = {
  pendiente: {
    etiqueta: "Pendiente",
    descripcionCliente: "Recibimos tu solicitud. Un asesor revisará tu caso muy pronto.",
    descripcionEquipo: "Caso nuevo, aún sin revisar.",
    tono: "neutral",
  },
  requiere_informacion: {
    etiqueta: "Requiere información",
    descripcionCliente:
      "Necesitamos algunos datos o documentos adicionales para continuar con tu caso.",
    descripcionEquipo: "En pausa hasta que el cliente envíe lo solicitado.",
    tono: "warning",
  },
  en_diagnostico: {
    etiqueta: "En diagnóstico",
    descripcionCliente:
      "Estamos analizando tu situación financiera: deudas, ingresos y capacidad de pago.",
    descripcionEquipo: "Se está diligenciando la matriz de diagnóstico.",
    tono: "info",
  },
  en_elaboracion: {
    etiqueta: "En elaboración",
    descripcionCliente: "Estamos preparando tu propuesta legal con base en el diagnóstico.",
    descripcionEquipo: "Se está redactando la propuesta.",
    tono: "info",
  },
  verificando: {
    etiqueta: "Verificando",
    descripcionCliente: "Un abogado está revisando tu propuesta antes de entregártela.",
    descripcionEquipo: "Revisión jurídica final antes de entregar.",
    tono: "info",
  },
  finalizada: {
    etiqueta: "Finalizada",
    descripcionCliente: "¡Tu propuesta está lista! Ya puedes descargarla.",
    descripcionEquipo: "Documento final cargado y visible para el cliente.",
    tono: "success",
  },
  cancelada: {
    etiqueta: "Cancelada",
    descripcionCliente: "Este proceso fue cerrado. Si tienes dudas, contáctanos.",
    descripcionEquipo: "Proceso cerrado; no avanza.",
    tono: "danger",
  },
};

/** Etapas que ve el cliente como línea de progreso. */
export const ETAPAS_PROCESO = [
  "pendiente",
  "en_diagnostico",
  "en_elaboracion",
  "verificando",
  "finalizada",
] as const satisfies readonly EstadoPropuesta[];

type EtapaProceso = (typeof ETAPAS_PROCESO)[number];

function esEtapa(estado: EstadoPropuesta | null | undefined): estado is EtapaProceso {
  return (ETAPAS_PROCESO as readonly string[]).includes(estado ?? "");
}

/**
 * Índice de la etapa en la que está el proceso. Si el estado actual es una pausa
 * ("requiere_informacion" o "cancelada"), se usa la última etapa alcanzada según el historial
 * (ordenado del más reciente al más antiguo).
 */
export function indiceEtapaActual(
  estado: EstadoPropuesta,
  historialReciente: readonly EstadoPropuesta[] = [],
): number {
  if (esEtapa(estado)) return ETAPAS_PROCESO.indexOf(estado);
  const ultimaEtapa = historialReciente.find(esEtapa);
  return ultimaEtapa ? ETAPAS_PROCESO.indexOf(ultimaEtapa) : 0;
}

export function esEstadoPropuesta(valor: unknown): valor is EstadoPropuesta {
  return typeof valor === "string" && (ESTADOS_PROPUESTA as readonly string[]).includes(valor);
}

export const ESTADOS_EN_CURSO: readonly EstadoPropuesta[] = [
  "pendiente",
  "requiere_informacion",
  "en_diagnostico",
  "en_elaboracion",
  "verificando",
];
