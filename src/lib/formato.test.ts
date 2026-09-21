import { describe, expect, it } from "vitest";

import { yearsOfExperience, whatsappUrl } from "@/config/site";

import { formatearFecha, iniciales, numeroWhatsApp, primerNombre } from "./formato";

describe("formato", () => {
  it("usa la zona horaria de Colombia", () => {
    // 2026-01-01 03:00 UTC es todavía 31 de diciembre en Bogotá.
    expect(formatearFecha("2026-01-01T03:00:00Z")).toContain("31");
  });

  it("obtiene iniciales", () => {
    expect(iniciales("ana maría pérez")).toBe("AM");
    expect(iniciales("  Juan  ")).toBe("J");
    expect(iniciales("")).toBe("");
  });

  it("normaliza teléfonos para WhatsApp", () => {
    expect(numeroWhatsApp("319 542 0600")).toBe("573195420600");
    expect(numeroWhatsApp("+57 319-542-0600")).toBe("573195420600");
    expect(numeroWhatsApp("+1 (305) 555-0100")).toBe("13055550100");
  });

  it("obtiene el primer nombre", () => {
    expect(primerNombre("  María José Pérez")).toBe("María");
  });
});

describe("configuración del sitio", () => {
  it("calcula los años de experiencia", () => {
    expect(yearsOfExperience(new Date("2026-09-17"))).toBe(18);
  });

  it("codifica el mensaje de WhatsApp", () => {
    expect(whatsappUrl("Hola, ¿cómo están?")).toBe(
      "https://wa.me/573195420600?text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1n%3F",
    );
  });
});
