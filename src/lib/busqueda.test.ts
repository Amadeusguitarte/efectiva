import { describe, expect, it } from "vitest";

import { filtroBusqueda, soloCaracteresIgnorados, textoBusqueda } from "./busqueda";

describe("textoBusqueda", () => {
  it("quita los caracteres con significado en el filtro de PostgREST", () => {
    expect(textoBusqueda(' ana,(pérez)*%"\\ ')).toBe("ana  pérez");
  });

  it("limita la longitud", () => {
    expect(textoBusqueda("a".repeat(120))).toHaveLength(80);
  });
});

describe("soloCaracteresIgnorados", () => {
  it("detecta un texto que queda vacío al limpiarlo", () => {
    for (const valor of [",,,", "((()))", ")", "*", '"', "%", "\\", " , ( "]) {
      expect(soloCaracteresIgnorados(valor)).toBe(true);
    }
  });

  it("no aplica sin texto o si queda algo que buscar", () => {
    expect(soloCaracteresIgnorados("")).toBe(false);
    expect(soloCaracteresIgnorados("   ")).toBe(false);
    expect(soloCaracteresIgnorados("ju(an")).toBe(false);
    expect(soloCaracteresIgnorados("_")).toBe(false);
  });
});

describe("filtroBusqueda", () => {
  it("busca el texto en cada columna", () => {
    expect(filtroBusqueda(["nombre_completo", "email"], " juan ")).toBe(
      'nombre_completo.ilike."*juan*",email.ilike."*juan*"',
    );
  });

  it("busca el guion bajo literal, no como comodín de un carácter", () => {
    // `\\_` en el valor de PostgREST llega a ILIKE como `\_`.
    expect(filtroBusqueda(["email"], "juan_perez")).toBe(String.raw`email.ilike."*juan\\_perez*"`);
    expect(filtroBusqueda(["email"], "__")).toBe(String.raw`email.ilike."*\\_\\_*"`);
  });

  it("no deja pasar barras invertidas del usuario junto al escape", () => {
    expect(filtroBusqueda(["email"], "\\_")).toBe(String.raw`email.ilike."*\\_*"`);
  });

  it("devuelve null si no queda texto", () => {
    expect(filtroBusqueda(["email"], "  ,() ")).toBeNull();
    expect(filtroBusqueda(["email"], "")).toBeNull();
  });
});
