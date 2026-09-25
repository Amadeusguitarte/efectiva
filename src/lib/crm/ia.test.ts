import { describe, expect, it } from "vitest";

import {
  analizarCasoConIA,
  construirPromptAnalisis,
  interpretarRespuestaAnalisis,
  leerAnalisisGuardado,
  probarConexionIA,
  type EntradaAnalisis,
} from "./ia";

const etapas = [
  { id: "e1", nombre: "Nuevo", descripcion: "Acaba de escribir" },
  { id: "e2", nombre: "Documentos solicitados", descripcion: null },
  { id: "e3", nombre: "En diagnóstico", descripcion: null },
];

const entrada: EntradaAnalisis = {
  nombre: "Carlos Ramírez",
  etapaActual: "Nuevo",
  etapas,
  mensajes: [
    {
      canal: "whatsapp",
      direccion: "entrada",
      contenido: "Hola, tengo deudas con   tres bancos y me van a embargar",
      fecha: "2026-09-24 10:00",
    },
    {
      canal: "whatsapp",
      direccion: "salida",
      contenido: "Hola Carlos, ¿nos puedes enviar tus extractos?",
      fecha: "2026-09-24 10:05",
    },
  ],
  proximaAccion: "Llamarlo el jueves",
  notas: ["Vive en Bogotá"],
};

function respuestaFalsa(cuerpo: unknown, status = 200) {
  return async () =>
    new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

describe("prompt de análisis", () => {
  it("incluye etapas, contexto y conversación con roles claros", () => {
    const { system, user } = construirPromptAnalisis(entrada);
    expect(system).toContain('- "Nuevo": Acaba de escribir');
    expect(system).toContain('- "Documentos solicitados"');
    expect(system).toContain("SOLO un objeto JSON");
    expect(user).toContain("Contacto: Carlos Ramírez");
    expect(user).toContain("Próxima acción registrada: Llamarlo el jueves");
    expect(user).toContain("- Vive en Bogotá");
    expect(user).toContain("(whatsapp) contacto: Hola, tengo deudas con tres bancos");
    expect(user).toContain("(whatsapp) equipo: Hola Carlos");
  });
});

describe("interpretación de la respuesta", () => {
  const meta = {
    proveedor: "openai" as const,
    modelo: "gpt-4o-mini",
    ahora: new Date("2026-09-25T12:00:00Z"),
  };

  it("acepta JSON con cercas de código y resuelve la etapa por nombre sin tildes", () => {
    const texto =
      '```json\n{"resumen":"Tiene tres deudas.","prioridad":"alta","etapa_sugerida":"en diagnostico","proxima_accion":"Pedir extractos","documentos_pendientes":["Extractos"],"datos":{"nombre":"Carlos Ramírez","documento":null,"ciudad":"Bogotá"}}\n```';
    const analisis = interpretarRespuestaAnalisis(texto, etapas, meta);
    expect(analisis).toEqual({
      resumen: "Tiene tres deudas.",
      prioridad: "alta",
      etapaSugeridaId: "e3",
      etapaSugeridaNombre: "En diagnóstico",
      proximaAccion: "Pedir extractos",
      documentosPendientes: ["Extractos"],
      datos: { nombre: "Carlos Ramírez", documento: null, ciudad: "Bogotá" },
      analizadoAt: "2026-09-25T12:00:00.000Z",
      proveedor: "openai",
      modelo: "gpt-4o-mini",
    });
  });

  it("tolera campos faltantes o inválidos y etapas desconocidas", () => {
    const analisis = interpretarRespuestaAnalisis(
      '{"resumen":"Sin datos","prioridad":"urgente","etapa_sugerida":"Ganado"}',
      etapas,
      meta,
    );
    expect(analisis.prioridad).toBe("media");
    expect(analisis.etapaSugeridaId).toBeNull();
    expect(analisis.documentosPendientes).toEqual([]);
    expect(analisis.datos).toEqual({ nombre: null, documento: null, ciudad: null });
  });

  it("falla si no hay JSON o falta el resumen", () => {
    expect(() => interpretarRespuestaAnalisis("no puedo", etapas, meta)).toThrow(/JSON/);
    expect(() => interpretarRespuestaAnalisis('{"prioridad":"alta"}', etapas, meta)).toThrow(
      /formato/,
    );
  });

  it("lee análisis guardados con tolerancia", () => {
    expect(leerAnalisisGuardado(null)).toBeNull();
    expect(leerAnalisisGuardado({ resumen: "x" })).toBeNull();
    const leido = leerAnalisisGuardado({
      resumen: "x",
      analizadoAt: "2026-09-25T12:00:00.000Z",
      prioridad: "rara",
      documentosPendientes: ["a", 3],
    });
    expect(leido?.prioridad).toBe("media");
    expect(leido?.documentosPendientes).toEqual(["a"]);
  });
});

describe("llamada al proveedor", () => {
  const config = { proveedor: "gemini" as const, modelo: "gemini-2.5-flash", apiKey: "clave" };

  it("envía el prompt con la cabecera de autorización y devuelve el análisis", async () => {
    let peticion: { url: string; init?: RequestInit } | null = null;
    const fetchImpl: typeof fetch = async (url, init) => {
      peticion = { url: String(url), init };
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  '{"resumen":"Interesado.","prioridad":"media","etapa_sugerida":"Nuevo","proxima_accion":"Llamar","documentos_pendientes":[],"datos":{}}',
              },
            },
          ],
        }),
        { status: 200 },
      );
    };
    const analisis = await analizarCasoConIA(config, entrada, { fetchImpl });
    expect(analisis.etapaSugeridaId).toBe("e1");
    expect(peticion!.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    );
    const cabeceras = peticion!.init?.headers as Record<string, string>;
    expect(cabeceras.Authorization).toBe("Bearer clave");
    const cuerpo = JSON.parse(String(peticion!.init?.body)) as {
      model: string;
      max_tokens: number;
    };
    expect(cuerpo.model).toBe("gemini-2.5-flash");
    expect(cuerpo.max_tokens).toBe(800);
  });

  it("usa max_completion_tokens con OpenAI", async () => {
    let cuerpo: Record<string, unknown> = {};
    const fetchImpl: typeof fetch = async (_url, init) => {
      cuerpo = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ choices: [{ message: { content: "OK" } }] }));
    };
    expect(await probarConexionIA({ ...config, proveedor: "openai" }, fetchImpl)).toBe("OK");
    expect(cuerpo.max_completion_tokens).toBe(20);
    expect(cuerpo.max_tokens).toBeUndefined();
  });

  it("explica los errores habituales", async () => {
    await expect(
      probarConexionIA(config, respuestaFalsa({ error: "bad key" }, 401)),
    ).rejects.toThrow(/rechazó la clave/);
    await expect(probarConexionIA(config, respuestaFalsa("", 404))).rejects.toThrow(/modelo/);
    await expect(probarConexionIA(config, respuestaFalsa("", 429))).rejects.toThrow(/429/);
    await expect(
      probarConexionIA(config, respuestaFalsa({ choices: [{ message: { content: "" } }] })),
    ).rejects.toThrow(/vacía/);
    await expect(
      probarConexionIA(config, async () => {
        throw new Error("ECONNREFUSED");
      }),
    ).rejects.toThrow(/No se pudo conectar/);
  });
});
