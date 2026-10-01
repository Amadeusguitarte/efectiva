import { obligacionVacia, type ObligacionEntrada } from "./calcular";
import {
  CLASES,
  MORAS,
  TIPOS_GARANTIA,
  type ClaseCredito,
  type MoraObligacion,
  type TipoGarantia,
} from "./catalogos";
import { PARAMETROS_DIAGNOSTICO } from "./parametros";

/**
 * Lógica de la vista tipo hoja de cálculo de la matriz (la misma distribución de la hoja
 * «Diagnóstico Cliente» del Excel). Funciones puras: sin React ni DOM.
 */

/** Filas de obligaciones que muestra la hoja aunque estén vacías (como el Excel). */
export const FILAS_MINIMAS = 20;

/** Fila del Excel donde empieza la tabla de obligaciones (encabezado en la 15). */
export const FILA_ENCABEZADO_TABLA = 15;

/** Columnas editables de la tabla de obligaciones, en el orden del Excel. */
export const COLUMNAS_TABLA = [
  { clave: "numero", letra: "B", titulo: "N°", editable: false },
  { clave: "acreedor", letra: "C", titulo: "ACREEDOR", editable: true },
  { clave: "concepto", letra: "D", titulo: "CONCEPTO / PRODUCTO", editable: true },
  { clave: "capital", letra: "E", titulo: "CAPITAL", editable: true },
  { clave: "intereses", letra: "F", titulo: "INTERESES / OTROS", editable: true },
  { clave: "total", letra: "G", titulo: "TOTAL ADEUDADO", editable: false },
  { clave: "mora", letra: "H", titulo: "MORA", editable: true },
  { clave: "diasMora", letra: "I", titulo: "DÍAS MORA", editable: true },
  { clave: "porcentaje", letra: "J", titulo: "% DE CADA DEUDA", editable: false },
  { clave: "descuentoNomina", letra: "K", titulo: "DESCUENTO NÓMINA ACTIVO", editable: true },
  { clave: "tipoGarantia", letra: "L", titulo: "TIPO GARANTÍA", editable: true },
  { clave: "clase", letra: "M", titulo: "CLASE", editable: true },
] as const;

export type ClaveColumna = (typeof COLUMNAS_TABLA)[number]["clave"];

/** Fila de la hoja: la obligación y si alguien ya escribió en ella. */
export type FilaHoja = { clave: number; obligacion: ObligacionEntrada; enUso: boolean };

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

/** Completa con filas vacías hasta `minimo`. */
export function completarFilas(
  filas: readonly FilaHoja[],
  siguienteClave: () => number,
  minimo = FILAS_MINIMAS,
): FilaHoja[] {
  const resultado = [...filas];
  while (resultado.length < minimo) {
    resultado.push({ clave: siguienteClave(), obligacion: obligacionVacia(), enUso: false });
  }
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
  bloque.forEach((celdas, desplazamiento) => {
    const indice = filaInicial + desplazamiento;
    while (resultado.length <= indice) {
      resultado.push({ clave: siguienteClave(), obligacion: obligacionVacia(), enUso: false });
    }
    const actual = resultado[indice];
    if (!actual) return;
    let obligacion = actual.obligacion;
    celdas.forEach((texto, columna) => {
      const definicion = COLUMNAS_TABLA[columnaInicial + columna];
      if (definicion?.editable) obligacion = aplicarCelda(obligacion, definicion.clave, texto);
    });
    resultado[indice] = { ...actual, obligacion, enUso: true };
  });
  return resultado;
}

/** Referencias de celda de la hoja, para la barra de fórmulas. */
export function filaExcel(indice: number): number {
  return FILA_ENCABEZADO_TABLA + 1 + indice;
}

/**
 * Fórmulas equivalentes a las del Excel (con nombres de función en español), ajustadas a las
 * reglas vigentes del motor. Solo se muestran; el cálculo real lo hace `calcularDiagnostico`.
 */
export function formulasHoja(filas: number) {
  const primera = filaExcel(0);
  const ultima = filaExcel(Math.max(filas, 1) - 1);
  const rango = (letra: string) => `$${letra}$${primera}:$${letra}$${ultima}`;
  const { elegibilidad, gastosProceso } = PARAMETROS_DIAGNOSTICO;
  const umbral = Math.round(elegibilidad.umbralPasivoEnMora * 100);
  const gastos =
    gastosProceso.porObligacion > 0
      ? `${gastosProceso.fijos}+${gastosProceso.porObligacion}*CONTARA(C${primera}:C${ultima})`
      : `${gastosProceso.fijos}`;
  return {
    pasivoTotal: `=SUMA(G${primera}:G${ultima})`,
    honorarios: "=REDONDEAR(F5*F7;0)",
    costoProceso: `=F8+${gastos}+SI(O(F6="Acuerdo de pago";F6="Acuerdo de pago bilateral";Y(F6="Liquidación patrimonial";I7="SI"));MAX(I8-I9;0);0)`,
    valorCuota: '=SI.ERROR(REDONDEAR(F8/I5;0);"")',
    tarifaCentro: '=SI.ERROR(BUSCARX(F5;Listas!$I$2:$I$9;Listas!$K$2:$K$9;"";-1);"")',
    elegibilidad: `=SI(Y(CONTAR.SI(H${primera}:H${ultima};"> 90 días")>=${elegibilidad.minimoObligacionesEnMora};CONTARA(UNICOS(FILTRAR(C${primera}:C${ultima};H${primera}:H${ultima}="> 90 días")))>=${elegibilidad.minimoAcreedoresEnMora};SUMAR.SI(H${primera}:H${ultima};"> 90 días";G${primera}:G${ultima})/F5>=${umbral}%);"ELEGIBLE";"NO ELEGIBLE")`,
    total: (fila: number) => `=SI(E${fila}+F${fila}=0;"";E${fila}+F${fila})`,
    porcentaje: (fila: number) => `=SI(G${fila}="";"";G${fila}/$F$5)`,
    cantidadClase: (fila: number) => `=CONTAR.SI(${rango("M")};B${fila})`,
    totalClase: (fila: number) => `=SUMAR.SI(${rango("M")};B${fila};${rango("G")})`,
    porcentajeClase: (fila: number) => `=SI.ERROR(D${fila}/$F$5;0)`,
  };
}
