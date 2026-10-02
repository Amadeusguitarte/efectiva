/**
 * Fechas y línea de tiempo del CRM al estilo de Kommo: horas relativas («Ayer 9:51 p. m.»),
 * separadores de día («Hoy», «Ayer», «Martes, 22 de septiembre»), días en la etapa y el feed del
 * caso con mensajes, notas y eventos en orden cronológico.
 *
 * Todo se calcula en la hora de Colombia (UTC−5 todo el año, sin horario de verano) y con nombres
 * fijos, sin Intl: así el servidor y el navegador escriben exactamente lo mismo y no hay errores
 * de hidratación. Las funciones reciben `ahora` por la misma razón y para poder probarlas.
 */

const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type Fecha = string | Date;

/** Reloj de Bogotá en ese instante, leído con los métodos UTC de un Date desplazado. */
function enBogota(fecha: Fecha): Date {
  return new Date(new Date(fecha).getTime() + DESFASE_BOGOTA_MS);
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

/** Día calendario en Bogotá como «AAAA-MM-DD». */
export function claveDia(fecha: Fecha): string {
  return enBogota(fecha).toISOString().slice(0, 10);
}

/** Hora corta en Bogotá: «9:51 p. m.». */
export function horaCorta(fecha: Fecha): string {
  const reloj = enBogota(fecha);
  const horas = reloj.getUTCHours();
  const hora12 = ((horas + 11) % 12) + 1;
  return `${hora12}:${dosDigitos(reloj.getUTCMinutes())} ${horas < 12 ? "a. m." : "p. m."}`;
}

/** Fecha numérica como la de Kommo: «23/09/2026». */
export function fechaNumerica(fecha: Fecha): string {
  const [ano, mes, dia] = claveDia(fecha).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Días calendario (en Bogotá) de `desde` a `hasta`; 0 si son el mismo día. */
export function diasEntre(desde: Fecha, hasta: Fecha): number {
  const inicio = Date.parse(`${claveDia(desde)}T00:00:00Z`);
  const fin = Date.parse(`${claveDia(hasta)}T00:00:00Z`);
  return Math.round((fin - inicio) / MS_POR_DIA);
}

/**
 * Hora de la lista de conversaciones: solo la hora si es de hoy, «Ayer 9:51 p. m.» si fue ayer y
 * la fecha («23/09/2026») si es más antigua.
 */
export function horaLista(fecha: Fecha, ahora: Fecha): string {
  const dias = diasEntre(fecha, ahora);
  if (dias <= 0) return horaCorta(fecha);
  if (dias === 1) return `Ayer ${horaCorta(fecha)}`;
  return fechaNumerica(fecha);
}

/** Fecha y hora de un elemento del feed: «9:51 p. m.», «Ayer 9:51 p. m.» o «23/09/2026 9:51 p. m.». */
export function fechaHoraFeed(fecha: Fecha, ahora: Fecha): string {
  const dias = diasEntre(fecha, ahora);
  if (dias <= 0) return horaCorta(fecha);
  if (dias === 1) return `Ayer ${horaCorta(fecha)}`;
  return `${fechaNumerica(fecha)} ${horaCorta(fecha)}`;
}

/** Texto del separador de día del feed: «Hoy», «Ayer» o «Martes, 22 de septiembre». */
export function etiquetaDia(fecha: Fecha, ahora: Fecha): string {
  const dias = diasEntre(fecha, ahora);
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  const reloj = enBogota(fecha);
  const diaSemana = DIAS_SEMANA[reloj.getUTCDay()] ?? "";
  const texto = `${diaSemana}, ${reloj.getUTCDate()} de ${MESES[reloj.getUTCMonth()]}`;
  const conAno =
    claveDia(fecha).slice(0, 4) === claveDia(ahora).slice(0, 4)
      ? texto
      : `${texto} de ${reloj.getUTCFullYear()}`;
  return conAno.charAt(0).toUpperCase() + conAno.slice(1);
}

/**
 * Fecha sin hora (AAAA-MM-DD, como el plazo de una tarea o la fecha de la próxima acción):
 * «Hoy», «Mañana», «Ayer» o «23/09/2026». No pasa por la zona horaria: es un día calendario.
 */
export function textoFechaDia(fecha: string, ahora: Fecha): string {
  const dia = fecha.slice(0, 10);
  const diferencia = Math.round(
    (Date.parse(`${dia}T00:00:00Z`) - Date.parse(`${claveDia(ahora)}T00:00:00Z`)) / MS_POR_DIA,
  );
  if (diferencia === 0) return "Hoy";
  if (diferencia === 1) return "Mañana";
  if (diferencia === -1) return "Ayer";
  const [ano, mes, numero] = dia.split("-");
  return `${numero}/${mes}/${ano}`;
}

/** «hoy», «1 día», «9 días»: lo que lleva el caso en su etapa, como en Kommo. */
export function textoDiasEnEtapa(dias: number): string {
  if (dias <= 0) return "hoy";
  return dias === 1 ? "1 día" : `${dias} días`;
}

// ---------------------------------------------------------------------------
// Feed del caso
// ---------------------------------------------------------------------------

type ConFecha = { id: number; fecha: string };

export type ElementoFeed<M extends ConFecha, E extends ConFecha> =
  | { tipo: "dia"; clave: string; fecha: string }
  | { tipo: "mensaje"; clave: string; fecha: string; mensaje: M }
  | { tipo: "evento"; clave: string; fecha: string; evento: E };

/**
 * Une mensajes y eventos (notas, cambios de etapa, tareas…) en una sola línea de tiempo en orden
 * cronológico e inserta un separador antes del primer elemento de cada día. A igual fecha, el
 * mensaje va antes que el evento que pudo provocar.
 */
export function construirFeed<M extends ConFecha, E extends ConFecha>(
  mensajes: readonly M[],
  eventos: readonly E[],
): ElementoFeed<M, E>[] {
  const ordenados: ({ orden: 0; item: M } | { orden: 1; item: E })[] = [
    ...mensajes.map((item) => ({ orden: 0 as const, item })),
    ...eventos.map((item) => ({ orden: 1 as const, item })),
  ];
  ordenados.sort(
    (a, b) =>
      Date.parse(a.item.fecha) - Date.parse(b.item.fecha) ||
      a.orden - b.orden ||
      a.item.id - b.item.id,
  );

  const resultado: ElementoFeed<M, E>[] = [];
  let diaAnterior: string | null = null;
  for (const entrada of ordenados) {
    const { fecha, id } = entrada.item;
    const dia = claveDia(fecha);
    if (dia !== diaAnterior) {
      resultado.push({ tipo: "dia", clave: `d${dia}`, fecha });
      diaAnterior = dia;
    }
    resultado.push(
      entrada.orden === 0
        ? { tipo: "mensaje", clave: `m${id}`, fecha, mensaje: entrada.item }
        : { tipo: "evento", clave: `e${id}`, fecha, evento: entrada.item },
    );
  }
  return resultado;
}

/** Código corto y estable de un caso para mostrar («Caso #3F9A1C»), derivado de su id. */
export function codigoCaso(id: string): string {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}
