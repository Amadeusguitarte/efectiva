import { describe, expect, it } from "vitest";

import { formatearTelefono, jidDeTelefono, normalizarTelefono, telefonoDeJid } from "./telefono";

describe("teléfonos del CRM", () => {
  it("normaliza celulares colombianos y respeta otros indicativos", () => {
    expect(normalizarTelefono("300 123 4567")).toBe("573001234567");
    expect(normalizarTelefono("+57 (300) 123-4567")).toBe("573001234567");
    expect(normalizarTelefono("+1 415 555 0100")).toBe("14155550100");
    expect(normalizarTelefono("601 234 5678")).toBe("6012345678");
    expect(normalizarTelefono("12")).toBeNull();
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono(null)).toBeNull();
  });

  it("formatea para mostrar", () => {
    expect(formatearTelefono("573001234567")).toBe("+57 300 123 4567");
    expect(formatearTelefono("14155550100")).toBe("+141 555 501 00");
    expect(formatearTelefono(null)).toBe("");
  });

  it("convierte entre teléfono y JID de WhatsApp", () => {
    expect(jidDeTelefono("573001234567")).toBe("573001234567@s.whatsapp.net");
    expect(telefonoDeJid("573001234567@s.whatsapp.net")).toBe("573001234567");
    expect(telefonoDeJid("573001234567:12@s.whatsapp.net")).toBe("573001234567");
    expect(telefonoDeJid("120363012345678901@g.us")).toBeNull();
    expect(telefonoDeJid("123456@lid")).toBeNull();
    expect(telefonoDeJid(null)).toBeNull();
  });
});
