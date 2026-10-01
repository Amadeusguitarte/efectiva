import { describe, expect, it } from "vitest";

import {
  PREFERENCIA_MENU_INICIAL,
  TAMANOS_MENU,
  leerPreferenciaMenu,
  serializarPreferenciaMenu,
} from "./preferencias-menu";

describe("leerPreferenciaMenu", () => {
  it("usa el valor por defecto si no hay cookie", () => {
    expect(leerPreferenciaMenu(undefined)).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu("")).toEqual(PREFERENCIA_MENU_INICIAL);
  });

  it("lee los valores válidos", () => {
    expect(leerPreferenciaMenu("minimizado.amplio")).toEqual({
      minimizado: true,
      tamano: "amplio",
    });
    expect(leerPreferenciaMenu("expandido.compacto")).toEqual({
      minimizado: false,
      tamano: "compacto",
    });
  });

  it("descarta las partes manipuladas o desconocidas", () => {
    expect(leerPreferenciaMenu("minimizado.gigante")).toEqual({
      minimizado: true,
      tamano: "normal",
    });
    expect(leerPreferenciaMenu("true.amplio")).toEqual({ minimizado: false, tamano: "amplio" });
    expect(leerPreferenciaMenu("<script>")).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu("constructor.__proto__")).toEqual(PREFERENCIA_MENU_INICIAL);
    expect(leerPreferenciaMenu(`minimizado.${"x".repeat(500)}`)).toEqual(PREFERENCIA_MENU_INICIAL);
  });

  it("serializa y vuelve a leer sin pérdidas", () => {
    for (const tamano of TAMANOS_MENU) {
      for (const minimizado of [true, false]) {
        const preferencia = { minimizado, tamano };
        expect(leerPreferenciaMenu(serializarPreferenciaMenu(preferencia))).toEqual(preferencia);
      }
    }
  });
});
