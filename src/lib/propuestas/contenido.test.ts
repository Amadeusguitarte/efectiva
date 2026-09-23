import { describe, expect, it } from "vitest";

import {
  calcularDiagnostico,
  diagnosticoVacio,
  obligacionVacia,
  type DiagnosticoEntrada,
} from "@/lib/diagnostico/calcular";
import { construirDatosPropuesta } from "@/lib/diagnostico/propuesta";

import {
  construirContenidoPropuesta,
  esTextoSugerido,
  nombreArchivoPropuesta,
  nombrePropio,
  parrafos,
  redactarBorrador,
} from "./contenido";
import { PARRAFO_FIJO_RECOMENDACION } from "./textos-fijos";

// Caso de la propuesta de ejemplo que entregó el equipo (pasivo 113.200.000).
const entradaEjemplo = {
  ...diagnosticoVacio(),
  ocupacion: "contratista para Codensa",
  ingresosMensuales: 2_100_000,
  gastosMensuales: 12_000_000,
  bienes: "Apartamento actualmente hipotecado, sobre el cual además registra patrimonio de familia",
  tipoServicio: "acuerdo_pago_bilateral" as const,
  porcentajeHonorarios: 5,
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

function datosDe(entrada: DiagnosticoEntrada, nombre = "JOSE JOAQUIN RUIZ ROJAS") {
  return construirDatosPropuesta(nombre, entrada, calcularDiagnostico(entrada));
}

const fechaEjemplo = new Date("2026-09-11T12:00:00-05:00");

describe("utilidades", () => {
  it("pone el nombre en mayúscula inicial respetando partículas", () => {
    expect(nombrePropio("JOSE JOAQUIN RUIZ ROJAS")).toBe("Jose Joaquin Ruiz Rojas");
    expect(nombrePropio("maría de los ángeles pérez")).toBe("María de los Ángeles Pérez");
  });

  it("separa párrafos por líneas en blanco y une saltos simples", () => {
    expect(parrafos("Uno\nsigue.\n\n\nDos.\n")).toEqual(["Uno sigue.", "Dos."]);
    expect(parrafos(null)).toEqual([]);
  });

  it("genera un nombre de archivo solo ASCII", () => {
    expect(nombreArchivoPropuesta("José Joaquín Ruiz Rojas")).toBe(
      "Propuesta-Jose-Joaquin-Ruiz-Rojas.pdf",
    );
    expect(nombreArchivoPropuesta("   ")).toBe("Propuesta-cliente.pdf");
  });

  it("reconoce cuándo un texto sigue siendo el sugerido", () => {
    expect(esTextoSugerido(null, "Hola.")).toBe(true);
    expect(esTextoSugerido("  Hola. ", "Hola.")).toBe(true);
    expect(esTextoSugerido("Adiós.", "Hola.")).toBe(false);
  });
});

describe("borrador automático (caso de ejemplo)", () => {
  const datos = datosDe(entradaEjemplo);
  const borrador = redactarBorrador(datos);

  it("redacta la situación económica con ocupación, cifras y bienes", () => {
    expect(borrador.situacionEconomica).toBe(
      "El señor Jose Joaquin Ruiz Rojas se desempeña como contratista para Codensa. Reporta ingresos mensuales de $2.100.000 y gastos mensuales aproximados de $12.000.000. Dentro de su situación patrimonial reporta apartamento actualmente hipotecado, sobre el cual además registra patrimonio de familia.",
    );
  });

  it("describe las obligaciones por garantía y recoge situación y objetivo", () => {
    const [deudas, situacion, objetivo] = parrafos(borrador.situacionLegal);
    expect(deudas).toBe(
      "La situación jurídica del cliente está conformada por tres obligaciones sin garantía real que presentan mora superior a 90 días: Falabella por $23.000.000, Alkosto por $14.000.000 y Davivienda por $17.200.000. Adicionalmente, mantiene una obligación con garantía real: una obligación hipotecaria de tercera clase con FNA por $59.000.000, al día.",
    );
    expect(situacion).toBe(
      "Según lo manifestado en la reunión, la situación actual del cliente es la siguiente: Falabella le informó que su obligación está en proceso jurídico; no le han notificado medidas cautelares.",
    );
    expect(objetivo).toBe(
      "Teniendo en cuenta que su objetivo principal es conservar su apartamento, la estrategia jurídica debe orientarse a ese propósito.",
    );
  });

  it("recomienda conservar el bien con garantía sin revelar la denominación interna", () => {
    const [estrategia, efectos] = parrafos(borrador.recomendacion);
    expect(estrategia).toContain(
      "continúe atendiendo normalmente la obligación hipotecaria con FNA y conserve el bien asociado",
    );
    expect(estrategia).toContain("—Falabella, Alkosto y Davivienda—");
    expect(estrategia).toContain("(conservar su apartamento)");
    expect(borrador.recomendacion.toLowerCase()).not.toContain("bilateral");
    expect(efectos).toContain("efectos legales de suspensión");
  });

  it("presenta los honorarios con las cifras exactas de la matriz", () => {
    expect(parrafos(borrador.honorarios)).toEqual([
      "Los honorarios profesionales corresponden a $5.660.000, equivalentes al 5 % del pasivo reportado. El pago podrá realizarse en 10 cuotas de $566.000 cada una.",
      "Para el trámite se requiere Centro de Conciliación, cuyo valor registrado es de $1.200.000; corresponde a un costo adicional asociado al trámite.",
      "El costo total estimado del proceso, de acuerdo con la información registrada en la matriz, corresponde a $7.232.000.",
    ]);
  });

  it("usa 'La señora' cuando el tratamiento es femenino", () => {
    expect(
      redactarBorrador(datosDe(entradaEjemplo, "Ana Pérez"), "senora").situacionEconomica,
    ).toMatch(/^La señora Ana Pérez /);
  });
});

describe("otros escenarios", () => {
  it("liquidación patrimonial sin centro ni bienes: justicia ordinaria y sin costo de centro", () => {
    const entrada = {
      ...entradaEjemplo,
      bienes: null,
      tipoServicio: "liquidacion_patrimonial" as const,
      requiereCentroConciliacion: false,
    };
    const borrador = redactarBorrador(datosDe(entrada));
    expect(borrador.recomendacion).toContain("no se registraron bienes a su nombre");
    expect(borrador.recomendacion).toContain("justicia ordinaria");
    expect(borrador.recomendacion).toContain(
      "Estos tiempos dependen exclusivamente de la carga y gestión del despacho judicial correspondiente y no se encuentran bajo el control del abogado.",
    );
    expect(borrador.honorarios).toContain("no se genera costo de Centro de Conciliación");
    expect(borrador.honorarios).not.toContain("$1.500.000");
  });

  it("liquidación con centro explica la agilidad y el valor del centro", () => {
    const entrada = {
      ...entradaEjemplo,
      tipoServicio: "liquidacion_patrimonial" as const,
    };
    const borrador = redactarBorrador(datosDe(entrada));
    expect(borrador.recomendacion).toContain("cuyo valor registrado es de $1.200.000");
    expect(borrador.recomendacion).toContain("entre 15 y 20 días");
    expect(borrador.recomendacion).toContain(
      "bienes reportados (apartamento actualmente hipotecado",
    );
  });

  it("acuerdo de pago explica la negociación sin prometer resultados", () => {
    const entrada = { ...entradaEjemplo, tipoServicio: "acuerdo_pago" as const };
    const borrador = redactarBorrador(datosDe(entrada));
    expect(borrador.recomendacion).toContain("se procurará obtener");
    expect(borrador.recomendacion).toContain("sujeta a la aceptación de los acreedores");
  });

  it("cuenta la mora con palabras y en todos los casos límite", () => {
    const soloUna = { ...entradaEjemplo, obligaciones: entradaEjemplo.obligaciones.slice(0, 1) };
    expect(construirContenidoPropuesta(datosDe(soloUna)).analisisAcreencias[0]).toMatch(
      /^La única obligación reportada presenta mora superior a 90 días\./,
    );
    const todas = {
      ...entradaEjemplo,
      obligaciones: entradaEjemplo.obligaciones.slice(0, 3),
    };
    expect(construirContenidoPropuesta(datosDe(todas)).analisisAcreencias[0]).toMatch(
      /^Las tres obligaciones reportadas presentan mora superior a 90 días\./,
    );
  });
});

describe("contenido completo", () => {
  const datos = datosDe(entradaEjemplo);

  it("arma la propuesta con fecha, tratamiento, nombre en mayúsculas, tabla y textos fijos", () => {
    const contenido = construirContenidoPropuesta(datos, undefined, fechaEjemplo);
    expect(contenido.lugarYFecha).toBe("Bogotá, 11 de septiembre de 2026");
    expect(contenido.tratamiento).toBe("Señor");
    expect(contenido.nombreCliente).toBe("JOSE JOAQUIN RUIZ ROJAS");
    expect(contenido.pasivo).toBe(
      "De acuerdo con la información suministrada, su pasivo total asciende a $113.200.000. Sus deudas reportadas son las siguientes:",
    );
    expect(contenido.acreencias.map((a) => a.acreedor)).toEqual([
      "Falabella",
      "Alkosto",
      "Davivienda",
      "FNA",
    ]);
    expect(contenido.analisisAcreencias[0]).toBe(
      "Tres de las cuatro obligaciones reportadas presentan mora superior a 90 días. Con base en la información suministrada, el cliente figura como ELEGIBLE para acudir al procedimiento de insolvencia, sujeto a la validación documental y jurídica correspondiente.",
    );
    expect(contenido.parrafoFijoRecomendacion).toBe(PARRAFO_FIJO_RECOMENDACION);
    expect(contenido.gestion).toHaveLength(3);
    expect(contenido.idoneidad.rutaConsulta[0]).toBe("www.supersociedades.gov.co");
    expect(contenido.firma.nombre).toBe("BLANCA CECILIA BUITRAGO DÍAZ");
    expect(contenido.membrete.direccion).toBe("Bogotá - Calle 104 #21-50 Oficina 503");
    expect(contenido.errores).toEqual([]);
  });

  it("usa la redacción del equipo cuando existe y el borrador en lo demás", () => {
    const contenido = construirContenidoPropuesta(datos, {
      tratamiento: "senora",
      situacionEconomica: "Texto propio.\n\nSegundo párrafo.",
      situacionLegal: "   ",
      recomendacion: null,
      honorarios: null,
    });
    expect(contenido.tratamiento).toBe("Señora");
    expect(contenido.situacionEconomica).toEqual(["Texto propio.", "Segundo párrafo."]);
    expect(contenido.situacionLegal[0]).toContain("La situación jurídica del cliente");
    expect(contenido.honorarios[0]).toContain("$5.660.000");
  });

  it("lista los errores de la matriz que impiden generar la propuesta", () => {
    const conError = {
      ...entradaEjemplo,
      tipoServicio: "acuerdo_pago" as const,
      requiereCentroConciliacion: false,
    };
    const contenido = construirContenidoPropuesta(datosDe(conError));
    expect(contenido.errores.length).toBeGreaterThan(0);
    expect(contenido.errores.join(" ")).toContain("centro de conciliación");
  });
});
