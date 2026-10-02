import type { CierreEtapa } from "@/lib/crm/catalogos";
import { vencimientoRelativo } from "@/lib/crm/plazos";

/**
 * Lógica pura del tablero del pipeline (vista «Leads» de Kommo): orden de las columnas,
 * totales de cada una, filtros rápidos y el indicador de tareas de las tarjetas.
 */

type EtapaBase = { id: string; orden: number; cierre: CierreEtapa | null };

type CasoBase = {
  etapaId: string;
  sinResponder: boolean;
  tareasPendientes: number;
  tareasVencidas: number;
};

const PESO_CIERRE: Record<CierreEtapa, number> = { ganado: 1, perdido: 2 };

/** Etapas en curso por su orden y, al final, las de cierre (primero ganado, luego perdido). */
export function ordenarEtapas<T extends EtapaBase>(etapas: readonly T[]): T[] {
  return etapas
    .map((etapa, indice) => ({ etapa, indice }))
    .sort((a, b) => {
      const pesoA = a.etapa.cierre ? PESO_CIERRE[a.etapa.cierre] : 0;
      const pesoB = b.etapa.cierre ? PESO_CIERRE[b.etapa.cierre] : 0;
      return pesoA - pesoB || a.etapa.orden - b.etapa.orden || a.indice - b.indice;
    })
    .map(({ etapa }) => etapa);
}

export type TotalesColumna = {
  casos: number;
  sinResponder: number;
  /** Casos con al menos una tarea vencida. */
  conTareasVencidas: number;
  sinTareas: number;
};

const TOTALES_VACIOS: TotalesColumna = {
  casos: 0,
  sinResponder: 0,
  conTareasVencidas: 0,
  sinTareas: 0,
};

/** Totales del encabezado de cada columna; las etapas sin casos quedan en cero. */
export function totalesPorColumna(
  etapas: readonly { id: string }[],
  casos: readonly CasoBase[],
): Record<string, TotalesColumna> {
  const totales: Record<string, TotalesColumna> = {};
  for (const etapa of etapas) totales[etapa.id] = { ...TOTALES_VACIOS };
  for (const caso of casos) {
    const columna = totales[caso.etapaId];
    if (!columna) continue;
    columna.casos += 1;
    if (caso.sinResponder) columna.sinResponder += 1;
    if (caso.tareasVencidas > 0) columna.conTareasVencidas += 1;
    if (caso.tareasPendientes === 0) columna.sinTareas += 1;
  }
  return totales;
}

/** Casos que no están en una etapa de cierre (lo que Kommo llama «leads activos»). */
export function contarCasosActivos(etapas: readonly EtapaBase[], casos: readonly CasoBase[]) {
  const cierre = new Set(etapas.filter((e) => e.cierre).map((e) => e.id));
  return casos.filter((c) => !cierre.has(c.etapaId)).length;
}

export type FiltroTareasPipeline = "sin" | "vencidas";

/** Filtros rápidos que no resuelve la consulta: solo sin responder y estado de las tareas. */
export function filtrarCasos<T extends CasoBase>(
  casos: readonly T[],
  filtros: { sinResponder?: boolean; tareas?: FiltroTareasPipeline },
): T[] {
  return casos.filter((caso) => {
    if (filtros.sinResponder && !caso.sinResponder) return false;
    if (filtros.tareas === "sin" && caso.tareasPendientes > 0) return false;
    if (filtros.tareas === "vencidas" && caso.tareasVencidas === 0) return false;
    return true;
  });
}

export type IndicadorTareas = {
  tono: "vencida" | "hoy" | "pendiente" | "sin_tareas";
  /** «Sin tareas», «Vencida hace 2 días», «Hoy», «Mañana», «jue 8 oct»… */
  texto: string;
  /** Título de la tarea más próxima, si se conoce. */
  detalle: string | null;
  /** Tareas pendientes además de la que se muestra. */
  mas: number;
};

/**
 * Indicador de tareas de la tarjeta, como el de Kommo: «Sin tareas» en ámbar, la tarea vencida
 * en rojo, la de hoy en verde y la siguiente en gris. `proxima` es la tarea pendiente que vence
 * antes (o null si no se cargó); los conteos del caso mandan si no coinciden.
 */
export function indicadorTareas(
  caso: Pick<CasoBase, "tareasPendientes" | "tareasVencidas">,
  proxima: { titulo: string; venceAt: string | null } | null,
  hoy: string,
): IndicadorTareas {
  if (caso.tareasPendientes === 0) {
    return { tono: "sin_tareas", texto: "Sin tareas", detalle: null, mas: 0 };
  }
  const mas = Math.max(0, caso.tareasPendientes - 1);
  if (!proxima) {
    return caso.tareasVencidas > 0
      ? {
          tono: "vencida",
          texto:
            caso.tareasVencidas === 1
              ? "1 tarea vencida"
              : `${caso.tareasVencidas} tareas vencidas`,
          detalle: null,
          mas: Math.max(0, caso.tareasPendientes - caso.tareasVencidas),
        }
      : {
          tono: "pendiente",
          texto: caso.tareasPendientes === 1 ? "1 tarea" : `${caso.tareasPendientes} tareas`,
          detalle: null,
          mas: 0,
        };
  }
  const vencimiento = vencimientoRelativo(proxima.venceAt, hoy);
  const tono =
    vencimiento.tono === "vencida" || caso.tareasVencidas > 0
      ? "vencida"
      : vencimiento.tono === "hoy"
        ? "hoy"
        : "pendiente";
  return { tono, texto: vencimiento.texto, detalle: proxima.titulo, mas };
}
