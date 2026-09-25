import type { Enums } from "@/types/database";

/** Catálogos y etiquetas del CRM. */

export type CanalCrm = Enums<"crm_canal">;
export type DireccionMensaje = Enums<"crm_direccion">;
export type EstadoEnvio = Enums<"crm_estado_envio">;
export type TipoTarea = Enums<"crm_tipo_tarea">;
export type EstadoTarea = Enums<"crm_estado_tarea">;
export type TipoEvento = Enums<"crm_tipo_evento">;
export type CierreEtapa = Enums<"crm_cierre">;
export type EstadoWhatsApp = Enums<"wa_estado">;

export const CANALES = ["whatsapp", "correo"] as const satisfies readonly CanalCrm[];

export const INFO_CANAL: Record<CanalCrm, { etiqueta: string; corta: string }> = {
  whatsapp: { etiqueta: "WhatsApp", corta: "WA" },
  correo: { etiqueta: "Correo", corta: "@" },
};

export const TIPOS_TAREA = [
  { valor: "documentos", etiqueta: "Documentos solicitados" },
  { valor: "recontacto", etiqueta: "Recontacto" },
  { valor: "seguimiento", etiqueta: "Seguimiento" },
  { valor: "otra", etiqueta: "Otra" },
] as const satisfies readonly { valor: TipoTarea; etiqueta: string }[];

export const VALORES_TIPO_TAREA = TIPOS_TAREA.map((t) => t.valor);

export const INFO_TIPO_TAREA = Object.fromEntries(TIPOS_TAREA.map((t) => [t.valor, t])) as Record<
  TipoTarea,
  (typeof TIPOS_TAREA)[number]
>;

export const ESTADOS_TAREA = [
  "pendiente",
  "completada",
  "cancelada",
] as const satisfies readonly EstadoTarea[];

export const INFO_ESTADO_TAREA: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const INFO_TIPO_EVENTO: Record<TipoEvento, string> = {
  creacion: "Creación",
  etapa: "Cambio de etapa",
  responsable: "Responsable",
  proxima_accion: "Próxima acción",
  nota: "Nota",
  tarea_creada: "Tarea creada",
  tarea_completada: "Tarea completada",
  correo_automatico: "Correo automático",
  analisis_ia: "Análisis de IA",
  expediente: "Expediente",
  datos: "Datos",
};

export const INFO_CIERRE: Record<CierreEtapa, { etiqueta: string }> = {
  ganado: { etiqueta: "Cierre ganado" },
  perdido: { etiqueta: "Cierre perdido" },
};

export const INFO_ESTADO_WHATSAPP: Record<
  EstadoWhatsApp,
  { etiqueta: string; tono: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  desconectado: { etiqueta: "Desconectado", tono: "neutral" },
  qr: { etiqueta: "Esperando escaneo del QR", tono: "warning" },
  conectando: { etiqueta: "Conectando", tono: "info" },
  conectado: { etiqueta: "Conectado", tono: "success" },
  error: { etiqueta: "Error", tono: "danger" },
};

export const PRIORIDADES = ["alta", "media", "baja"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const INFO_PRIORIDAD: Record<Prioridad, { etiqueta: string }> = {
  alta: { etiqueta: "Prioridad alta" },
  media: { etiqueta: "Prioridad media" },
  baja: { etiqueta: "Prioridad baja" },
};

/** Tarea automática configurada en una etapa (columna `tareas_automaticas`). */
export type TareaAutomatica = {
  tipo: TipoTarea;
  titulo: string;
  descripcion?: string | null;
  dias_plazo: number;
};

/** Correo automático de una etapa (columna `correo_automatico`). */
export type CorreoAutomatico = { asunto: string; cuerpo: string };

/** Marcadores disponibles en asuntos y cuerpos de correos automáticos. */
export const MARCADORES_PLANTILLA = ["{{nombre}}", "{{etapa}}"] as const;
