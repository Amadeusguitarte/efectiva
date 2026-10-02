import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { HOJAS_DIAGNOSTICO, INFO_HOJA, rutaHoja } from "./hojas";

const ID = "cd57b60a-a3e7-43a6-891b-01c10f9c6248";

describe("HOJAS_DIAGNOSTICO", () => {
  it("sigue el orden de las hojas del Excel", () => {
    expect(HOJAS_DIAGNOSTICO.map((h) => h.valor)).toEqual([
      "diagnostico",
      "datos-propuesta",
      "listas",
    ]);
  });

  it("no repite valores ni segmentos", () => {
    const valores = HOJAS_DIAGNOSTICO.map((h) => h.valor);
    const segmentos = HOJAS_DIAGNOSTICO.map((h) => h.segmento);
    expect(new Set(valores).size).toBe(valores.length);
    expect(new Set(segmentos).size).toBe(segmentos.length);
  });

  it("indexa cada hoja por su valor", () => {
    for (const hoja of HOJAS_DIAGNOSTICO) expect(INFO_HOJA[hoja.valor]).toBe(hoja);
  });

  it("tiene una página por hoja en el panel", () => {
    for (const { segmento } of HOJAS_DIAGNOSTICO) {
      const carpeta = ["admin", "clientes", "[id]", "diagnostico", segmento].filter(Boolean);
      const pagina = new URL(`../../app/${carpeta.join("/")}/page.tsx`, import.meta.url);
      expect(existsSync(fileURLToPath(pagina)), `falta ${carpeta.join("/")}/page.tsx`).toBe(true);
    }
  });
});

describe("rutaHoja", () => {
  it("lleva la matriz a la raíz del diagnóstico", () => {
    expect(rutaHoja(ID, "diagnostico")).toBe(`/admin/clientes/${ID}/diagnostico`);
  });

  it("lleva cada hoja a su segmento", () => {
    expect(rutaHoja(ID, "datos-propuesta")).toBe(
      `/admin/clientes/${ID}/diagnostico/datos-propuesta`,
    );
    expect(rutaHoja(ID, "listas")).toBe(`/admin/clientes/${ID}/diagnostico/listas`);
  });

  it("codifica el id para no salirse de la ruta", () => {
    expect(rutaHoja("../x?y", "listas")).toBe("/admin/clientes/..%2Fx%3Fy/diagnostico/listas");
  });
});
