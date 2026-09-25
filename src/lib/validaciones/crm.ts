import { z } from "zod";

import { CANALES, ESTADOS_TAREA, VALORES_TIPO_TAREA } from "@/lib/crm/catalogos";
import { PROVEEDORES_IA } from "@/lib/crm/ia";
import { normalizarTelefono } from "@/lib/crm/telefono";

import { correoSchema } from "./comunes";

const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Máximo ${maximo} caracteres.`)
    .optional()
    .transform((valor) => valor || null);

const uuidOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => valor || null)
  .pipe(z.uuid("Selecciona una opción válida.").nullable());

const fechaOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => valor || null)
  .pipe(z.iso.date("Escribe una fecha válida.").nullable());

const booleano = z
  .string()
  .optional()
  .transform((valor) => valor === "on" || valor === "true" || valor === "1");

const telefonoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor, ctx) => {
    if (!valor) return null;
    const normalizado = normalizarTelefono(valor);
    if (!normalizado) {
      ctx.addIssue({
        code: "custom",
        message: "Escribe un teléfono válido (con indicativo si no es celular colombiano).",
      });
      return z.NEVER;
    }
    return normalizado;
  });

const emailOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => valor || null)
  .pipe(correoSchema.nullable());

export const casoSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre.").max(160, "Máximo 160 caracteres."),
  telefono: telefonoOpcional,
  email: emailOpcional,
  etapa_id: uuidOpcional,
  responsable_id: uuidOpcional,
  proxima_accion: textoOpcional(500),
  proxima_accion_fecha: fechaOpcional,
});

export const CAMPOS_CASO = [
  "nombre",
  "telefono",
  "email",
  "etapa_id",
  "responsable_id",
  "proxima_accion",
  "proxima_accion_fecha",
] as const;

export const moverEtapaSchema = z.object({
  caso_id: z.uuid(),
  etapa_id: z.uuid("Selecciona una etapa."),
  motivo: textoOpcional(500),
});

export const asignarResponsableSchema = z.object({
  caso_id: z.uuid(),
  responsable_id: uuidOpcional,
});

export const proximaAccionSchema = z.object({
  caso_id: z.uuid(),
  proxima_accion: textoOpcional(500),
  proxima_accion_fecha: fechaOpcional,
});

export const notaCasoSchema = z.object({
  caso_id: z.uuid(),
  contenido: z.string().trim().min(1, "Escribe la nota.").max(5000, "Máximo 5000 caracteres."),
});

export const tareaSchema = z.object({
  caso_id: z.uuid(),
  tipo: z.enum(VALORES_TIPO_TAREA, "Selecciona el tipo."),
  titulo: z.string().trim().min(1, "Escribe el título.").max(200, "Máximo 200 caracteres."),
  descripcion: textoOpcional(2000),
  vence_at: fechaOpcional,
  responsable_id: uuidOpcional,
});

export const CAMPOS_TAREA = [
  "tipo",
  "titulo",
  "descripcion",
  "vence_at",
  "responsable_id",
] as const;

export const estadoTareaSchema = z.object({
  tarea_id: z.uuid(),
  estado: z.enum(ESTADOS_TAREA),
});

export const mensajeSchema = z.object({
  caso_id: z.uuid(),
  canal: z.enum(CANALES),
  asunto: textoOpcional(300),
  contenido: z.string().trim().min(1, "Escribe el mensaje.").max(20000, "Máximo 20000 caracteres."),
});

export const vincularClienteSchema = z.object({
  caso_id: z.uuid(),
  cliente_id: z.uuid("Selecciona un cliente."),
});

export const crearExpedienteSchema = z.object({
  caso_id: z.uuid(),
  email: emailOpcional,
});

const tareaAutomaticaSchema = z.object({
  tipo: z.enum(VALORES_TIPO_TAREA),
  titulo: z.string().trim().min(1, "Escribe el título de la tarea.").max(200),
  descripcion: textoOpcional(2000),
  dias_plazo: z.coerce.number().int().min(0).max(365).catch(0),
});

const HEX = /^#[0-9a-fA-F]{6}$/;

export const etapaSchema = z.object({
  id: uuidOpcional,
  nombre: z.string().trim().min(1, "Escribe el nombre.").max(60, "Máximo 60 caracteres."),
  color: z.string().trim().regex(HEX, "Elige un color."),
  descripcion: textoOpcional(500),
  cierre: z
    .string()
    .optional()
    .transform((valor) => valor || null)
    .pipe(z.enum(["ganado", "perdido"]).nullable()),
  tareas_automaticas: z
    .string()
    .optional()
    .transform((valor, ctx) => {
      if (!valor) return [];
      try {
        const json: unknown = JSON.parse(valor);
        const lista = z
          .array(tareaAutomaticaSchema)
          .max(10, "Máximo 10 tareas automáticas.")
          .parse(json);
        return lista;
      } catch {
        ctx.addIssue({ code: "custom", message: "Revisa las tareas automáticas." });
        return z.NEVER;
      }
    }),
  correo_asunto: textoOpcional(300),
  correo_cuerpo: textoOpcional(5000),
});

export const CAMPOS_ETAPA = [
  "id",
  "nombre",
  "color",
  "descripcion",
  "cierre",
  "tareas_automaticas",
  "correo_asunto",
  "correo_cuerpo",
] as const;

export const ajustesIaSchema = z.object({
  activo: booleano,
  proveedor: z.enum(PROVEEDORES_IA, "Selecciona el proveedor."),
  modelo: z.string().trim().min(1, "Escribe el modelo.").max(100),
  api_key: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((valor) => valor || null),
  aplicar_etapa_sugerida: booleano,
});

export const CAMPOS_AJUSTES_IA = [
  "activo",
  "proveedor",
  "modelo",
  "aplicar_etapa_sugerida",
] as const;

const puerto = z.coerce.number().int().min(1, "Puerto inválido.").max(65535, "Puerto inválido.");

export const ajustesCorreoSchema = z.object({
  activo: booleano,
  remitente_nombre: z.string().trim().min(1, "Escribe el nombre del remitente.").max(100),
  remitente_email: correoSchema,
  usuario: z.string().trim().min(1, "Escribe el usuario.").max(254),
  contrasena: z
    .string()
    .max(400)
    .optional()
    .transform((valor) => valor || null),
  smtp_host: z.string().trim().min(1, "Escribe el servidor SMTP.").max(200),
  smtp_puerto: puerto,
  smtp_seguro: booleano,
  imap_host: z.string().trim().min(1, "Escribe el servidor IMAP.").max(200),
  imap_puerto: puerto,
  imap_seguro: booleano,
});

export const CAMPOS_AJUSTES_CORREO = [
  "activo",
  "remitente_nombre",
  "remitente_email",
  "usuario",
  "smtp_host",
  "smtp_puerto",
  "smtp_seguro",
  "imap_host",
  "imap_puerto",
  "imap_seguro",
] as const;

export type CasoValidado = z.infer<typeof casoSchema>;
export type EtapaValidada = z.infer<typeof etapaSchema>;
export type AjustesIaValidados = z.infer<typeof ajustesIaSchema>;
export type AjustesCorreoValidados = z.infer<typeof ajustesCorreoSchema>;
