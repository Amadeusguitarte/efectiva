import { describe, expect, it } from "vitest";

import { obligacionVacia } from "./calcular";
import {
  COLUMNAS_TABLA,
  FILAS_MINIMAS,
  completarFilas,
  esPegadoDeHoja,
  filasIncluidas,
  formulasHoja,
  leerClase,
  leerGarantia,
  leerMora,
  leerPesos,
  leerPortapapeles,
  leerSiNo,
  pegarBloque,
  type FilaHoja,
} from "./hoja";

function contador(inicio = 100) {
  let siguiente = inicio;
  return () => siguiente++;
}

const fila = (clave: number, cambios: Partial<FilaHoja["obligacion"]>, enUso = true): FilaHoja => ({
  clave,
  enUso,
  obligacion: { ...obligacionVacia(), ...cambios },
});

describe("filas de la hoja", () => {
  it("completa hasta 20 filas vacías, como el Excel", () => {
    const filas = completarFilas([fila(0, { acreedor: "Davivienda" })], contador());
    expect(filas).toHaveLength(FILAS_MINIMAS);
    expect(filas[0]?.enUso).toBe(true);
    expect(filas.slice(1).every((f) => !f.enUso)).toBe(true);
    expect(new Set(filas.map((f) => f.clave)).size).toBe(FILAS_MINIMAS);
  });

  it("no recorta si ya hay más filas", () => {
    const filas = Array.from({ length: 25 }, (_, i) => fila(i, { acreedor: `A${i}` }));
    expect(completarFilas(filas, contador())).toHaveLength(25);
  });

  it("solo guarda las filas con contenido", () => {
    const filas = [
      fila(0, { acreedor: "Davivienda", capital: 1 }),
      fila(1, { mora: "mas_90_dias" }), // solo listas: no es una obligación
      fila(2, {}, false),
      fila(3, { capital: 500 }), // sin acreedor: se envía para que la validación lo marque
      fila(4, { acreedor: "Tigo" }, false), // nunca tocada
    ];
    expect(filasIncluidas(filas).map((f) => f.clave)).toEqual([0, 3]);
  });
});

describe("lectura de celdas pegadas", () => {
  it("lee importes con formato de Excel", () => {
    expect(leerPesos("$ 150.000.000")).toBe(150_000_000);
    expect(leerPesos("1,000,000")).toBe(1_000_000);
    expect(leerPesos("$1.500.000,00")).toBe(1_500_000);
    expect(leerPesos("300000")).toBe(300_000);
    expect(leerPesos("")).toBeNull();
    expect(leerPesos(" - ")).toBeNull();
    expect(leerPesos("abc")).toBeNull();
  });

  it("reconoce las opciones de las listas del Excel", () => {
    expect(leerMora("> 90 días")).toBe("mas_90_dias");
    expect(leerMora("< 90 dias")).toBe("menos_90_dias");
    expect(leerMora("Más de 90 días")).toBe("mas_90_dias");
    expect(leerMora("Al día")).toBe("al_dia");
    expect(leerMora("cualquiera")).toBeNull();
    expect(leerGarantia("Sin garantía")).toBe("sin_garantia");
    expect(leerGarantia("Hipoteca")).toBe("hipoteca");
    expect(leerGarantia("Garantía mobiliaria / prenda")).toBe("garantia_mobiliaria");
    expect(leerGarantia("Otra / verificar")).toBe("otra_verificar");
    expect(leerClase("TERCERA")).toBe("tercera");
    expect(leerClase("por verificar")).toBe("por_verificar");
    expect(leerClase("sexta")).toBeNull();
    expect(leerSiNo("Sí")).toBe(true);
    expect(leerSiNo("NO")).toBe(false);
    expect(leerSiNo("")).toBeNull();
  });

  it("separa filas y celdas del portapapeles, con comillas de Excel", () => {
    expect(leerPortapapeles("a\tb\r\nc\td\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(leerPortapapeles('"linea 1\nlinea 2"\tx')).toEqual([["linea 1\nlinea 2", "x"]]);
    expect(leerPortapapeles('"dice ""hola"""\ty')).toEqual([['dice "hola"', "y"]]);
    expect(esPegadoDeHoja("Davivienda")).toBe(false);
    expect(esPegadoDeHoja("Davivienda\n")).toBe(false);
    expect(esPegadoDeHoja("a\tb")).toBe(true);
    expect(esPegadoDeHoja("a\nb")).toBe(true);
  });
});

describe("pegar un bloque copiado del Excel", () => {
  const columna = (clave: string) => COLUMNAS_TABLA.findIndex((c) => c.clave === clave);

  it("pega filas completas desde la columna N° y omite las calculadas", () => {
    const texto =
      "1\tDavivienda\tCredito Hipotecario\t$150.000.000\t\t$150.000.000\t> 90 días\t120\t87%\tNo\tHipoteca\tTERCERA\n" +
      "2\tBanco Agrario\tTarjeta de credito\t1.000.000\t50.000\t1.050.000\t< 90 días\t\t1%\tSí\tSin garantía\tQUINTA\n";
    const filas = completarFilas([], contador(0));
    const resultado = pegarBloque(filas, leerPortapapeles(texto), 0, 0, contador(50));
    expect(resultado).toHaveLength(FILAS_MINIMAS);
    expect(resultado[0]).toMatchObject({
      enUso: true,
      obligacion: {
        acreedor: "Davivienda",
        concepto: "Credito Hipotecario",
        capital: 150_000_000,
        intereses: 0,
        mora: "mas_90_dias",
        diasMora: 120,
        descuentoNomina: false,
        tipoGarantia: "hipoteca",
        clase: "tercera",
      },
    });
    expect(resultado[1]?.obligacion).toMatchObject({
      acreedor: "Banco Agrario",
      capital: 1_000_000,
      intereses: 50_000,
      mora: "menos_90_dias",
      diasMora: null,
      descuentoNomina: true,
      tipoGarantia: "sin_garantia",
      clase: "quinta",
    });
    expect(resultado[2]?.enUso).toBe(false);
  });

  it("pega una columna suelta a partir de la celda activa y agrega filas si faltan", () => {
    const filas = completarFilas([], contador(0), 2);
    const resultado = pegarBloque(
      filas,
      leerPortapapeles("Tigo\nClaro\nMovistar"),
      1,
      columna("acreedor"),
      contador(50),
    );
    expect(resultado.map((f) => f.obligacion.acreedor)).toEqual(["", "Tigo", "Claro", "Movistar"]);
    expect(resultado.map((f) => f.enUso)).toEqual([false, true, true, true]);
  });

  it("conserva el valor de las listas cuando el texto no coincide", () => {
    const filas = [fila(0, { acreedor: "X", clase: "tercera" })];
    const resultado = pegarBloque(filas, [["sexta"]], 0, columna("clase"), contador());
    expect(resultado[0]?.obligacion.clase).toBe("tercera");
  });
});

describe("fórmulas mostradas", () => {
  it("usan el rango real de filas", () => {
    const f = formulasHoja(20);
    expect(f.pasivoTotal).toBe("=SUMA(G16:G35)");
    expect(f.total(16)).toBe('=SI(E16+F16=0;"";E16+F16)');
    expect(f.cantidadClase(39)).toBe("=CONTAR.SI($M$16:$M$35;B39)");
    expect(formulasHoja(25).pasivoTotal).toBe("=SUMA(G16:G40)");
    expect(f.costoProceso).toContain("372000");
  });
});
