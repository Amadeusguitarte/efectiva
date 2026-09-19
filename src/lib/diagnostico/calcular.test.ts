import { describe, expect, it } from "vitest";

import {
  calcularDiagnostico,
  claveAcreedor,
  diagnosticoVacio,
  moraSegunDias,
  obligacionVacia,
  type DiagnosticoEntrada,
  type ObligacionEntrada,
} from "./calcular";
import { PARAMETROS_DIAGNOSTICO, tarifaCentroConciliacion } from "./parametros";

function obligacion(datos: Partial<ObligacionEntrada>): ObligacionEntrada {
  return { ...obligacionVacia(), ...datos };
}

function entrada(datos: Partial<DiagnosticoEntrada>): DiagnosticoEntrada {
  return { ...diagnosticoVacio(), ...datos };
}

/**
 * Caso de referencia tomado del Excel original (valores de la hoja "Diagnóstico Cliente" con
 * los resultados que Excel calculó). Nombres de acreedores reales; el cliente es ficticio.
 */
const casoExcel = entrada({
  ingresosMensuales: 2_800_000,
  gastosMensuales: 1_000_000,
  tipoServicio: "acuerdo_pago_bilateral",
  porcentajeHonorarios: 5,
  cuotasHonorarios: 6,
  requiereCentroConciliacion: true,
  descuentoCentroConciliacion: 500_000,
  obligaciones: [
    obligacion({
      acreedor: "Davivienda",
      concepto: "Crédito hipotecario",
      capital: 150_000_000,
      mora: "mas_90_dias",
      tipoGarantia: "hipoteca",
      clase: "tercera",
    }),
    obligacion({
      acreedor: "Banco Agrario",
      concepto: "Tarjeta de crédito",
      capital: 1_000_000,
      mora: "mas_90_dias",
    }),
    obligacion({ acreedor: "Tigo", concepto: "Celular", capital: 300_000, mora: "mas_90_dias" }),
    obligacion({ acreedor: "Claro", concepto: "Celular", capital: 300_000, mora: "mas_90_dias" }),
    obligacion({
      acreedor: "Deuda de administración",
      concepto: "Propiedad horizontal",
      capital: 20_000_000,
      mora: "mas_90_dias",
    }),
  ],
});

/** Caso de una propuesta real (cifras del PDF de ejemplo): 4 obligaciones, hipoteca al día. */
const casoPropuesta = entrada({
  tipoServicio: "acuerdo_pago_bilateral",
  porcentajeHonorarios: 5,
  cuotasHonorarios: 10,
  requiereCentroConciliacion: true,
  descuentoCentroConciliacion: 300_000,
  obligaciones: [
    obligacion({ acreedor: "Falabella", capital: 23_000_000, mora: "mas_90_dias" }),
    obligacion({ acreedor: "Alkosto", capital: 14_000_000, mora: "mas_90_dias" }),
    obligacion({ acreedor: "Davivienda", capital: 17_200_000, mora: "mas_90_dias" }),
    obligacion({
      acreedor: "FNA",
      capital: 59_000_000,
      mora: "al_dia",
      tipoGarantia: "hipoteca",
      clase: "tercera",
    }),
  ],
});

describe("calcularDiagnostico: caso de referencia del Excel", () => {
  const r = calcularDiagnostico(casoExcel);

  it("suma el pasivo y el porcentaje de cada deuda", () => {
    expect(r.pasivoTotal).toBe(171_600_000);
    expect(r.numeroObligaciones).toBe(5);
    expect(r.obligaciones[0]?.total).toBe(150_000_000);
    expect(r.obligaciones[0]?.porcentajePasivo).toBeCloseTo(0.8741, 4);
    expect(r.excedenteMensual).toBe(1_800_000);
  });

  it("calcula honorarios, cuota, centro de conciliación y costo del proceso", () => {
    expect(r.honorarios).toEqual({
      porcentaje: 5,
      valor: 8_580_000,
      cuotas: 6,
      valorCuota: 1_430_000,
    });
    expect(r.centroConciliacion).toEqual({
      obligatorio: true,
      aplica: true,
      tarifa: 2_200_000,
      descuento: 500_000,
      valor: 1_700_000,
    });
    expect(r.gastosProceso).toBe(372_000);
    expect(r.costoProceso).toBe(10_652_000);
  });

  it("declara al deudor elegible", () => {
    expect(r.elegibilidad).toEqual({
      estado: "elegible",
      obligacionesEnMora: 5,
      acreedoresEnMora: 5,
      pasivoEnMora: 171_600_000,
      porcentajeEnMora: 1,
      cumple: { obligaciones: true, acreedores: true, porcentaje: true },
    });
  });

  it("resume por clase", () => {
    expect(r.resumenPorClase.tercera).toEqual({
      cantidad: 1,
      total: 150_000_000,
      porcentajePasivo: 150_000_000 / 171_600_000,
    });
    expect(r.resumenPorClase.quinta.cantidad).toBe(4);
    expect(r.resumenPorClase.quinta.total).toBe(21_600_000);
    expect(r.resumenPorClase.primera).toEqual({ cantidad: 0, total: 0, porcentajePasivo: 0 });
  });

  it("no genera alertas", () => {
    expect(r.alertas).toEqual([]);
  });
});

describe("calcularDiagnostico: caso de una propuesta real", () => {
  const r = calcularDiagnostico(casoPropuesta);

  it("reproduce las cifras de la propuesta", () => {
    expect(r.pasivoTotal).toBe(113_200_000);
    expect(r.honorarios.valor).toBe(5_660_000);
    expect(r.honorarios.valorCuota).toBe(566_000);
    expect(r.centroConciliacion.tarifa).toBe(1_500_000);
    expect(r.centroConciliacion.valor).toBe(1_200_000);
    expect(r.costoProceso).toBe(7_232_000);
  });

  it("cuenta solo las obligaciones con más de 90 días de mora", () => {
    expect(r.elegibilidad.estado).toBe("elegible");
    expect(r.elegibilidad.obligacionesEnMora).toBe(3);
    expect(r.elegibilidad.acreedoresEnMora).toBe(3);
    expect(r.elegibilidad.porcentajeEnMora).toBeCloseTo(54_200_000 / 113_200_000, 6);
  });
});

describe("elegibilidad preliminar", () => {
  const enMora = (acreedor: string, capital: number) =>
    obligacion({ acreedor, capital, mora: "mas_90_dias" });

  it("sin obligaciones no hay datos", () => {
    const r = calcularDiagnostico(entrada({}));
    expect(r.elegibilidad.estado).toBe("sin_datos");
    expect(r.pasivoTotal).toBe(0);
    expect(r.alertas).toContainEqual(
      expect.objectContaining({ codigo: "sin_obligaciones", nivel: "error" }),
    );
  });

  it("exige al menos dos obligaciones en mora", () => {
    const r = calcularDiagnostico(
      entrada({
        obligaciones: [enMora("A", 1_000_000), obligacion({ acreedor: "B", capital: 500_000 })],
      }),
    );
    expect(r.elegibilidad.estado).toBe("no_elegible");
    expect(r.elegibilidad.cumple).toEqual({
      obligaciones: false,
      acreedores: false,
      porcentaje: true,
    });
  });

  it("exige dos acreedores distintos, ignorando mayúsculas, tildes y espacios", () => {
    const r = calcularDiagnostico(
      entrada({
        obligaciones: [enMora("Banco Ágil", 1_000_000), enMora("  banco agil ", 1_000_000)],
      }),
    );
    expect(r.elegibilidad.acreedoresEnMora).toBe(1);
    expect(r.elegibilidad.estado).toBe("no_elegible");
    expect(r.elegibilidad.cumple.acreedores).toBe(false);
  });

  it("acepta exactamente el 30 % del pasivo en mora", () => {
    const r = calcularDiagnostico(
      entrada({
        obligaciones: [
          enMora("A", 15_000_000),
          enMora("B", 15_000_000),
          obligacion({ acreedor: "C", capital: 70_000_000 }),
        ],
      }),
    );
    expect(r.elegibilidad.porcentajeEnMora).toBeCloseTo(0.3, 9);
    expect(r.elegibilidad.estado).toBe("elegible");
  });

  it("rechaza por debajo del 30 %", () => {
    const r = calcularDiagnostico(
      entrada({
        obligaciones: [
          enMora("A", 14_999_999),
          enMora("B", 15_000_000),
          obligacion({ acreedor: "C", capital: 70_000_001 }),
        ],
      }),
    );
    expect(r.elegibilidad.estado).toBe("no_elegible");
    expect(r.elegibilidad.cumple.porcentaje).toBe(false);
  });

  it("usa el total (capital más intereses) para el umbral", () => {
    const r = calcularDiagnostico(
      entrada({
        obligaciones: [
          obligacion({
            acreedor: "A",
            capital: 10_000_000,
            intereses: 5_000_000,
            mora: "mas_90_dias",
          }),
          obligacion({ acreedor: "B", capital: 15_000_000, mora: "mas_90_dias" }),
          obligacion({ acreedor: "C", capital: 70_000_000 }),
        ],
      }),
    );
    expect(r.elegibilidad.pasivoEnMora).toBe(30_000_000);
    expect(r.elegibilidad.estado).toBe("elegible");
  });
});

describe("honorarios y costo del proceso", () => {
  const base = { obligaciones: [obligacion({ acreedor: "A", capital: 100_000_000 })] };

  it("redondea honorarios y cuota al peso", () => {
    const r = calcularDiagnostico(
      entrada({
        ...base,
        porcentajeHonorarios: 7,
        cuotasHonorarios: 3,
        obligaciones: [obligacion({ acreedor: "A", capital: 100_000_001 })],
      }),
    );
    expect(r.honorarios.valor).toBe(7_000_000);
    expect(r.honorarios.valorCuota).toBe(2_333_333);
  });

  it("liquidación patrimonial sin centro no cobra centro de conciliación", () => {
    const r = calcularDiagnostico(
      entrada({
        ...base,
        tipoServicio: "liquidacion_patrimonial",
        requiereCentroConciliacion: false,
      }),
    );
    expect(r.centroConciliacion.obligatorio).toBe(false);
    expect(r.centroConciliacion.aplica).toBe(false);
    expect(r.centroConciliacion.tarifa).toBe(1_500_000);
    expect(r.costoProceso).toBe(5_000_000 + 372_000);
  });

  it("liquidación patrimonial con centro lo suma al costo", () => {
    const r = calcularDiagnostico(
      entrada({
        ...base,
        tipoServicio: "liquidacion_patrimonial",
        requiereCentroConciliacion: true,
      }),
    );
    expect(r.centroConciliacion.aplica).toBe(true);
    expect(r.costoProceso).toBe(5_000_000 + 372_000 + 1_500_000);
  });

  it("el acuerdo de pago siempre cobra el centro y avisa si no está marcado", () => {
    const r = calcularDiagnostico(
      entrada({ ...base, tipoServicio: "acuerdo_pago", requiereCentroConciliacion: false }),
    );
    expect(r.centroConciliacion).toMatchObject({ obligatorio: true, aplica: true });
    expect(r.costoProceso).toBe(5_000_000 + 372_000 + 1_500_000);
    expect(r.alertas[0]).toMatchObject({ codigo: "acuerdo_sin_centro", nivel: "error" });
  });

  it("sin tipo de servicio no cobra centro aunque esté marcado", () => {
    const r = calcularDiagnostico(entrada({ ...base, requiereCentroConciliacion: true }));
    expect(r.centroConciliacion.aplica).toBe(false);
    expect(r.alertas).toContainEqual(
      expect.objectContaining({ codigo: "sin_tipo_servicio", nivel: "error" }),
    );
  });

  it("no deja el centro en negativo cuando el descuento supera la tarifa", () => {
    const r = calcularDiagnostico(
      entrada({
        ...base,
        tipoServicio: "acuerdo_pago",
        requiereCentroConciliacion: true,
        descuentoCentroConciliacion: 2_000_000,
      }),
    );
    expect(r.centroConciliacion.valor).toBe(0);
    expect(r.alertas.map((a) => a.codigo)).toContain("descuento_supera_tarifa");
  });

  it("avisa cuando el pasivo supera el último rango de tarifas", () => {
    const r = calcularDiagnostico(
      entrada({
        tipoServicio: "acuerdo_pago",
        requiereCentroConciliacion: true,
        obligaciones: [obligacion({ acreedor: "A", capital: 1_200_000_000 })],
      }),
    );
    expect(r.centroConciliacion.tarifa).toBe(10_000_000);
    expect(r.alertas.map((a) => a.codigo)).toContain("pasivo_fuera_de_tarifas");
  });

  it("avisa si los honorarios son 0 %", () => {
    const r = calcularDiagnostico(entrada({ ...base, porcentajeHonorarios: 0 }));
    expect(r.honorarios.valor).toBe(0);
    expect(r.alertas.map((a) => a.codigo)).toContain("honorarios_cero");
  });

  it("permite cambiar los gastos del proceso por parámetros", () => {
    const parametros = {
      ...PARAMETROS_DIAGNOSTICO,
      gastosProceso: { fijos: 120_000, porObligacion: 12_000 },
    };
    const r = calcularDiagnostico(entrada(casoPropuesta), parametros);
    expect(r.gastosProceso).toBe(120_000 + 4 * 12_000);
  });
});

describe("alertas por obligación", () => {
  it("detecta valores en cero, clases incoherentes y pendientes de verificar", () => {
    const r = calcularDiagnostico(
      entrada({
        tipoServicio: "liquidacion_patrimonial",
        obligaciones: [
          obligacion({ acreedor: "Sin valor" }),
          obligacion({
            acreedor: "Hipoteca en quinta",
            capital: 1,
            tipoGarantia: "hipoteca",
            clase: "quinta",
          }),
          obligacion({
            acreedor: "Prenda en tercera",
            capital: 1,
            tipoGarantia: "garantia_mobiliaria",
            clase: "tercera",
          }),
          obligacion({ acreedor: "Sin garantía en segunda", capital: 1, clase: "segunda" }),
          obligacion({ acreedor: "Pendiente", capital: 1, clase: "por_verificar" }),
          obligacion({
            acreedor: "Hipoteca pendiente",
            capital: 1,
            tipoGarantia: "hipoteca",
            clase: "por_verificar",
          }),
          obligacion({
            acreedor: "Correcta",
            capital: 1,
            tipoGarantia: "hipoteca",
            clase: "tercera",
          }),
        ],
      }),
    );
    const porCodigo = (codigo: string) =>
      r.alertas.filter((a) => a.codigo === codigo).map((a) => a.obligacion);
    expect(porCodigo("obligacion_sin_valor")).toEqual([1]);
    expect(porCodigo("obligacion_garantia_clase")).toEqual([2, 3, 4]);
    expect(porCodigo("obligacion_por_verificar")).toEqual([5, 6]);
  });

  it("detecta días de mora que no coinciden con la categoría", () => {
    const r = calcularDiagnostico(
      entrada({
        tipoServicio: "liquidacion_patrimonial",
        obligaciones: [
          obligacion({ acreedor: "A", capital: 1, mora: "al_dia", diasMora: 120 }),
          obligacion({ acreedor: "B", capital: 1, mora: "mas_90_dias", diasMora: 91 }),
          obligacion({ acreedor: "C", capital: 1, mora: "menos_90_dias", diasMora: 90 }),
          obligacion({ acreedor: "D", capital: 1, mora: "al_dia", diasMora: null }),
        ],
      }),
    );
    expect(
      r.alertas.filter((a) => a.codigo === "obligacion_mora_dias").map((a) => a.obligacion),
    ).toEqual([1]);
  });

  it("ordena los errores antes que los avisos", () => {
    const r = calcularDiagnostico(
      entrada({
        tipoServicio: "acuerdo_pago",
        obligaciones: [obligacion({ acreedor: "A", clase: "por_verificar" })],
      }),
    );
    expect(r.alertas.map((a) => a.nivel)).toEqual(["error", "aviso", "aviso"]);
  });
});

describe("utilidades", () => {
  it("clasifica la mora según los días", () => {
    expect(moraSegunDias(0)).toBe("al_dia");
    expect(moraSegunDias(1)).toBe("menos_90_dias");
    expect(moraSegunDias(90)).toBe("menos_90_dias");
    expect(moraSegunDias(91)).toBe("mas_90_dias");
  });

  it("normaliza acreedores", () => {
    expect(claveAcreedor("  Banco  DAVIVIENDA ")).toBe("banco davivienda");
    expect(claveAcreedor("Éxito")).toBe("exito");
  });

  it("busca la tarifa del centro por rangos", () => {
    expect(tarifaCentroConciliacion(0)).toEqual({ valor: 1_000_000, fueraDeRango: false });
    expect(tarifaCentroConciliacion(69_999_999).valor).toBe(1_000_000);
    expect(tarifaCentroConciliacion(70_000_000).valor).toBe(1_500_000);
    expect(tarifaCentroConciliacion(171_600_000).valor).toBe(2_200_000);
    expect(tarifaCentroConciliacion(999_999_999)).toEqual({
      valor: 10_000_000,
      fueraDeRango: false,
    });
    expect(tarifaCentroConciliacion(1_000_000_000)).toEqual({
      valor: 10_000_000,
      fueraDeRango: true,
    });
    expect(tarifaCentroConciliacion(-1)).toEqual({ valor: 0, fueraDeRango: false });
  });
});
