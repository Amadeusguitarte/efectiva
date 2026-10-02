import type { EstadoTarea } from "@/lib/crm/catalogos";

/**
 * Fechas del CRM al estilo de Kommo: plazos de las tareas («Vencidas», «Hoy», «Mañana»…),
 * vencimientos relativos («Vencida hace 2 días») y fechas cortas de las tarjetas («Hoy 9:51 a. m.»).
 *
 * Todo se calcula en la hora de Colombia (UTC−5 todo el año, sin horario de verano) y con
 * nombres fijos de meses y días: así el servidor y el navegador escriben exactamente lo mismo.
 */

const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
/** Empieza el lunes, como la semana en Colombia. */
const DIAS_SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

/** Fecha (AAAA-MM-DD) que marca el reloj en Bogotá en ese instante. */
export function fechaBogota(instante: Date | string = new Date()): string {
  const ms = new Date(instante).getTime() + DESFASE_BOGOTA_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

function aDiaUtc(fecha: string): number {
  const [anio = 0, mes = 1, dia = 1] = fecha.slice(0, 10).split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

/** Días de calendario de `desde` a `hasta` (AAAA-MM-DD): positivo si `hasta` es posterior. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aDiaUtc(hasta) - aDiaUtc(desde)) / DIA_MS);
}

/** Posición en la semana de una fecha AAAA-MM-DD: 0 = lunes … 6 = domingo. */
function posicionEnSemana(fecha: string): number {
  return (new Date(aDiaUtc(fecha)).getUTCDay() + 6) % 7;
}

/** «8 oct», o «8 oct 2027» si no es del año de referencia. */
export function fechaCorta(fecha: string, hoy: string): string {
  const [anio, mes = 1, dia = 1] = fecha.slice(0, 10).split("-").map(Number);
  const base = `${dia} ${MESES[mes - 1]}`;
  return String(anio) === hoy.slice(0, 4) ? base : `${base} ${anio}`;
}

/** Hora de Bogotá en formato de 12 horas: «9:51 p. m.». */
export function horaBogota(instante: Date | string): string {
  const fecha = new Date(new Date(instante).getTime() + DESFASE_BOGOTA_MS);
  const horas = fecha.getUTCHours();
  const minutos = String(fecha.getUTCMinutes()).padStart(2, "0");
  return `${horas % 12 || 12}:${minutos} ${horas < 12 ? "a. m." : "p. m."}`;
}

/**
 * Fecha de la esquina de una tarjeta del pipeline, como Kommo: «Hoy 9:51 a. m.»,
 * «Ayer 4:10 p. m.» y, para lo anterior, solo el día («28 sept»).
 */
export function fechaTarjeta(instante: string, hoy: string): string {
  const dia = fechaBogota(instante);
  const dias = diasEntre(dia, hoy);
  if (dias === 0) return `Hoy ${horaBogota(instante)}`;
  if (dias === 1) return `Ayer ${horaBogota(instante)}`;
  return fechaCorta(dia, hoy);
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export type Plazo = "vencidas" | "hoy" | "manana" | "semana" | "despues" | "sin_fecha";

export const ETIQUETA_PLAZO: Record<Plazo, string> = {
  vencidas: "Vencidas",
  hoy: "Hoy",
  manana: "Mañana",
  semana: "Esta semana",
  despues: "Más adelante",
  sin_fecha: "Sin fecha",
};

/** Plazo de una tarea pendiente según su vencimiento. «Esta semana» llega hasta el domingo. */
export function plazoDeTarea(venceAt: string | null, hoy: string): Plazo {
  if (!venceAt) return "sin_fecha";
  const dias = diasEntre(hoy, venceAt);
  if (dias < 0) return "vencidas";
  if (dias === 0) return "hoy";
  if (dias === 1) return "manana";
  if (dias <= 6 - posicionEnSemana(hoy)) return "semana";
  return "despues";
}

export type TonoVencimiento = "vencida" | "hoy" | "pronto" | "normal" | "sin_fecha";

/**
 * Vencimiento de una tarea en palabras: «Vencida hace 2 días», «Vencida ayer», «Hoy», «Mañana»,
 * el día de la semana si cae en los próximos días («jue 8 oct») o la fecha («8 oct»). Una tarea
 * que ya no está pendiente nunca aparece como vencida.
 */
export function vencimientoRelativo(
  venceAt: string | null,
  hoy: string,
  pendiente = true,
): { texto: string; tono: TonoVencimiento } {
  if (!venceAt) return { texto: "Sin fecha", tono: "sin_fecha" };
  const dias = diasEntre(hoy, venceAt);
  if (dias < 0) {
    if (!pendiente)
      return { texto: dias === -1 ? "Ayer" : fechaCorta(venceAt, hoy), tono: "normal" };
    return {
      texto: dias === -1 ? "Vencida ayer" : `Vencida hace ${-dias} días`,
      tono: "vencida",
    };
  }
  if (dias === 0) return { texto: "Hoy", tono: "hoy" };
  if (dias === 1) return { texto: "Mañana", tono: "pronto" };
  if (dias <= 6) {
    return {
      texto: `${DIAS_SEMANA[posicionEnSemana(venceAt)]} ${fechaCorta(venceAt, hoy)}`,
      tono: "normal",
    };
  }
  return { texto: fechaCorta(venceAt, hoy), tono: "normal" };
}

export type ClaveGrupoTareas = Plazo | "completadas" | "canceladas";

export type GrupoTareas<T> = { clave: ClaveGrupoTareas; etiqueta: string; tareas: T[] };

const ORDEN_GRUPOS: readonly ClaveGrupoTareas[] = [
  "vencidas",
  "hoy",
  "manana",
  "semana",
  "despues",
  "sin_fecha",
  "completadas",
  "canceladas",
];

const ETIQUETA_GRUPO: Record<ClaveGrupoTareas, string> = {
  ...ETIQUETA_PLAZO,
  completadas: "Completadas",
  canceladas: "Canceladas",
};

/**
 * Agrupa las tareas como la lista de Kommo: las pendientes por plazo (vencidas, hoy, mañana,
 * esta semana, más adelante, sin fecha) y después las completadas y las canceladas. Dentro de
 * cada grupo se respeta el orden recibido; solo se devuelven los grupos con tareas.
 */
export function agruparTareasPorPlazo<T extends { venceAt: string | null; estado: EstadoTarea }>(
  tareas: readonly T[],
  hoy: string,
): GrupoTareas<T>[] {
  const grupos = new Map<ClaveGrupoTareas, T[]>();
  for (const tarea of tareas) {
    const clave: ClaveGrupoTareas =
      tarea.estado === "completada"
        ? "completadas"
        : tarea.estado === "cancelada"
          ? "canceladas"
          : plazoDeTarea(tarea.venceAt, hoy);
    const lista = grupos.get(clave);
    if (lista) lista.push(tarea);
    else grupos.set(clave, [tarea]);
  }
  return ORDEN_GRUPOS.flatMap((clave) => {
    const lista = grupos.get(clave);
    return lista ? [{ clave, etiqueta: ETIQUETA_GRUPO[clave], tareas: lista }] : [];
  });
}
