import { describe, expect, it } from "vitest";

import {
  claveDia,
  codigoCaso,
  construirFeed,
  diasEntre,
  etiquetaDia,
  fechaHoraFeed,
  fechaNumerica,
  horaCorta,
  horaLista,
  textoDiasEnEtapa,
  textoFechaDia,
} from "./linea-tiempo";

// 2 de octubre de 2026, 10:00 a. m. en Bogotá (UTC−5).
const AHORA = "2026-10-02T15:00:00Z";

describe("fechas al estilo Kommo", () => {
  it("usa el día calendario de Bogotá", () => {
    // 03:00 UTC del 2 de octubre todavía es 1 de octubre en Bogotá.
    expect(claveDia("2026-10-02T03:00:00Z")).toBe("2026-10-01");
    expect(claveDia("2026-10-02T05:00:00Z")).toBe("2026-10-02");
  });

  it("escribe la hora en formato de 12 horas", () => {
    expect(horaCorta("2026-10-02T02:51:00Z")).toBe("9:51 p. m.");
    expect(horaCorta("2026-10-02T05:05:00Z")).toBe("12:05 a. m.");
    expect(horaCorta("2026-10-02T17:00:00Z")).toBe("12:00 p. m.");
    expect(fechaNumerica("2026-09-23T20:23:00Z")).toBe("23/09/2026");
  });

  it("cuenta días calendario, no bloques de 24 horas", () => {
    expect(diasEntre("2026-10-02T04:59:00Z", AHORA)).toBe(1);
    expect(diasEntre("2026-10-02T05:00:00Z", AHORA)).toBe(0);
    expect(diasEntre("2026-09-23T15:00:00Z", AHORA)).toBe(9);
  });

  it("formatea la hora de la lista: hoy, ayer o fecha", () => {
    expect(horaLista("2026-10-02T14:30:00Z", AHORA)).toBe("9:30 a. m.");
    expect(horaLista("2026-10-02T02:51:00Z", AHORA)).toBe("Ayer 9:51 p. m.");
    expect(horaLista("2026-09-23T20:23:00Z", AHORA)).toBe("23/09/2026");
  });

  it("formatea la hora del feed con fecha completa si es antigua", () => {
    expect(fechaHoraFeed("2026-10-02T14:30:00Z", AHORA)).toBe("9:30 a. m.");
    expect(fechaHoraFeed("2026-10-01T15:00:00Z", AHORA)).toBe("Ayer 10:00 a. m.");
    expect(fechaHoraFeed("2026-09-23T20:23:00Z", AHORA)).toBe("23/09/2026 3:23 p. m.");
  });

  it("nombra los separadores de día", () => {
    expect(etiquetaDia("2026-10-02T14:30:00Z", AHORA)).toBe("Hoy");
    expect(etiquetaDia("2026-10-01T14:30:00Z", AHORA)).toBe("Ayer");
    expect(etiquetaDia("2026-09-22T14:30:00Z", AHORA)).toBe("Martes, 22 de septiembre");
    expect(etiquetaDia("2025-12-31T14:30:00Z", AHORA)).toBe("Miércoles, 31 de diciembre de 2025");
  });

  it("escribe las fechas sin hora sin correrlas de día", () => {
    expect(textoFechaDia("2026-10-02", AHORA)).toBe("Hoy");
    expect(textoFechaDia("2026-10-03", AHORA)).toBe("Mañana");
    expect(textoFechaDia("2026-10-01", AHORA)).toBe("Ayer");
    expect(textoFechaDia("2026-09-23", AHORA)).toBe("23/09/2026");
    // A las 11 p. m. de Bogotá ya es el día siguiente en UTC, pero «hoy» sigue siendo el 2.
    expect(textoFechaDia("2026-10-02", "2026-10-03T04:00:00Z")).toBe("Hoy");
  });

  it("escribe los días en la etapa", () => {
    expect(textoDiasEnEtapa(0)).toBe("hoy");
    expect(textoDiasEnEtapa(1)).toBe("1 día");
    expect(textoDiasEnEtapa(9)).toBe("9 días");
  });
});

describe("feed del caso", () => {
  const mensajes = [
    { id: 1, fecha: "2026-09-30T15:00:00Z", texto: "Hola" },
    { id: 2, fecha: "2026-10-02T14:00:00Z", texto: "¿Me ayudan?" },
  ];
  const eventos = [
    { id: 10, fecha: "2026-10-02T14:00:00Z", texto: "Pasó a Contactado" },
    { id: 11, fecha: "2026-09-30T16:00:00Z", texto: "Nota" },
  ];

  it("une mensajes y eventos en orden y separa los días", () => {
    const feed = construirFeed(mensajes, eventos);
    expect(feed.map((e) => e.clave)).toEqual([
      "d2026-09-30",
      "m1",
      "e11",
      "d2026-10-02",
      "m2",
      "e10",
    ]);
  });

  it("no inserta separadores sin elementos", () => {
    expect(construirFeed([], [])).toEqual([]);
  });

  it("deriva un código corto y estable del id del caso", () => {
    expect(codigoCaso("3f9a1c2b-0000-4000-8000-000000000000")).toBe("3F9A1C");
  });
});
