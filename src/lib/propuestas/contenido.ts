import { siteConfig } from "@/config/site";
import type { ClaseCredito } from "@/lib/diagnostico/catalogos";
import type { Acreencia, DatosPropuesta } from "@/lib/diagnostico/propuesta";
import { formatearFechaLarga, formatearPesos, formatearPorcentajeHonorarios } from "@/lib/formato";

import * as fijos from "./textos-fijos";

/**
 * Contenido de la propuesta legal. Sigue el prompt oficial de la propuesta: los puntos 1 a 4 se
 * redactan a partir de los "Datos para la propuesta" (borrador automático que el equipo puede
 * ajustar), y el resto son textos fijos de la plantilla. Funciones puras: se prueban sin base de
 * datos y sirven tanto para el PDF como para una futura redacción con IA.
 */

export const TRATAMIENTOS = ["senor", "senora"] as const;
export type Tratamiento = (typeof TRATAMIENTOS)[number];

export const INFO_TRATAMIENTO: Record<Tratamiento, { titulo: string; articulo: string }> = {
  senor: { titulo: "Señor", articulo: "El señor" },
  senora: { titulo: "Señora", articulo: "La señora" },
};

export const CAMPOS_REDACCION = [
  "situacionEconomica",
  "situacionLegal",
  "recomendacion",
  "honorarios",
] as const;
export type CampoRedaccion = (typeof CAMPOS_REDACCION)[number];

/** Textos guardados por el equipo; null significa "usar el borrador automático". */
export type RedaccionPropuesta = Record<CampoRedaccion, string | null> & {
  tratamiento: Tratamiento;
};

export const REDACCION_VACIA: RedaccionPropuesta = {
  tratamiento: "senor",
  situacionEconomica: null,
  situacionLegal: null,
  recomendacion: null,
  honorarios: null,
};

export type BorradorPropuesta = Record<CampoRedaccion, string>;

export type ContenidoPropuesta = {
  titulo: string;
  lugarYFecha: string;
  tratamiento: string;
  nombreCliente: string;
  saludo: string;
  introduccion: string;
  situacionEconomica: string[];
  /** Frase del pasivo total que antecede a la tabla. */
  pasivo: string;
  acreencias: Acreencia[];
  pasivoTotal: number;
  /** Mora y elegibilidad, después de la tabla. */
  analisisAcreencias: string[];
  situacionLegal: string[];
  recomendacion: string[];
  parrafoFijoRecomendacion: string;
  honorarios: string[];
  gestion: readonly string[];
  idoneidad: {
    parrafos: readonly string[];
    rutaConsulta: readonly string[];
    cierre: readonly string[];
  };
  despedida: string;
  cordialmente: string;
  firma: { nombre: string; cargo: string; empresa: string };
  membrete: { telefonos: string; email: string; direccion: string };
  /** Errores de la matriz. Si hay alguno, la propuesta no debe generarse. */
  errores: string[];
};

// ---------------------------------------------------------------------------
// Utilidades de redacción
// ---------------------------------------------------------------------------

const PALABRAS_MINUSCULA = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "y",
  "e",
  "da",
  "do",
  "van",
  "von",
]);

/** "JOSE JOAQUIN RUIZ ROJAS" -> "Jose Joaquin Ruiz Rojas". */
export function nombrePropio(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((parte, indice) =>
      indice > 0 && PALABRAS_MINUSCULA.has(parte)
        ? parte
        : parte.charAt(0).toUpperCase() + parte.slice(1),
    )
    .join(" ");
}

/** Divide un texto en párrafos (separados por líneas en blanco) y normaliza los espacios. */
export function parrafos(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .split(/\n\s*\n/)
    .map((parrafo) =>
      parrafo
        .replace(/\s*\n\s*/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

const NUMEROS_FEMENINOS = [
  "cero",
  "una",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
];

function numeroEnLetras(n: number): string {
  return NUMEROS_FEMENINOS[n] ?? String(n);
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function minusculaInicial(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function normalizar(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

function sinPuntoFinal(texto: string): string {
  return normalizar(texto).replace(/[.\s]+$/, "");
}

function conPuntoFinal(texto: string): string {
  const limpio = normalizar(texto);
  return /[.!?]$/.test(limpio) ? limpio : `${limpio}.`;
}

/** ["A", "B", "C"] -> "A, B y C". */
function listar(elementos: string[]): string {
  if (elementos.length <= 1) return elementos.join("");
  return `${elementos.slice(0, -1).join(", ")} y ${elementos.at(-1)}`;
}

function plural(cantidad: number, singular: string, pluralTexto: string): string {
  return cantidad === 1 ? singular : pluralTexto;
}

const GARANTIAS_REALES = new Set<Acreencia["codigoGarantia"]>(["hipoteca", "garantia_mobiliaria"]);

const CLASE_EN_TEXTO: Record<ClaseCredito, string> = {
  primera: "de primera clase",
  segunda: "de segunda clase",
  tercera: "de tercera clase",
  cuarta: "de cuarta clase",
  quinta: "de quinta clase",
  por_verificar: "de clase por verificar",
};

function descripcionGarantia(acreencia: Acreencia): string {
  if (acreencia.codigoGarantia === "hipoteca") return "obligación hipotecaria";
  if (acreencia.codigoGarantia === "garantia_mobiliaria") {
    return "obligación con garantía mobiliaria";
  }
  return "obligación";
}

function descripcionMora(acreencia: Acreencia): string {
  if (acreencia.codigoMora === "mas_90_dias") return "con mora superior a 90 días";
  if (acreencia.codigoMora === "menos_90_dias") return "con mora inferior a 90 días";
  return "al día";
}

const acreedorYValor = (a: Acreencia) => `${a.acreedor} por ${formatearPesos(a.valorAdeudado)}`;

// ---------------------------------------------------------------------------
// Borrador automático (puntos 1 a 4)
// ---------------------------------------------------------------------------

function redactarSituacionEconomica(datos: DatosPropuesta, tratamiento: Tratamiento): string {
  const { cliente } = datos;
  const sujeto = `${INFO_TRATAMIENTO[tratamiento].articulo} ${nombrePropio(cliente.nombre)}`;
  const frases: string[] = [];

  if (cliente.ocupacion) {
    frases.push(`${sujeto} se desempeña como ${sinPuntoFinal(cliente.ocupacion)}.`);
  }

  const ingresos =
    cliente.ingresosMensuales !== null
      ? `ingresos mensuales de ${formatearPesos(cliente.ingresosMensuales)}`
      : null;
  const gastos =
    cliente.gastosMensuales !== null
      ? `gastos mensuales aproximados de ${formatearPesos(cliente.gastosMensuales)}`
      : null;
  const cifras = [ingresos, gastos].filter((c): c is string => c !== null);
  if (cifras.length > 0) {
    frases.push(`${frases.length > 0 ? "Reporta" : `${sujeto} reporta`} ${listar(cifras)}.`);
  }

  if (cliente.bienes) {
    frases.push(
      `Dentro de su situación patrimonial reporta ${minusculaInicial(sinPuntoFinal(cliente.bienes))}.`,
    );
  }

  if (frases.length === 0) {
    frases.push(
      `${sujeto} nos compartió la información financiera que sirve de base para este análisis.`,
    );
  }
  return frases.join(" ");
}

function fraseMora(datos: DatosPropuesta): string {
  const total = datos.acreencias.length;
  const enMora = Math.min(datos.obligacionesConMoraMayor90, total);
  if (total === 0) return "No se registraron obligaciones.";
  if (total === 1) {
    return enMora === 1
      ? "La única obligación reportada presenta mora superior a 90 días."
      : "La única obligación reportada no presenta mora superior a 90 días.";
  }
  const totalEnLetras = numeroEnLetras(total);
  if (enMora === 0) {
    return `Ninguna de las ${totalEnLetras} obligaciones reportadas presenta mora superior a 90 días.`;
  }
  if (enMora === total) {
    return `Las ${totalEnLetras} obligaciones reportadas presentan mora superior a 90 días.`;
  }
  return `${capitalizar(numeroEnLetras(enMora))} de las ${totalEnLetras} obligaciones reportadas ${plural(enMora, "presenta", "presentan")} mora superior a 90 días.`;
}

function fraseElegibilidad(datos: DatosPropuesta): string {
  switch (datos.elegibilidad.estado) {
    case "elegible":
      return "Con base en la información suministrada, el cliente figura como ELEGIBLE para acudir al procedimiento de insolvencia, sujeto a la validación documental y jurídica correspondiente.";
    case "no_elegible":
      return "Con base en la información suministrada, el cliente figura como NO ELEGIBLE para acudir al procedimiento de insolvencia en las condiciones actuales; el análisis se complementará con la validación documental y jurídica correspondiente.";
    default:
      return "Con la información suministrada no fue posible determinar la elegibilidad del cliente; se requiere completar el diagnóstico.";
  }
}

function redactarSituacionLegal(datos: DatosPropuesta): string {
  const enMora = (a: Acreencia) => a.codigoMora === "mas_90_dias";
  const sinGarantia = datos.acreencias.filter((a) => a.codigoGarantia === "sin_garantia");
  const conGarantia = datos.acreencias.filter((a) => GARANTIAS_REALES.has(a.codigoGarantia));
  const porVerificar = datos.acreencias.filter((a) => a.codigoGarantia === "otra_verificar");
  const sinGarantiaEnMora = sinGarantia.filter(enMora);
  const sinGarantiaAlDia = sinGarantia.filter((a) => !enMora(a));

  const frases: string[] = [];
  if (sinGarantiaEnMora.length > 0) {
    const n = sinGarantiaEnMora.length;
    frases.push(
      `La situación jurídica del cliente está conformada por ${numeroEnLetras(n)} ${plural(n, "obligación sin garantía real que presenta", "obligaciones sin garantía real que presentan")} mora superior a 90 días: ${listar(sinGarantiaEnMora.map(acreedorYValor))}.`,
    );
  }
  if (sinGarantiaAlDia.length > 0) {
    const n = sinGarantiaAlDia.length;
    frases.push(
      `${frases.length > 0 ? "Registra además" : "El cliente registra"} ${numeroEnLetras(n)} ${plural(n, "obligación sin garantía real", "obligaciones sin garantía real")} al día o con mora inferior a 90 días: ${listar(sinGarantiaAlDia.map(acreedorYValor))}.`,
    );
  }
  if (conGarantia.length > 0) {
    const n = conGarantia.length;
    frases.push(
      `${frases.length > 0 ? "Adicionalmente, mantiene" : "El cliente mantiene"} ${numeroEnLetras(n)} ${plural(n, "obligación con garantía real", "obligaciones con garantía real")}: ${listar(
        conGarantia.map(
          (a) =>
            `una ${descripcionGarantia(a)} ${CLASE_EN_TEXTO[a.codigoClase]} con ${a.acreedor} por ${formatearPesos(a.valorAdeudado)}, ${descripcionMora(a)}`,
        ),
      )}.`,
    );
  }
  if (porVerificar.length > 0) {
    const n = porVerificar.length;
    frases.push(
      `${plural(n, "Existe una obligación cuya garantía está pendiente de verificar", `Existen ${numeroEnLetras(n)} obligaciones cuya garantía está pendiente de verificar`)}: ${listar(porVerificar.map(acreedorYValor))}.`,
    );
  }

  const bloques = frases.length > 0 ? [frases.join(" ")] : [];
  if (datos.observacionesJuridicas) bloques.push(normalizar(datos.observacionesJuridicas));
  if (datos.situacionUrgencia) {
    bloques.push(
      `Según lo manifestado en la reunión, la situación actual del cliente es la siguiente: ${conPuntoFinal(datos.situacionUrgencia)}`,
    );
  }
  if (datos.objetivoCliente) {
    bloques.push(
      `Teniendo en cuenta que su objetivo principal es ${minusculaInicial(sinPuntoFinal(datos.objetivoCliente))}, la estrategia jurídica debe orientarse a ese propósito.`,
    );
  }
  return bloques.join("\n\n");
}

function viaCentroConciliacion(valorCentro: number): string {
  return `El trámite se adelantará a través de un Centro de Conciliación, cuyo valor registrado es de ${formatearPesos(valorCentro)}. Una de las principales ventajas de esta alternativa es la agilidad: de acuerdo con la estrategia definida para el caso, con las primeras actuaciones del conciliador pueden comenzar a producirse los efectos legales correspondientes aproximadamente entre 15 y 20 días, entre ellos, según corresponda, la suspensión de embargos, libranzas, descuentos de nómina o de pensión, procesos y demás gestiones de cobro. Estos tiempos son aproximados y pueden variar.`;
}

const VIA_JUSTICIA_ORDINARIA =
  "Usted ha optado por acudir a la justicia ordinaria. Esta vía no genera costo de Centro de Conciliación, lo que representa un ahorro económico; sin embargo, es considerablemente más lenta: la admisión de la demanda y la expedición del auto correspondiente para producir los efectos sobre las medidas cautelares puede tomar aproximadamente entre 2 y 6 meses o incluso más. Estos tiempos dependen exclusivamente de la carga y gestión del despacho judicial correspondiente y no se encuentran bajo el control del abogado.";

const EFECTOS_SUSPENSION =
  "Con la primera actuación del conciliador se producen los efectos legales de suspensión que correspondan dentro del trámite, entre ellos, según el caso, la suspensión de cobros, procesos, descuentos de nómina o de pensión y libranzas.";

function redactarRecomendacion(datos: DatosPropuesta): string {
  const { contrato } = datos;
  const objetivo = datos.objetivoCliente
    ? ` y con el objetivo manifestado durante la reunión (${minusculaInicial(sinPuntoFinal(datos.objetivoCliente))})`
    : "";
  const base = `De acuerdo con la estructura de sus obligaciones${objetivo}`;
  const conGarantia = datos.acreencias.filter((a) => GARANTIAS_REALES.has(a.codigoGarantia));
  const sinGarantia = datos.acreencias.filter((a) => a.codigoGarantia === "sin_garantia");

  switch (contrato.codigoServicio) {
    case "liquidacion_patrimonial": {
      const bienes = datos.cliente.bienes
        ? `${base}, la alternativa recomendada es la liquidación patrimonial. Dentro de este procedimiento, los bienes que corresponda pueden destinarse al pago de los acreedores hasta donde alcance su valor, y el saldo restante de las obligaciones puede darse por terminado conforme a los efectos previstos por la ley. El tratamiento de los bienes reportados (${minusculaInicial(sinPuntoFinal(datos.cliente.bienes))}) deberá definirse dentro de la estrategia jurídica, de acuerdo con su voluntad y con el objetivo que usted nos ha manifestado.`
        : `${base}, la alternativa recomendada es la liquidación patrimonial. En el diagnóstico no se registraron bienes a su nombre, lo cual no impide acudir a este procedimiento: puede adelantarse aunque no existan activos realizables y constituye un escenario patrimonial favorable, porque no habrá bienes que deban destinarse al pago de los acreedores. Una vez culminado el procedimiento y cuando legalmente corresponda, las obligaciones insolutas pueden darse por terminadas conforme a la ley, salvo aquellas que por disposición legal tengan un tratamiento diferente.`;
      const via = contrato.requiereCentroConciliacion
        ? viaCentroConciliacion(contrato.valorCentroConciliacion)
        : VIA_JUSTICIA_ORDINARIA;
      return [bienes, via].join("\n\n");
    }
    case "acuerdo_pago":
      return [
        `${base}, la alternativa recomendada es un acuerdo de pago con sus acreedores. A través del Centro de Conciliación se les convocará formalmente con el objetivo de negociar conjuntamente sus obligaciones y buscar las mejores condiciones posibles según su capacidad real de pago: se procurará obtener, cuando resulte posible, ampliación de plazos, reducción o condonación de intereses, cuotas sostenibles y nuevas condiciones de pago. Se trata de una negociación sujeta a la aceptación de los acreedores y a las políticas de cada entidad, por lo que no es posible garantizar un resultado determinado.`,
        EFECTOS_SUSPENSION,
      ].join("\n\n");
    case "acuerdo_pago_bilateral": {
      const garantizadas =
        conGarantia.length > 0
          ? listar(conGarantia.map((a) => `la ${descripcionGarantia(a)} con ${a.acreedor}`))
          : "la obligación respaldada con garantía real";
      const nombresSinGarantia =
        sinGarantia.length > 0 ? ` —${listar(sinGarantia.map((a) => a.acreedor))}—` : "";
      return [
        `${base}, podemos estructurar una estrategia jurídica orientada a que usted continúe atendiendo normalmente ${garantizadas} y conserve el bien asociado, mientras se busca que las demás deudas que no cuentan con garantía real${nombresSinGarantia} puedan liquidarse conforme a la ley dentro del proceso de insolvencia. La estrategia se concentrará en preservar el bien que usted desea conservar y buscar una solución definitiva para las obligaciones sin garantía real.`,
        EFECTOS_SUSPENSION,
      ].join("\n\n");
    }
    default:
      return "Define el tipo de servicio en la matriz de diagnóstico para redactar la recomendación jurídica.";
  }
}

function redactarHonorarios(datos: DatosPropuesta): string {
  const c = datos.contrato;
  const cuotas =
    c.cuotasHonorarios > 1
      ? `El pago podrá realizarse en ${c.cuotasHonorarios} cuotas de ${formatearPesos(c.valorCuota)} cada una.`
      : "El pago se realizará en una sola cuota.";
  const honorarios = `Los honorarios profesionales corresponden a ${formatearPesos(c.valorHonorarios)}, equivalentes al ${formatearPorcentajeHonorarios(c.porcentajeHonorarios)} del pasivo reportado. ${cuotas}`;
  const centro = c.requiereCentroConciliacion
    ? `Para el trámite se requiere Centro de Conciliación, cuyo valor registrado es de ${formatearPesos(c.valorCentroConciliacion)}; corresponde a un costo adicional asociado al trámite.`
    : "La vía escogida es la justicia ordinaria, por lo que no se genera costo de Centro de Conciliación. Esto representa un ahorro económico, aunque el trámite puede ser considerablemente más lento.";
  const total = `El costo total estimado del proceso, de acuerdo con la información registrada en la matriz, corresponde a ${formatearPesos(c.costoProceso)}.`;
  return [honorarios, centro, total].join("\n\n");
}

/** Borrador automático de los puntos que el equipo puede ajustar. */
export function redactarBorrador(
  datos: DatosPropuesta,
  tratamiento: Tratamiento = "senor",
): BorradorPropuesta {
  return {
    situacionEconomica: redactarSituacionEconomica(datos, tratamiento),
    situacionLegal: redactarSituacionLegal(datos),
    recomendacion: redactarRecomendacion(datos),
    honorarios: redactarHonorarios(datos),
  };
}

/** True si el texto guardado coincide con el borrador (y por tanto puede seguir siendo automático). */
export function esTextoSugerido(texto: string | null, borrador: string): boolean {
  return texto === null || normalizar(texto) === normalizar(borrador);
}

// ---------------------------------------------------------------------------
// Contenido completo
// ---------------------------------------------------------------------------

export function construirContenidoPropuesta(
  datos: DatosPropuesta,
  redaccion: RedaccionPropuesta = REDACCION_VACIA,
  fecha: Date = new Date(),
): ContenidoPropuesta {
  const borrador = redactarBorrador(datos, redaccion.tratamiento);
  const texto = (campo: CampoRedaccion) => redaccion[campo]?.trim() || borrador[campo];

  return {
    titulo: fijos.TITULO_PROPUESTA,
    lugarYFecha: `${siteConfig.contact.city}, ${formatearFechaLarga(fecha)}`,
    tratamiento: INFO_TRATAMIENTO[redaccion.tratamiento].titulo,
    nombreCliente: normalizar(datos.cliente.nombre).toUpperCase(),
    saludo: fijos.SALUDO,
    introduccion: fijos.INTRODUCCION,
    situacionEconomica: parrafos(texto("situacionEconomica")),
    pasivo: `De acuerdo con la información suministrada, su pasivo total asciende a ${formatearPesos(datos.pasivoTotal)}. ${fijos.FRASE_DEUDAS}`,
    acreencias: datos.acreencias,
    pasivoTotal: datos.pasivoTotal,
    analisisAcreencias: [`${fraseMora(datos)} ${fraseElegibilidad(datos)}`],
    situacionLegal: parrafos(texto("situacionLegal")),
    recomendacion: parrafos(texto("recomendacion")),
    parrafoFijoRecomendacion: fijos.PARRAFO_FIJO_RECOMENDACION,
    honorarios: parrafos(texto("honorarios")),
    gestion: fijos.GESTION,
    idoneidad: {
      parrafos: fijos.IDONEIDAD,
      rutaConsulta: fijos.RUTA_CONSULTA,
      cierre: fijos.IDONEIDAD_CIERRE,
    },
    despedida: fijos.DESPEDIDA,
    cordialmente: fijos.CORDIALMENTE,
    firma: {
      nombre: siteConfig.lawyer.name.toUpperCase(),
      cargo: siteConfig.lawyer.title,
      empresa: siteConfig.name.toUpperCase(),
    },
    membrete: {
      telefonos: siteConfig.letterhead.phones.join("   "),
      email: siteConfig.letterhead.email,
      direccion: siteConfig.letterhead.address,
    },
    errores: datos.alertas.filter((a) => a.nivel === "error").map((a) => a.mensaje),
  };
}

/** "José Joaquín Ruiz Rojas" -> "Propuesta-Jose-Joaquin-Ruiz-Rojas.pdf" (solo ASCII, apto para cabeceras). */
export function nombreArchivoPropuesta(nombreCliente: string): string {
  const base = nombreCliente
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `Propuesta-${base || "cliente"}.pdf`;
}
