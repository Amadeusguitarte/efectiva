import { describe, expect, it } from "vitest";

import { normalizarUrlSitio } from "./url-sitio";

describe("normalizarUrlSitio", () => {
  it("añade https cuando falta el esquema", () => {
    expect(normalizarUrlSitio("efectiva-production.up.railway.app")).toBe(
      "https://efectiva-production.up.railway.app",
    );
  });

  it("respeta el esquema existente y quita barras finales", () => {
    expect(normalizarUrlSitio("http://localhost:3000/")).toBe("http://localhost:3000");
    expect(normalizarUrlSitio("  https://insolvenciaefectiva.com// ")).toBe(
      "https://insolvenciaefectiva.com",
    );
  });

  it("devuelve undefined si está vacía", () => {
    expect(normalizarUrlSitio(undefined)).toBeUndefined();
    expect(normalizarUrlSitio("   ")).toBeUndefined();
  });
});
