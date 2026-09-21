import { describe, expect, it } from "vitest";

import { calcularDiagnostico, diagnosticoVacio, obligacionVacia } from "./calcular";
import { construirDatosPropuesta, datosPropuestaComoTexto } from "./propuesta";

const entrada = {
  ...diagnosticoVacio(),
  ocupacion: "Contratista",
  ingresosMensuales: 2_100_000,
  gastosMensuales: 12_000_000,
  bienes: "Apartamento hipotecado con patrimonio de familia",
  estadoCivil: "casado" as const,
  tipoServicio: "acuerdo_pago_bilateral" as const,
  porcentajeHonorarios: 5,
  cuotasHonorarios: 10,
  requiereCentroConciliacion: true,
  descuentoCentroConciliacion: 300_000,
  objetivoCliente: "Conservar su apartamento",
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
      acreedor: " FNA ",
      concepto: "Hipoteca",
      capital: 59_000_000,
      tipoGarantia: "hipoteca" as const,
      clase: "tercera" as const,
    },
    { ...obligacionVacia(), acreedor: "   ", capital: 5 },
  ],
};

describe("datos para la propuesta", () => {
  const datos = construirDatosPropuesta("Cliente de Prueba", entrada, calcularDiagnostico(entrada));

  it("usa las etiquetas que espera el prompt y omite filas sin acreedor", () => {
    expect(datos.acreencias).toEqual([
      {
        clase: "QUINTA",
        acreedor: "Falabella",
        concepto: "Tarjeta de crédito",
        valorAdeudado: 23_000_000,
        tipoGarantia: "Sin garantía",
        mora: "> 90 días",
      },
      {
        clase: "TERCERA",
        acreedor: "FNA",
        concepto: "Hipoteca",
        valorAdeudado: 59_000_000,
        tipoGarantia: "Hipoteca",
        mora: "Al día",
      },
    ]);
    expect(datos.pasivoTotal).toBe(82_000_005);
    expect(datos.elegibilidad).toEqual({ estado: "no_elegible", etiqueta: "NO ELEGIBLE" });
    expect(datos.cliente.estadoCivil).toBe("Casado/a");
    expect(datos.contrato).toEqual({
      tipoServicio: "Acuerdo de Pago Bilateral",
      porcentajeHonorarios: 5,
      valorHonorarios: 4_100_000,
      costoProceso: 4_100_000 + 372_000 + 1_200_000,
      cuotasHonorarios: 10,
      valorCuota: 410_000,
      requiereCentroConciliacion: true,
      valorCentroConciliacion: 1_200_000,
    });
    expect(datos.listaParaPropuesta).toBe(true);
  });

  it("marca la propuesta como no lista cuando hay errores", () => {
    const conError = {
      ...entrada,
      tipoServicio: "acuerdo_pago" as const,
      requiereCentroConciliacion: false,
    };
    const datos = construirDatosPropuesta("X", conError, calcularDiagnostico(conError));
    expect(datos.listaParaPropuesta).toBe(false);
  });

  it("no incluye el valor del centro cuando no aplica", () => {
    const sinCentro = {
      ...entrada,
      tipoServicio: "liquidacion_patrimonial" as const,
      requiereCentroConciliacion: false,
    };
    const datos = construirDatosPropuesta("X", sinCentro, calcularDiagnostico(sinCentro));
    expect(datos.contrato.requiereCentroConciliacion).toBe(false);
    expect(datos.contrato.valorCentroConciliacion).toBe(0);
    expect(datosPropuestaComoTexto(datos)).not.toContain("Valor del centro");
  });

  it("encabeza el texto con la exigencia de revisión cuando hay errores", () => {
    const conError = {
      ...entrada,
      tipoServicio: "acuerdo_pago" as const,
      requiereCentroConciliacion: false,
    };
    const texto = datosPropuestaComoTexto(
      construirDatosPropuesta("X", conError, calcularDiagnostico(conError)),
    );
    expect(texto.startsWith("REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA")).toBe(true);
    expect(texto).toContain("- El acuerdo de pago requiere centro de conciliación");
    expect(datosPropuestaComoTexto(datos).startsWith("DATOS PROPUESTA")).toBe(true);
  });

  it("genera el texto plano con la misma estructura del PDF", () => {
    const texto = datosPropuestaComoTexto(datos);
    expect(texto).toContain("Nombre: Cliente de Prueba");
    expect(texto).toContain(
      "QUINTA | Falabella | Tarjeta de crédito | $23.000.000 | Sin garantía | > 90 días",
    );
    expect(texto).toContain("Pasivo total: $82.000.005");
    expect(texto).toContain("% Honorarios: 5 %");
    expect(texto).toContain("Requiere centro de conciliación: SI");
    expect(texto).toContain("Valor del centro de conciliación: $1.200.000");
    expect(texto).toContain("Gastos mensuales aproximados: $12.000.000");
  });
});
