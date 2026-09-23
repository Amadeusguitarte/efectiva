import { describe, expect, it } from "vitest";

import { redaccionSchema } from "./redaccion";

const base = {
  tratamiento: "senora",
  situacion_economica: "  Texto.  ",
  situacion_legal: "",
  recomendacion: "   ",
  honorarios: "Otro.",
};

describe("redaccionSchema", () => {
  it("recorta los textos y convierte los vacíos en null", () => {
    expect(redaccionSchema.parse(base)).toEqual({
      tratamiento: "senora",
      situacion_economica: "Texto.",
      situacion_legal: null,
      recomendacion: null,
      honorarios: "Otro.",
    });
  });

  it("rechaza tratamientos desconocidos y textos demasiado largos", () => {
    expect(redaccionSchema.safeParse({ ...base, tratamiento: "doctor" }).success).toBe(false);
    const largo = redaccionSchema.safeParse({ ...base, honorarios: "a".repeat(8001) });
    expect(largo.success).toBe(false);
    expect(largo.error?.issues[0]?.path).toEqual(["honorarios"]);
  });
});
