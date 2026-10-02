import { describe, expect, it } from "vitest";

import {
  contarCasosActivos,
  filtrarCasos,
  indicadorTareas,
  ordenarEtapas,
  totalesPorColumna,
} from "./pipeline";

const HOY = "2026-10-02";

const etapas = [
  { id: "cliente", orden: 6, cierre: "ganado" as const },
  { id: "nuevo", orden: 1, cierre: null },
  { id: "descartado", orden: 2, cierre: "perdido" as const },
  { id: "contactado", orden: 2, cierre: null },
];

const caso = (
  etapaId: string,
  extra: Partial<{ sinResponder: boolean; tareasPendientes: number; tareasVencidas: number }> = {},
) => ({ etapaId, sinResponder: false, tareasPendientes: 0, tareasVencidas: 0, ...extra });

describe("ordenarEtapas", () => {
  it("deja las de cierre al final: primero ganado y luego perdido", () => {
    expect(ordenarEtapas(etapas).map((e) => e.id)).toEqual([
      "nuevo",
      "contactado",
      "cliente",
      "descartado",
    ]);
  });
});

describe("totalesPorColumna", () => {
  it("cuenta casos, sin responder, con vencidas y sin tareas por etapa", () => {
    const totales = totalesPorColumna(etapas, [
      caso("nuevo", { sinResponder: true }),
      caso("nuevo", { tareasPendientes: 2, tareasVencidas: 1 }),
      caso("contactado", { sinResponder: true, tareasPendientes: 1 }),
      caso("etapa-que-no-existe"),
    ]);
    expect(totales.nuevo).toEqual({
      casos: 2,
      sinResponder: 1,
      conTareasVencidas: 1,
      sinTareas: 1,
    });
    expect(totales.contactado).toEqual({
      casos: 1,
      sinResponder: 1,
      conTareasVencidas: 0,
      sinTareas: 0,
    });
    expect(totales.cliente).toEqual({
      casos: 0,
      sinResponder: 0,
      conTareasVencidas: 0,
      sinTareas: 0,
    });
    expect(Object.keys(totales)).toHaveLength(4);
  });
});

describe("contarCasosActivos", () => {
  it("no cuenta los casos en etapas de cierre", () => {
    expect(
      contarCasosActivos(etapas, [
        caso("nuevo"),
        caso("cliente"),
        caso("descartado"),
        caso("contactado"),
      ]),
    ).toBe(2);
  });
});

describe("filtrarCasos", () => {
  const casos = [
    caso("nuevo", { sinResponder: true }),
    caso("nuevo", { tareasPendientes: 1, tareasVencidas: 1 }),
    caso("nuevo", { tareasPendientes: 1 }),
  ];

  it("filtra los sin responder y por estado de las tareas", () => {
    expect(filtrarCasos(casos, {})).toHaveLength(3);
    expect(filtrarCasos(casos, { sinResponder: true })).toEqual([casos[0]]);
    expect(filtrarCasos(casos, { tareas: "sin" })).toEqual([casos[0]]);
    expect(filtrarCasos(casos, { tareas: "vencidas" })).toEqual([casos[1]]);
    expect(filtrarCasos(casos, { sinResponder: true, tareas: "vencidas" })).toEqual([]);
  });
});

describe("indicadorTareas", () => {
  it("muestra «Sin tareas» si no hay pendientes", () => {
    expect(indicadorTareas(caso("nuevo"), null, HOY)).toEqual({
      tono: "sin_tareas",
      texto: "Sin tareas",
      detalle: null,
      mas: 0,
    });
  });

  it("usa la tarea más próxima: vencida, de hoy o futura", () => {
    expect(
      indicadorTareas(
        { tareasPendientes: 2, tareasVencidas: 1 },
        { titulo: "Llamar", venceAt: "2026-09-30" },
        HOY,
      ),
    ).toEqual({ tono: "vencida", texto: "Vencida hace 2 días", detalle: "Llamar", mas: 1 });
    expect(
      indicadorTareas(
        { tareasPendientes: 1, tareasVencidas: 0 },
        { titulo: "Revisar", venceAt: HOY },
        HOY,
      ),
    ).toEqual({ tono: "hoy", texto: "Hoy", detalle: "Revisar", mas: 0 });
    expect(
      indicadorTareas(
        { tareasPendientes: 1, tareasVencidas: 0 },
        { titulo: "Seguimiento", venceAt: "2026-10-03" },
        HOY,
      ),
    ).toEqual({ tono: "pendiente", texto: "Mañana", detalle: "Seguimiento", mas: 0 });
  });

  it("sin la tarea cargada, resume con los conteos del caso", () => {
    expect(indicadorTareas({ tareasPendientes: 3, tareasVencidas: 2 }, null, HOY)).toEqual({
      tono: "vencida",
      texto: "2 tareas vencidas",
      detalle: null,
      mas: 1,
    });
    expect(indicadorTareas({ tareasPendientes: 1, tareasVencidas: 0 }, null, HOY)).toEqual({
      tono: "pendiente",
      texto: "1 tarea",
      detalle: null,
      mas: 0,
    });
  });
});
