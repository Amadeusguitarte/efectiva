import { describe, expect, it } from "vitest";

import {
  ANCHO_MENU_MAXIMO,
  ANCHO_MENU_MINIMO,
  ANCHO_MENU_POR_DEFECTO,
  PREFERENCIA_MENU_INICIAL,
  UMBRAL_MINIMIZAR,
  leerPreferenciaMenu,
  limitarAnchoMenu,
  preferenciaTrasArrastre,
  serializarPreferenciaMenu,
} from "./preferencias-menu";

describe("leerPreferenciaMenu", () => {
  it("usa el valor por defecto si no hay cookie", () => {
    expect(leerPreferenciaMenu(undefined)).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu("")).toEqual(PREFERENCIA_MENU_INICIAL);
  });

  it("lee los valores válidos", () => {
    expect(leerPreferenciaMenu("minimizado.300")).toEqual({ minimizado: true, ancho: 300 });
    expect(leerPreferenciaMenu("expandido.220")).toEqual({ minimizado: false, ancho: 220 });
  });

  it("limita el ancho a los extremos permitidos", () => {
    expect(leerPreferenciaMenu("expandido.10").ancho).toBe(ANCHO_MENU_MINIMO);
    expect(leerPreferenciaMenu("expandido.9999").ancho).toBe(ANCHO_MENU_MAXIMO);
  });

  it("acepta los tamaños de la versión anterior de la cookie", () => {
    expect(leerPreferenciaMenu("expandido.normal")).toEqual({ minimizado: false, ancho: 256 });
    expect(leerPreferenciaMenu("minimizado.amplio")).toEqual({ minimizado: true, ancho: 304 });
  });

  it("descarta las partes manipuladas o desconocidas", () => {
    expect(leerPreferenciaMenu("minimizado.gigante")).toEqual({
      minimizado: true,
      ancho: ANCHO_MENU_POR_DEFECTO,
    });
    expect(leerPreferenciaMenu("expandido.-50").ancho).toBe(ANCHO_MENU_POR_DEFECTO);
    expect(leerPreferenciaMenu("expandido.2e3").ancho).toBe(ANCHO_MENU_POR_DEFECTO);
    expect(leerPreferenciaMenu("true.300")).toEqual({ minimizado: false, ancho: 300 });
    expect(leerPreferenciaMenu("<script>")).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu("constructor.__proto__")).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu("expandido.toString")).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu(`minimizado.${"x".repeat(500)}`)).toEqual(PREFERENCIA_MENU_INICIAL);
  });

  it("serializa y vuelve a leer sin pérdidas", () => {
    for (const ancho of [ANCHO_MENU_MINIMO, 260, ANCHO_MENU_MAXIMO]) {
      for (const minimizado of [true, false]) {
        const preferencia = { minimizado, ancho };
        expect(leerPreferenciaMenu(serializarPreferenciaMenu(preferencia))).toEqual(preferencia);
      }
    }
  });
});

describe("arrastre de la pestaña del borde", () => {
  it("limita y redondea el ancho", () => {
    expect(limitarAnchoMenu(250.6)).toBe(251);
    expect(limitarAnchoMenu(Number.NaN)).toBe(ANCHO_MENU_POR_DEFECTO);
  });

  it("minimiza por debajo del umbral y conserva el último ancho", () => {
    const actual = { minimizado: false, ancho: 320 };
    expect(preferenciaTrasArrastre(actual, UMBRAL_MINIMIZAR - 1)).toEqual({
      minimizado: true,
      ancho: 320,
    });
  });

  it("expande al arrastrar desde minimizado y limita el ancho", () => {
    const minimizado = { minimizado: true, ancho: 320 };
    expect(preferenciaTrasArrastre(minimizado, UMBRAL_MINIMIZAR + 1)).toEqual({
      minimizado: false,
      ancho: ANCHO_MENU_MINIMO,
    });
    expect(preferenciaTrasArrastre(minimizado, 5000)).toEqual({
      minimizado: false,
      ancho: ANCHO_MENU_MAXIMO,
    });
  });
});
