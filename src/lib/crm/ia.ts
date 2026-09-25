import { z } from "zod";

import { PRIORIDADES, type CanalCrm, type DireccionMensaje, type Prioridad } from "./catalogos";

/**
 * Análisis de casos con IA. La IA solo analiza y clasifica (resumen, prioridad, etapa sugerida,
 * próxima acción, documentos pendientes); nunca responde al cliente. Los tres proveedores exponen
 * una API compatible con la de OpenAI, así que basta un `fetch` a `chat/completions`.
 */

export const PROVEEDORES_IA = ["openai", "anthropic", "gemini"] as const;
export type ProveedorIA = (typeof PROVEEDORES_IA)[number];

export const INFO_PROVEEDOR_IA: Record<
  ProveedorIA,
  { etiqueta: string; baseUrl: string; modeloPorDefecto: string; modelos: string[]; ayuda: string }
> = {
  openai: {
    etiqueta: "ChatGPT (OpenAI)",
    baseUrl: "https://api.openai.com/v1",
    modeloPorDefecto: "gpt-4o-mini",
    modelos: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1"],
    ayuda: "Crea la clave en platform.openai.com → API keys. La cuenta debe tener créditos.",
  },
  anthropic: {
    etiqueta: "Claude (Anthropic)",
    baseUrl: "https://api.anthropic.com/v1",
    modeloPorDefecto: "claude-sonnet-5",
    modelos: ["claude-sonnet-5", "claude-haiku-4-5-20251001"],
    ayuda: "Crea la clave en console.anthropic.com → API keys.",
  },
  gemini: {
    etiqueta: "Gemini (Google)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    modeloPorDefecto: "gemini-2.5-flash",
    modelos: ["gemini-2.5-flash", "gemini-2.5-pro"],
    ayuda: "Crea la clave en aistudio.google.com → Get API key.",
  },
};

export function esProveedorIA(valor: unknown): valor is ProveedorIA {
  return typeof valor === "string" && (PROVEEDORES_IA as readonly string[]).includes(valor);
}

export type ConfiguracionIA = { proveedor: ProveedorIA; modelo: string; apiKey: string };

export type EtapaParaIA = { id: string; nombre: string; descripcion: string | null };

export type MensajeParaIA = {
  canal: CanalCrm;
  direccion: DireccionMensaje;
  contenido: string;
  fecha: string;
  asunto?: string | null;
};

export type EntradaAnalisis = {
  nombre: string;
  etapaActual: string;
  etapas: EtapaParaIA[];
  mensajes: MensajeParaIA[];
  proximaAccion?: string | null;
  notas?: string[];
};

/** Resultado del análisis tal como se guarda en `crm_casos.analisis`. */
export type AnalisisIA = {
  resumen: string;
  prioridad: Prioridad;
  etapaSugeridaId: string | null;
  etapaSugeridaNombre: string | null;
  proximaAccion: string;
  documentosPendientes: string[];
  datos: { nombre: string | null; documento: string | null; ciudad: string | null };
  analizadoAt: string;
  proveedor: ProveedorIA;
  modelo: string;
};

const MAX_MENSAJES = 60;
const MAX_CARACTERES_MENSAJE = 1500;

export function construirPromptAnalisis(entrada: EntradaAnalisis): {
  system: string;
  user: string;
} {
  const etapas = entrada.etapas
    .map((e) => `- "${e.nombre}"${e.descripcion ? `: ${e.descripcion}` : ""}`)
    .join("\n");

  const system = [
    "Eres el analista de un equipo de abogados de insolvencia de persona natural en Colombia (Insolvencia Efectiva).",
    "Lees la conversación entre el equipo (rol equipo) y una persona interesada (rol contacto) y devuelves SOLO un objeto JSON válido, sin texto adicional ni comillas de código.",
    "No inventes hechos: si algo no aparece en la conversación, déjalo en null o en una lista vacía.",
    "Formato exacto:",
    "{",
    '  "resumen": "2 o 3 frases: qué necesita la persona, sus deudas y su situación actual",',
    '  "prioridad": "alta" | "media" | "baja" (alta = urgente o muy interesada; baja = fría o sin respuesta),',
    '  "etapa_sugerida": "nombre exacto de una de las etapas del pipeline",',
    '  "proxima_accion": "UNA acción concreta para el equipo, en una frase",',
    '  "documentos_pendientes": ["documentos que la persona aún debe enviar, según la conversación"],',
    '  "datos": { "nombre": "nombre completo si lo dijo o null", "documento": "número de cédula si lo dio o null", "ciudad": "ciudad si la mencionó o null" }',
    "}",
    "Etapas del pipeline (elige la que mejor describa el estado del caso):",
    etapas,
  ].join("\n");

  const mensajes = entrada.mensajes.slice(-MAX_MENSAJES).map((m) => {
    const quien = m.direccion === "entrada" ? "contacto" : "equipo";
    const asunto = m.asunto ? ` [asunto: ${m.asunto}]` : "";
    const texto = m.contenido.replace(/\s+/g, " ").trim().slice(0, MAX_CARACTERES_MENSAJE);
    return `[${m.fecha}] (${m.canal}) ${quien}${asunto}: ${texto}`;
  });

  const user = [
    `Contacto: ${entrada.nombre}`,
    `Etapa actual: ${entrada.etapaActual}`,
    entrada.proximaAccion ? `Próxima acción registrada: ${entrada.proximaAccion}` : null,
    entrada.notas?.length
      ? `Notas internas del equipo:\n${entrada.notas.map((n) => `- ${n}`).join("\n")}`
      : null,
    "Conversación (de la más antigua a la más reciente):",
    mensajes.length > 0 ? mensajes.join("\n") : "(sin mensajes todavía)",
  ]
    .filter((linea): linea is string => linea !== null)
    .join("\n\n");

  return { system, user };
}

const respuestaSchema = z.object({
  resumen: z.string().trim().min(1).max(2000),
  prioridad: z.enum(PRIORIDADES).catch("media"),
  etapa_sugerida: z.string().trim().nullish(),
  proxima_accion: z.string().trim().max(500).catch(""),
  documentos_pendientes: z.array(z.string().trim().min(1).max(200)).max(20).catch([]),
  datos: z
    .object({
      nombre: z.string().trim().max(160).nullish(),
      documento: z.string().trim().max(40).nullish(),
      ciudad: z.string().trim().max(80).nullish(),
    })
    .catch({}),
});

function extraerJson(texto: string): string {
  const sinCercas = texto.replace(/```(?:json)?/gi, "").trim();
  const inicio = sinCercas.indexOf("{");
  const fin = sinCercas.lastIndexOf("}");
  return inicio >= 0 && fin > inicio ? sinCercas.slice(inicio, fin + 1) : sinCercas;
}

function normalizarNombre(valor: string): string {
  return valor.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Convierte la respuesta del modelo en un análisis; lanza si no es JSON utilizable. */
export function interpretarRespuestaAnalisis(
  texto: string,
  etapas: EtapaParaIA[],
  meta: { proveedor: ProveedorIA; modelo: string; ahora?: Date },
): AnalisisIA {
  let json: unknown;
  try {
    json = JSON.parse(extraerJson(texto));
  } catch {
    throw new Error("La IA no devolvió un JSON válido.");
  }
  const datos = respuestaSchema.safeParse(json);
  if (!datos.success) throw new Error("La respuesta de la IA no tiene el formato esperado.");

  const sugerida = datos.data.etapa_sugerida
    ? etapas.find(
        (e) => normalizarNombre(e.nombre) === normalizarNombre(datos.data.etapa_sugerida!),
      )
    : undefined;

  return {
    resumen: datos.data.resumen,
    prioridad: datos.data.prioridad,
    etapaSugeridaId: sugerida?.id ?? null,
    etapaSugeridaNombre: sugerida?.nombre ?? null,
    proximaAccion: datos.data.proxima_accion,
    documentosPendientes: datos.data.documentos_pendientes,
    datos: {
      nombre: datos.data.datos.nombre || null,
      documento: datos.data.datos.documento || null,
      ciudad: datos.data.datos.ciudad || null,
    },
    analizadoAt: (meta.ahora ?? new Date()).toISOString(),
    proveedor: meta.proveedor,
    modelo: meta.modelo,
  };
}

export type MensajeChat = { role: "system" | "user"; content: string };

/** Llama a `chat/completions` del proveedor y devuelve el texto de la respuesta. */
export async function completarChat(
  config: ConfiguracionIA,
  mensajes: MensajeChat[],
  opciones: { fetchImpl?: typeof fetch; maxTokens?: number; temperatura?: number } = {},
): Promise<string> {
  const proveedor = INFO_PROVEEDOR_IA[config.proveedor];
  const fetchImpl = opciones.fetchImpl ?? fetch;
  const maxTokens = opciones.maxTokens ?? 800;
  const cuerpo: Record<string, unknown> = {
    model: config.modelo,
    messages: mensajes,
    temperature: opciones.temperatura ?? 0.2,
    ...(config.proveedor === "openai"
      ? { max_completion_tokens: maxTokens }
      : { max_tokens: maxTokens }),
  };

  let respuesta: Response;
  try {
    respuesta = await fetchImpl(`${proveedor.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con ${proveedor.etiqueta}: ${error instanceof Error ? error.message : "error de red"}`,
    );
  }

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    const resumen = detalle.replace(/\s+/g, " ").slice(0, 300);
    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new Error(`${proveedor.etiqueta} rechazó la clave de API (${respuesta.status}).`);
    }
    if (respuesta.status === 404) {
      throw new Error(`${proveedor.etiqueta} no reconoce el modelo «${config.modelo}».`);
    }
    if (respuesta.status === 429) {
      throw new Error(`${proveedor.etiqueta}: límite de uso o sin créditos (429). ${resumen}`);
    }
    throw new Error(`${proveedor.etiqueta} respondió ${respuesta.status}. ${resumen}`);
  }

  const json = (await respuesta.json()) as {
    choices?: { message?: { content?: string | { text?: string }[] } }[];
  };
  const contenido = json.choices?.[0]?.message?.content;
  const texto =
    typeof contenido === "string"
      ? contenido
      : Array.isArray(contenido)
        ? contenido.map((parte) => parte.text ?? "").join("")
        : "";
  if (!texto.trim()) throw new Error(`${proveedor.etiqueta} devolvió una respuesta vacía.`);
  return texto;
}

export async function analizarCasoConIA(
  config: ConfiguracionIA,
  entrada: EntradaAnalisis,
  opciones: { fetchImpl?: typeof fetch; ahora?: Date } = {},
): Promise<AnalisisIA> {
  const { system, user } = construirPromptAnalisis(entrada);
  const texto = await completarChat(
    config,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { fetchImpl: opciones.fetchImpl },
  );
  return interpretarRespuestaAnalisis(texto, entrada.etapas, {
    proveedor: config.proveedor,
    modelo: config.modelo,
    ahora: opciones.ahora,
  });
}

/** Prueba mínima de conexión: pide una respuesta corta. */
export async function probarConexionIA(
  config: ConfiguracionIA,
  fetchImpl?: typeof fetch,
): Promise<string> {
  const texto = await completarChat(
    config,
    [{ role: "user", content: "Responde únicamente con la palabra OK." }],
    { fetchImpl, maxTokens: 20, temperatura: 0 },
  );
  return texto.trim().slice(0, 50);
}

/** Lee el análisis guardado en la base (jsonb) con tolerancia a datos viejos. */
export function leerAnalisisGuardado(valor: unknown): AnalisisIA | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Partial<AnalisisIA>;
  if (typeof v.resumen !== "string" || typeof v.analizadoAt !== "string") return null;
  return {
    resumen: v.resumen,
    prioridad: PRIORIDADES.includes(v.prioridad as Prioridad)
      ? (v.prioridad as Prioridad)
      : "media",
    etapaSugeridaId: typeof v.etapaSugeridaId === "string" ? v.etapaSugeridaId : null,
    etapaSugeridaNombre: typeof v.etapaSugeridaNombre === "string" ? v.etapaSugeridaNombre : null,
    proximaAccion: typeof v.proximaAccion === "string" ? v.proximaAccion : "",
    documentosPendientes: Array.isArray(v.documentosPendientes)
      ? v.documentosPendientes.filter((d): d is string => typeof d === "string")
      : [],
    datos: {
      nombre: typeof v.datos?.nombre === "string" ? v.datos.nombre : null,
      documento: typeof v.datos?.documento === "string" ? v.datos.documento : null,
      ciudad: typeof v.datos?.ciudad === "string" ? v.datos.ciudad : null,
    },
    analizadoAt: v.analizadoAt,
    proveedor: esProveedorIA(v.proveedor) ? v.proveedor : "openai",
    modelo: typeof v.modelo === "string" ? v.modelo : "",
  };
}
