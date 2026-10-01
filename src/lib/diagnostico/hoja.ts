import { obligacionVacia, type ObligacionEntrada } from "./calcular";
import {
  CLASES,
  MORAS,
  TIPOS_GARANTIA,
  type ClaseCredito,
  type MoraObligacion,
  type TipoGarantia,
} from "./catalogos";

/**
 * Lógica de la tabla de obligaciones de la matriz: filas libres, filas que se guardan y pegado
 * de bloques copiados del Excel «Diagnóstico Cliente». Funciones puras: sin React ni DOM.
 */

/** Filas libres que la tabla mantiene siempre después de la última obligación. */
export const FILAS_LIBRES = 3;

/** Filas que muestra la tabla como mínimo, con o sin datos. */
export const FILAS_MINIMAS = 5;

/**
 * Columnas de la tabla de obligaciones, en el orden del Excel (de N° a CLASE). El orden importa:
 * al pegar, cada celda copiada cae en la columna que le corresponde.
 */
export const COLUMNAS_TABLA = [
  { clave: "numero", titulo: "N°", editable: false },
  { clave: "acreedor", titulo: "Acreedor", editable: true },
  { clave: "concepto", titulo: "Concepto / producto", editable: true },
  { clave: "capital", titulo: "Capital", editable: true },
  { clave: "intereses", titulo: "Intereses / otros", editable: true },
  { clave: "total", titulo: "Total adeudado", editable: false },
  { clave: "mora", titulo: "Mora", editable: true },
  { clave: "diasMora", titulo: "Días mora", editable: true },
  { clave: "porcentaje", titulo: "% deuda", editable: false },
  { clave: "descuentoNomina", titulo: "Desc. nómina", editable: true },
  { clave: "tipoGarantia", titulo: "Garantía", editable: true },
  { clave: "clase", titulo: "Clase", editable: true },
] as const;

export type ClaveColumna = (typeof COLUMNAS_TABLA)[number]["clave"];

/** Fila de la tabla: la obligación y si alguien ya escribió en ella. */
export type FilaHoja = { clave: number; obligacion: ObligacionEntrada; enUso: boolean };

export function filaVacia(clave: number): FilaHoja {
  return { clave, obligacion: obligacionVacia(), enUso: false };
}

/** La fila tiene algo que la convierte en obligación (no solo listas desplegables). */
export function filaConContenido(o: ObligacionEntrada): boolean {
  return (
    o.acreedor.trim() !== "" ||
    (o.concepto ?? "").trim() !== "" ||
    o.capital > 0 ||
    o.intereses > 0 ||
    o.diasMora !== null
  );
}

/** Filas que se guardan: las que están en uso y tienen contenido. */
export function filasIncluidas(filas: readonly FilaHoja[]): FilaHoja[] {
  return filas.filter((f) => f.enUso && filaConContenido(f.obligacion));
}

/**
 * Posición de la primera fila libre del final: la siguiente a la última fila con contenido
 * (`filas.length` si no queda ninguna libre). Ahí escribe «Agregar obligación».
 */
export function primeraFilaLibre(filas: readonly FilaHoja[]): number {
  let indice = filas.length;
  while (indice > 0) {
    const anterior = filas[indice - 1];
    if (!anterior || filaConContenido(anterior.obligacion)) break;
    indice -= 1;
  }
  return indice;
}

/**
 * Deja siempre `libres` filas sin contenido al final de la tabla y al menos `minimo` filas en
 * total: al escribir en las últimas filas aparecen filas nuevas. Las filas sobrantes del final se
 * quitan solo si nadie las ha tocado, para no borrar la fila en la que se está escribiendo.
 */
export function ajustarFilasLibres(
  filas: readonly FilaHoja[],
  siguienteClave: () => number,
  libres = FILAS_LIBRES,
  minimo = FILAS_MINIMAS,
): FilaHoja[] {
  const resultado = [...filas];
  const inicioLibres = primeraFilaLibre(resultado);
  while (
    resultado.length > minimo &&
    resultado.length - inicioLibres > libres &&
    resultado.at(-1)?.enUso === false
  ) {
    resultado.pop();
  }
  const faltan = Math.max(libres - (resultado.length - inicioLibres), minimo - resultado.length, 0);
  for (let i = 0; i < faltan; i += 1) resultado.push(filaVacia(siguienteClave()));
  return resultado;
}

/** Texto normalizado para comparar opciones: sin tildes, mayúsculas ni espacios extra. */
export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Importe pegado desde Excel ("$ 1.500.000", "1,500,000", "1500000"). Null si no es número. */
export function leerPesos(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === "" || limpio === "-") return null;
  // Se descartan los decimales (",00" o ".00" al final) y luego todo lo que no sea dígito.
  const sinDecimales = limpio.replace(/[.,]\d{1,2}\s*$/, "");
  const digitos = sinDecimales.replace(/\D/g, "");
  if (digitos === "") return null;
  return Number(digitos.slice(0, 12));
}

function buscarOpcion<T extends string>(
  opciones: readonly { valor: T; etiqueta: string; etiquetaPropuesta: string }[],
  texto: string,
): T | null {
  const buscado = normalizarTexto(texto);
  if (buscado === "") return null;
  const encontrada = opciones.find(
    (o) =>
      normalizarTexto(o.etiqueta) === buscado ||
      normalizarTexto(o.etiquetaPropuesta) === buscado ||
      normalizarTexto(o.valor.replace(/_/g, " ")) === buscado,
  );
  return encontrada?.valor ?? null;
}

export function leerMora(texto: string): MoraObligacion | null {
  const buscado = normalizarTexto(texto).replace(/\s/g, "");
  if (/^(>|mas|masde|mayor|mayora)90/.test(buscado)) return "mas_90_dias";
  if (/^(<|menos|menosde|menor|menora)90/.test(buscado)) return "menos_90_dias";
  return buscarOpcion(MORAS, texto);
}

export function leerGarantia(texto: string): TipoGarantia | null {
  const directa = buscarOpcion(TIPOS_GARANTIA, texto);
  if (directa) return directa;
  const buscado = normalizarTexto(texto);
  if (buscado.startsWith("hipoteca")) return "hipoteca";
  if (buscado.includes("prenda") || buscado.includes("mobiliaria")) return "garantia_mobiliaria";
  if (buscado.startsWith("sin")) return "sin_garantia";
  if (buscado.startsWith("otra") || buscado.includes("verificar")) return "otra_verificar";
  return null;
}

export function leerClase(texto: string): ClaseCredito | null {
  return buscarOpcion(CLASES, texto);
}

export function leerSiNo(texto: string): boolean | null {
  const buscado = normalizarTexto(texto);
  if (["si", "s", "x", "true", "verdadero"].includes(buscado)) return true;
  if (["no", "n", "false", "falso"].includes(buscado)) return false;
  return null;
}

/**
 * Convierte el texto copiado de una hoja de cálculo (filas separadas por saltos de línea y
 * celdas por tabulaciones) en una matriz de celdas. Respeta las celdas entre comillas que
 * Excel usa cuando el texto tiene saltos de línea.
 */
export function leerPortapapeles(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;
  const normalizado = texto.replace(/\r\n?/g, "\n");
  for (let i = 0; i < normalizado.length; i += 1) {
    const caracter = normalizado[i];
    if (entreComillas) {
      if (caracter === '"' && normalizado[i + 1] === '"') {
        celda += '"';
        i += 1;
      } else if (caracter === '"') {
        entreComillas = false;
      } else {
        celda += caracter;
      }
    } else if (caracter === '"' && celda === "") {
      entreComillas = true;
    } else if (caracter === "\t") {
      fila.push(celda);
      celda = "";
    } else if (caracter === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else {
      celda += caracter;
    }
  }
  if (celda !== "" || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

/** Es un pegado de varias celdas (no un texto suelto dentro de una celda). */
export function esPegadoDeHoja(texto: string): boolean {
  return /[\t\n]/.test(texto.replace(/\r?\n$/, ""));
}

/**
 * Aplica una celda pegada a una obligación. Las columnas calculadas (N°, total, %) se ignoran,
 * igual que los valores que no corresponden a ninguna opción de la lista.
 */
export function aplicarCelda(
  obligacion: ObligacionEntrada,
  columna: ClaveColumna,
  texto: string,
): ObligacionEntrada {
  const valor = texto.trim();
  switch (columna) {
    case "acreedor":
      return { ...obligacion, acreedor: valor.slice(0, 160) };
    case "concepto":
      return { ...obligacion, concepto: valor === "" ? null : valor.slice(0, 160) };
    case "capital":
      return { ...obligacion, capital: leerPesos(valor) ?? 0 };
    case "intereses":
      return { ...obligacion, intereses: leerPesos(valor) ?? 0 };
    case "mora": {
      const mora = leerMora(valor);
      return mora ? { ...obligacion, mora } : obligacion;
    }
    case "diasMora": {
      const dias = leerPesos(valor);
      return { ...obligacion, diasMora: dias === null ? null : Math.min(dias, 36500) };
    }
    case "descuentoNomina": {
      const si = leerSiNo(valor);
      return si === null ? obligacion : { ...obligacion, descuentoNomina: si };
    }
    case "tipoGarantia": {
      const garantia = leerGarantia(valor);
      return garantia ? { ...obligacion, tipoGarantia: garantia } : obligacion;
    }
    case "clase": {
      const clase = leerClase(valor);
      return clase ? { ...obligacion, clase } : obligacion;
    }
    default:
      return obligacion;
  }
}

/** Celda que puede venir antes de ACREEDOR al copiar del Excel: vacía o un N° de fila. */
const CELDA_NUMERO_FILA = /^\s*\d{0,4}\s*$/;

/**
 * Celdas del inicio de cada fila que sobran porque el bloque empieza antes de la columna donde se
 * pega: filas copiadas desde N° (o desde la columna A, vacía en la hoja) y pegadas en ACREEDOR, la
 * primera celda editable. Solo se descartan si todas son vacías o números de fila; un bloque que
 * trae columnas de más a la derecha se pega tal cual (lo que sobra al final se ignora).
 */
export function celdasSobrantesAlInicio(
  bloque: readonly (readonly string[])[],
  columnaInicial: number,
): number {
  const ancho = Math.max(0, ...bloque.map((celdas) => celdas.length));
  const sobran = ancho - (COLUMNAS_TABLA.length - columnaInicial);
  if (sobran <= 0) return 0;
  const descartables = bloque.every((celdas) =>
    celdas.slice(0, sobran).every((celda) => CELDA_NUMERO_FILA.test(celda)),
  );
  return descartables ? sobran : 0;
}

/**
 * Pega un bloque copiado de Excel en la tabla a partir de la fila y columna indicadas.
 * Agrega filas si el bloque no cabe. Devuelve las filas nuevas.
 */
export function pegarBloque(
  filas: readonly FilaHoja[],
  bloque: readonly (readonly string[])[],
  filaInicial: number,
  columnaInicial: number,
  siguienteClave: () => number,
): FilaHoja[] {
  const resultado = [...filas];
  const sobrantes = celdasSobrantesAlInicio(bloque, columnaInicial);
  bloque.forEach((fila, desplazamiento) => {
    const indice = filaInicial + desplazamiento;
    while (resultado.length <= indice) resultado.push(filaVacia(siguienteClave()));
    const actual = resultado[indice];
    if (!actual) return;
    let obligacion = actual.obligacion;
    fila.slice(sobrantes).forEach((texto, columna) => {
      const definicion = COLUMNAS_TABLA[columnaInicial + columna];
      if (definicion?.editable) obligacion = aplicarCelda(obligacion, definicion.clave, texto);
    });
    resultado[indice] = { ...actual, obligacion, enUso: true };
  });
  return resultado;
}
