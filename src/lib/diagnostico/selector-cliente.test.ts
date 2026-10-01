import { describe, expect, it } from "vitest";

import { detalleCliente, masRecientes, moverIndice, ultimaActividad } from "./selector-cliente";

const ana = {
  nombre: "Ana Pérez",
  tipoDocumento: "CC",
  numeroDocumento: "1020304050",
  email: "ana.perez@correo.com",
  telefono: "3001234567",
};

describe("detalleCliente", () => {
  it("muestra el documento si no hay búsqueda", () => {
    expect(detalleCliente(ana)).toBe("CC 1020304050");
    expect(detalleCliente(ana, "   ")).toBe("CC 1020304050");
  });

  it("muestra el documento si el término está en el nombre, aunque también esté en el correo", () => {
    expect(detalleCliente(ana, "Pérez")).toBe("CC 1020304050");
    expect(detalleCliente(ana, "ana")).toBe("CC 1020304050");
    expect(detalleCliente(ana, "ANA P")).toBe("CC 1020304050");
  });

  it("muestra el documento si el término está en él", () => {
    expect(detalleCliente(ana, "3040")).toBe("CC 1020304050");
  });

  it("muestra el correo o el teléfono si la coincidencia solo está ahí", () => {
    expect(detalleCliente(ana, "CORREO")).toBe("ana.perez@correo.com");
    // Sin tilde no coincide con el nombre «Pérez» (igual que ILIKE), sí con el correo.
    expect(detalleCliente(ana, "perez")).toBe("ana.perez@correo.com");
    expect(detalleCliente(ana, " 300123 ")).toBe("3001234567");
  });

  it("usa el correo si no hay documento", () => {
    const sinDocumento = { ...ana, tipoDocumento: null, numeroDocumento: "  ", telefono: null };
    expect(detalleCliente(sinDocumento)).toBe("ana.perez@correo.com");
    expect(detalleCliente(sinDocumento, "Ana")).toBe("ana.perez@correo.com");
    expect(detalleCliente(sinDocumento, "300")).toBe("ana.perez@correo.com");
  });

  it("muestra el número aunque falte el tipo de documento", () => {
    expect(detalleCliente({ ...ana, tipoDocumento: null })).toBe("1020304050");
  });
});

describe("ultimaActividad", () => {
  it("toma la fecha más reciente e ignora las vacías o inválidas", () => {
    expect(
      ultimaActividad(
        "2026-09-20T10:00:00+00:00",
        null,
        "2026-09-25T08:30:00.123456+00:00",
        undefined,
        "no es fecha",
      ),
    ).toBe(Date.parse("2026-09-25T08:30:00.123Z"));
    expect(ultimaActividad(null, undefined)).toBe(0);
  });
});

describe("masRecientes", () => {
  it("une las listas sin repetir y ordena por actividad", () => {
    const porFicha = [
      { id: "a", actividad: 50 },
      { id: "b", actividad: 40 },
    ];
    const porMatriz = [
      { id: "c", actividad: 90 },
      { id: "a", actividad: 50 },
    ];
    expect(masRecientes([porFicha, porMatriz], 8).map((c) => c.id)).toEqual(["c", "a", "b"]);
    expect(masRecientes([porFicha, porMatriz], 2).map((c) => c.id)).toEqual(["c", "a"]);
    expect(masRecientes([], 8)).toEqual([]);
  });
});

describe("moverIndice", () => {
  it("baja y sube con vuelta al otro extremo", () => {
    expect(moverIndice(0, 3, 1)).toBe(1);
    expect(moverIndice(2, 3, 1)).toBe(0);
    expect(moverIndice(0, 3, -1)).toBe(2);
    expect(moverIndice(1, 3, -1)).toBe(0);
  });

  it("empieza por un extremo si no hay opción activa", () => {
    expect(moverIndice(-1, 3, 1)).toBe(0);
    expect(moverIndice(-1, 3, -1)).toBe(2);
    expect(moverIndice(7, 3, 1)).toBe(0);
  });

  it("devuelve -1 sin opciones", () => {
    expect(moverIndice(0, 0, 1)).toBe(-1);
  });
});
