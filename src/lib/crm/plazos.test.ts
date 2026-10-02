import { describe, expect, it } from "vitest";

import {
  agruparTareasPorPlazo,
  diasEntre,
  fechaBogota,
  fechaCorta,
  fechaTarjeta,
  horaBogota,
  plazoDeTarea,
  vencimientoRelativo,
} from "./plazos";

// 2026-10-02 es viernes.
const HOY = "2026-10-02";

describe("fechaBogota", () => {
  it("usa la hora de Colombia (UTC−5)", () => {
    expect(fechaBogota("2026-10-03T04:59:00Z")).toBe("2026-10-02");
    expect(fechaBogota("2026-10-03T05:00:00Z")).toBe("2026-10-03");
  });
});

describe("diasEntre", () => {
  it("cuenta días de calendario en ambos sentidos", () => {
    expect(diasEntre("2026-10-02", "2026-10-02")).toBe(0);
    expect(diasEntre("2026-10-02", "2026-10-05")).toBe(3);
    expect(diasEntre("2026-10-02", "2026-09-30")).toBe(-2);
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
  });
});

describe("fechaCorta y horaBogota", () => {
  it("omite el año solo si es el de referencia", () => {
    expect(fechaCorta("2026-09-28", HOY)).toBe("28 sept");
    expect(fechaCorta("2027-01-05", HOY)).toBe("5 ene 2027");
  });

  it("escribe la hora en formato de 12 horas", () => {
    expect(horaBogota("2026-10-02T02:51:00Z")).toBe("9:51 p. m.");
    expect(horaBogota("2026-10-02T05:05:00Z")).toBe("12:05 a. m.");
    expect(horaBogota("2026-10-02T17:00:00Z")).toBe("12:00 p. m.");
  });
});

describe("fechaTarjeta", () => {
  it("muestra Hoy y Ayer con la hora y, antes, solo el día", () => {
    expect(fechaTarjeta("2026-10-02T14:30:00Z", HOY)).toBe("Hoy 9:30 a. m.");
    // 9:51 p. m. del 1 de octubre en Bogotá.
    expect(fechaTarjeta("2026-10-02T02:51:00Z", HOY)).toBe("Ayer 9:51 p. m.");
    expect(fechaTarjeta("2026-09-25T15:00:00Z", HOY)).toBe("25 sept");
    expect(fechaTarjeta("2025-12-20T15:00:00Z", HOY)).toBe("20 dic 2025");
  });
});

describe("plazoDeTarea", () => {
  it("clasifica por vencimiento con la semana de lunes a domingo", () => {
    expect(plazoDeTarea(null, HOY)).toBe("sin_fecha");
    expect(plazoDeTarea("2026-10-01", HOY)).toBe("vencidas");
    expect(plazoDeTarea("2026-10-02", HOY)).toBe("hoy");
    expect(plazoDeTarea("2026-10-03", HOY)).toBe("manana");
    expect(plazoDeTarea("2026-10-04", HOY)).toBe("semana");
    expect(plazoDeTarea("2026-10-05", HOY)).toBe("despues");
  });

  it("el domingo no queda «esta semana» después de mañana", () => {
    expect(plazoDeTarea("2026-10-05", "2026-10-04")).toBe("manana");
    expect(plazoDeTarea("2026-10-06", "2026-10-04")).toBe("despues");
  });

  it("el miércoles, esta semana llega hasta el domingo", () => {
    expect(plazoDeTarea("2026-10-04", "2026-09-30")).toBe("semana");
    expect(plazoDeTarea("2026-10-05", "2026-09-30")).toBe("despues");
  });
});

describe("vencimientoRelativo", () => {
  it("habla de vencidas solo si la tarea está pendiente", () => {
    expect(vencimientoRelativo("2026-09-30", HOY)).toEqual({
      texto: "Vencida hace 2 días",
      tono: "vencida",
    });
    expect(vencimientoRelativo("2026-10-01", HOY)).toEqual({
      texto: "Vencida ayer",
      tono: "vencida",
    });
    expect(vencimientoRelativo("2026-10-01", HOY, false)).toEqual({
      texto: "Ayer",
      tono: "normal",
    });
    expect(vencimientoRelativo("2026-09-20", HOY, false).texto).toBe("20 sept");
  });

  it("nombra hoy, mañana y los próximos días", () => {
    expect(vencimientoRelativo("2026-10-02", HOY)).toEqual({ texto: "Hoy", tono: "hoy" });
    expect(vencimientoRelativo("2026-10-03", HOY)).toEqual({ texto: "Mañana", tono: "pronto" });
    expect(vencimientoRelativo("2026-10-08", HOY).texto).toBe("jue 8 oct");
    expect(vencimientoRelativo("2026-10-20", HOY).texto).toBe("20 oct");
    expect(vencimientoRelativo(null, HOY)).toEqual({ texto: "Sin fecha", tono: "sin_fecha" });
  });
});

describe("agruparTareasPorPlazo", () => {
  const tarea = (id: string, venceAt: string | null, estado = "pendiente" as const) => ({
    id,
    venceAt,
    estado,
  });

  it("agrupa en el orden de Kommo y omite los grupos vacíos", () => {
    const grupos = agruparTareasPorPlazo(
      [
        tarea("a", "2026-09-29"),
        tarea("b", "2026-10-02"),
        tarea("c", "2026-10-30"),
        tarea("d", null),
        tarea("e", "2026-10-01"),
        { id: "f", venceAt: "2026-09-01", estado: "completada" as const },
        { id: "g", venceAt: null, estado: "cancelada" as const },
      ],
      HOY,
    );
    expect(grupos.map((g) => [g.clave, g.etiqueta, g.tareas.map((t) => t.id)])).toEqual([
      ["vencidas", "Vencidas", ["a", "e"]],
      ["hoy", "Hoy", ["b"]],
      ["despues", "Más adelante", ["c"]],
      ["sin_fecha", "Sin fecha", ["d"]],
      ["completadas", "Completadas", ["f"]],
      ["canceladas", "Canceladas", ["g"]],
    ]);
  });

  it("devuelve una lista vacía si no hay tareas", () => {
    expect(agruparTareasPorPlazo([], HOY)).toEqual([]);
  });
});
