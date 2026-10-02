import type { Route } from "next";

/**
 * Hojas del dashboard de diagnóstico de un cliente, en el orden de la barra de pestañas. Equivalen
 * a las hojas del Excel original: «Diagnóstico Cliente», «DATOS PROPUESTA» y «Listas».
 *
 * `segmento` es la carpeta de la ruta bajo `/admin/clientes/[id]/diagnostico` ("" para la matriz);
 * `etiquetaCorta` se usa en pantallas angostas.
 */
export const HOJAS_DIAGNOSTICO = [
  {
    valor: "diagnostico",
    etiqueta: "Diagnóstico",
    etiquetaCorta: "Diagnóstico",
    titulo: "Matriz de diagnóstico",
    segmento: "",
  },
  {
    valor: "datos-propuesta",
    etiqueta: "Datos para la propuesta",
    etiquetaCorta: "Datos propuesta",
    titulo: "Datos para la propuesta",
    segmento: "datos-propuesta",
  },
  {
    valor: "listas",
    etiqueta: "Listas",
    etiquetaCorta: "Listas",
    titulo: "Listas",
    segmento: "listas",
  },
] as const;

export type HojaDiagnostico = (typeof HOJAS_DIAGNOSTICO)[number]["valor"];

export const INFO_HOJA = Object.fromEntries(HOJAS_DIAGNOSTICO.map((h) => [h.valor, h])) as {
  [K in HojaDiagnostico]: Extract<(typeof HOJAS_DIAGNOSTICO)[number], { valor: K }>;
};

/** Ruta de una hoja del diagnóstico de un cliente. */
export function rutaHoja(clienteId: string, hoja: HojaDiagnostico): Route {
  const { segmento } = INFO_HOJA[hoja];
  const base = `/admin/clientes/${encodeURIComponent(clienteId)}/diagnostico`;
  return (segmento ? `${base}/${segmento}` : base) as Route;
}
