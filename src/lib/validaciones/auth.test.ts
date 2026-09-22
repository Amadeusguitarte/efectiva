import { describe, expect, it } from "vitest";

import { ingresoSchema, usuarioOCorreoSchema } from "./auth";

describe("usuarioOCorreoSchema", () => {
  it("convierte el usuario del equipo en su correo", () => {
    expect(usuarioOCorreoSchema.parse("  AdminInsolvencia ")).toBe(
      "admininsolvencia@insolvenciaefectiva.com",
    );
  });

  it("acepta un correo completo y lo normaliza", () => {
    expect(usuarioOCorreoSchema.parse(" Equipo@Dominio.com ")).toBe("equipo@dominio.com");
  });

  it("rechaza usuarios y correos inválidos", () => {
    for (const valor of [
      "",
      "a",
      "usuario con espacios",
      ".usuario",
      "usuario@",
      "@dominio.com",
      "usuario@dominio",
    ]) {
      expect(usuarioOCorreoSchema.safeParse(valor).success, valor).toBe(false);
    }
  });
});

describe("ingresoSchema", () => {
  it("exige la contraseña", () => {
    const resultado = ingresoSchema.safeParse({ usuario: "admininsolvencia", password: "" });
    expect(resultado.success).toBe(false);
  });

  it("entrega el correo listo para Supabase", () => {
    expect(ingresoSchema.parse({ usuario: "admininsolvencia", password: "secreta" })).toEqual({
      usuario: "admininsolvencia@insolvenciaefectiva.com",
      password: "secreta",
    });
  });
});
