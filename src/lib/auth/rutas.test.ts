import { describe, expect, it } from "vitest";

import { destinoTrasIngreso, rutaInicioPorRol, rutaSegura } from "./rutas";

describe("rutaSegura", () => {
  it("acepta rutas internas", () => {
    expect(rutaSegura("/portal")).toBe("/portal");
    expect(rutaSegura("/admin/clientes?estado=pendiente")).toBe("/admin/clientes?estado=pendiente");
  });

  it("rechaza destinos externos o mal formados", () => {
    for (const valor of [
      "https://evil.com",
      "//evil.com",
      String.raw`/\evil.com`,
      "evil.com",
      "",
      "javascript:alert(1)",
      null,
      undefined,
    ]) {
      expect(rutaSegura(valor)).toBeNull();
    }
  });
});

describe("destinoTrasIngreso", () => {
  it("envía a cada rol a su inicio", () => {
    expect(rutaInicioPorRol("admin")).toBe("/admin");
    expect(destinoTrasIngreso("cliente", null)).toBe("/portal");
  });

  it("respeta la ruta solicitada si corresponde al rol", () => {
    expect(destinoTrasIngreso("admin", "/admin/clientes")).toBe("/admin/clientes");
    expect(destinoTrasIngreso("cliente", "/portal")).toBe("/portal");
  });

  it("no envía a un rol al área del otro", () => {
    expect(destinoTrasIngreso("cliente", "/admin")).toBe("/portal");
    expect(destinoTrasIngreso("admin", "/portal")).toBe("/admin");
  });
});
