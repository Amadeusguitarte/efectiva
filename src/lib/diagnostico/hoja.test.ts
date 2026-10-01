import { describe, expect, it } from "vitest";

import { obligacionVacia } from "./calcular";
import {
  COLUMNAS_TABLA,
  FILAS_LIBRES,
  FILAS_MINIMAS,
  ajustarFilasLibres,
  esPegadoDeHoja,
  filaVacia,
  filasIncluidas,
  leerClase,
  leerGarantia,
  leerMora,
  leerPesos,
  leerPortapapeles,
  leerSiNo,
  pegarBloque,
  primeraFilaLibre,
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

const conDatos = (cantidad: number) =>
  Array.from({ length: cantidad }, (_, i) => fila(i, { acreedor: `Acreedor ${i + 1}` }));

describe("filas de la tabla", () => {
  it("una matriz nueva muestra el mínimo de filas, todas libres", () => {
    const filas = ajustarFilasLibres([], contador());
    expect(filas).toHaveLength(FILAS_MINIMAS);
    expect(filas.every((f) => !f.enUso)).toBe(true);
    expect(new Set(filas.map((f) => f.clave)).size).toBe(FILAS_MINIMAS);
  });

  it("deja siempre filas libres después de la última obligación", () => {
    const filas = ajustarFilasLibres(conDatos(8), contador());
    expect(filas).toHaveLength(8 + FILAS_LIBRES);
    expect(filas.slice(8).every((f) => !f.enUso)).toBe(true);
    expect(primeraFilaLibre(filas)).toBe(8);
  });

  it("agrega una fila libre al escribir en las últimas", () => {
    const filas = ajustarFilasLibres(conDatos(2), contador());
    expect(filas).toHaveLength(FILAS_MINIMAS);
    // Escribir en la tercera fila deja solo dos libres: aparece una más.
    const escritas = filas.map((f, i) =>
      i === 2 ? { ...f, enUso: true, obligacion: { ...f.obligacion, acreedor: "Tigo" } } : f,
    );
    const ajustadas = ajustarFilasLibres(escritas, contador(50));
    expect(ajustadas).toHaveLength(6);
    expect(ajustadas.at(-1)?.clave).toBe(50);
    expect(ajustadas.length - primeraFilaLibre(ajustadas)).toBe(FILAS_LIBRES);
  });

  it("quita filas sobrantes sin tocar y conserva las que se están editando", () => {
    const filas = [
      ...conDatos(2),
      fila(2, {}), // se borró lo que tenía: sigue en uso
      ...Array.from({ length: 6 }, (_, i) => filaVacia(10 + i)),
    ];
    const ajustadas = ajustarFilasLibres(filas, contador());
    expect(ajustadas.map((f) => f.clave)).toEqual([0, 1, 2, 10, 11]);
  });

  it("no quita filas por debajo del mínimo ni filas en uso", () => {
    const enUso = [
      fila(0, { acreedor: "A" }),
      ...Array.from({ length: 5 }, (_, i) => fila(i + 1, {})),
    ];
    expect(ajustarFilasLibres(enUso, contador())).toHaveLength(6);
    expect(ajustarFilasLibres([filaVacia(0)], contador())).toHaveLength(FILAS_MINIMAS);
  });

  it("la primera fila libre es la siguiente a la última con contenido", () => {
    expect(primeraFilaLibre([])).toBe(0);
    expect(
      primeraFilaLibre([fila(0, { acreedor: "A" }), filaVacia(1), fila(2, { capital: 5 })]),
    ).toBe(3);
    expect(primeraFilaLibre([fila(0, { acreedor: "A" }), fila(1, { mora: "mas_90_dias" })])).toBe(
      1,
    );
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
    const filas = ajustarFilasLibres([], contador(0));
    const resultado = pegarBloque(filas, leerPortapapeles(texto), 0, 0, contador(50));
    expect(resultado).toHaveLength(FILAS_MINIMAS);
    expect(ajustarFilasLibres(resultado, contador(50))).toHaveLength(FILAS_MINIMAS);
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

  it("al pegar en ACREEDOR filas copiadas desde N° (o desde la columna A) descarta esas celdas", () => {
    const desdeNumero =
      "1\tDavivienda\tCredito Hipotecario\t$150.000.000\t\t$150.000.000\t> 90 días\t120\t87%\tNo\tHipoteca\tTERCERA\n" +
      "\tBanco Agrario\t\t1.000.000\t50.000\t1.050.000\t< 90 días\t\t1%\tSí\tSin garantía\tQUINTA\n";
    const desdeColumnaA = desdeNumero.replace(/^/gm, "\t").replace(/\t$/, "");
    for (const texto of [desdeNumero, desdeColumnaA]) {
      const filas = ajustarFilasLibres([], contador(0));
      const resultado = pegarBloque(
        filas,
        leerPortapapeles(texto),
        0,
        columna("acreedor"),
        contador(50),
      );
      expect(resultado[0]?.obligacion).toMatchObject({
        acreedor: "Davivienda",
        concepto: "Credito Hipotecario",
        capital: 150_000_000,
        intereses: 0,
        mora: "mas_90_dias",
        diasMora: 120,
        descuentoNomina: false,
        tipoGarantia: "hipoteca",
        clase: "tercera",
      });
      expect(resultado[1]?.obligacion).toMatchObject({
        acreedor: "Banco Agrario",
        capital: 1_000_000,
        intereses: 50_000,
        mora: "menos_90_dias",
        clase: "quinta",
      });
    }
  });

  it("no descarta celdas iniciales con datos aunque el bloque traiga columnas de más", () => {
    const texto = "Tigo\tCelular\t300.000\t\t\t> 90 días\t95\t\tNo\tSin garantía\tQUINTA\tNota\n";
    const resultado = pegarBloque(
      [filaVacia(0)],
      leerPortapapeles(texto),
      0,
      columna("acreedor"),
      contador(50),
    );
    expect(resultado[0]?.obligacion).toMatchObject({
      acreedor: "Tigo",
      concepto: "Celular",
      capital: 300_000,
      diasMora: 95,
      clase: "quinta",
    });
  });

  it("pega una columna suelta a partir de la celda activa y agrega filas si faltan", () => {
    const filas = [filaVacia(0), filaVacia(1)];
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
