import { describe, expect, it } from "vitest";

import { diagnosticoVacio, obligacionVacia } from "@/lib/diagnostico/calcular";
import { erroresPorRuta } from "@/lib/acciones";

import { diagnosticoSchema } from "./diagnostico";

describe("diagnosticoSchema", () => {
  it("acepta un diagnóstico vacío y normaliza textos", () => {
    const resultado = diagnosticoSchema.safeParse({
      ...diagnosticoVacio(),
      ocupacion: "  Docente  ",
      bienes: "   ",
      obligaciones: [{ ...obligacionVacia(), acreedor: " Banco ", concepto: "" }],
    });
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.ocupacion).toBe("Docente");
    expect(resultado.data.bienes).toBeNull();
    expect(resultado.data.obligaciones[0]).toMatchObject({ acreedor: "Banco", concepto: null });
  });

  it("señala el campo exacto de cada obligación con error", () => {
    const resultado = diagnosticoSchema.safeParse({
      ...diagnosticoVacio(),
      cuotasHonorarios: 0,
      obligaciones: [
        { ...obligacionVacia(), acreedor: "Ok", capital: 1 },
        { ...obligacionVacia(), acreedor: "", capital: -5, diasMora: 1.5 },
      ],
    });
    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    const estado = erroresPorRuta(resultado.error);
    expect(estado.ok).toBe(false);
    expect(Object.keys(estado.errores ?? {}).sort()).toEqual([
      "cuotasHonorarios",
      "obligaciones.1.acreedor",
      "obligaciones.1.capital",
      "obligaciones.1.diasMora",
    ]);
    expect(estado.errores?.["obligaciones.1.capital"]).toEqual(["No puede ser negativo."]);
  });

  it("rechaza valores fuera de catálogo o tipos incorrectos", () => {
    const resultado = diagnosticoSchema.safeParse({
      ...diagnosticoVacio(),
      tipoServicio: "otro",
      porcentajeHonorarios: "5",
      obligaciones: [{ ...obligacionVacia(), acreedor: "X", clase: "sexta" }],
    });
    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    const rutas = resultado.error.issues.map((i) => i.path.join("."));
    expect(rutas).toEqual(
      expect.arrayContaining(["tipoServicio", "porcentajeHonorarios", "obligaciones.0.clase"]),
    );
  });
});
