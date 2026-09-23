import { writeFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { calcularDiagnostico, diagnosticoVacio, obligacionVacia } from "@/lib/diagnostico/calcular";
import { construirDatosPropuesta } from "@/lib/diagnostico/propuesta";

import { construirContenidoPropuesta } from "../contenido";
import { renderizarPropuestaPdf } from "./documento";

// Caso de la propuesta de ejemplo del equipo.
const entrada = {
  ...diagnosticoVacio(),
  ocupacion: "contratista para Codensa",
  ingresosMensuales: 2_100_000,
  gastosMensuales: 12_000_000,
  bienes: "Apartamento actualmente hipotecado, sobre el cual además registra patrimonio de familia",
  tipoServicio: "acuerdo_pago_bilateral" as const,
  cuotasHonorarios: 10,
  requiereCentroConciliacion: true,
  descuentoCentroConciliacion: 300_000,
  situacionUrgencia:
    "Falabella le informó que su obligación está en proceso jurídico; no le han notificado medidas cautelares",
  objetivoCliente: "Conservar su apartamento.",
  obligaciones: [
    {
      ...obligacionVacia(),
      acreedor: "Falabella",
      concepto: "Tarjeta de crédito",
      capital: 23_000_000,
      mora: "mas_90_dias" as const,
    },
    {
      ...obligacionVacia(),
      acreedor: "Alkosto",
      concepto: "Tarjeta de crédito",
      capital: 14_000_000,
      mora: "mas_90_dias" as const,
    },
    {
      ...obligacionVacia(),
      acreedor: "Davivienda",
      concepto: "Compra de cartera",
      capital: 17_200_000,
      mora: "mas_90_dias" as const,
    },
    {
      ...obligacionVacia(),
      acreedor: "FNA",
      concepto: "Hipoteca",
      capital: 59_000_000,
      tipoGarantia: "hipoteca" as const,
      clase: "tercera" as const,
    },
  ],
};

describe("renderizarPropuestaPdf", () => {
  it("genera un PDF válido de varias páginas", async () => {
    const datos = construirDatosPropuesta(
      "José Joaquín Ruiz Rojas",
      entrada,
      calcularDiagnostico(entrada),
    );
    const contenido = construirContenidoPropuesta(
      datos,
      undefined,
      new Date("2026-09-11T12:00:00-05:00"),
    );
    const pdf = await renderizarPropuestaPdf(contenido);

    // Con PDF_SALIDA=<ruta> se guarda el archivo para revisarlo a ojo.
    if (process.env.PDF_SALIDA) await writeFile(process.env.PDF_SALIDA, pdf);

    const texto = Buffer.from(pdf).toString("latin1");
    expect(texto.startsWith("%PDF-")).toBe(true);
    const paginas = texto.match(/\/Type \/Page\b/g) ?? [];
    expect(paginas.length).toBeGreaterThanOrEqual(2);
    expect(pdf.byteLength).toBeGreaterThan(10_000);
  }, 30_000);
});
