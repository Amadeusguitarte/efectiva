import { describe, expect, it } from "vitest";

import {
  ESTADOS_PROPUESTA,
  ETAPAS_PROCESO,
  INFO_ESTADO,
  esEstadoPropuesta,
  indiceEtapaActual,
} from "./estados";

describe("estados de la propuesta", () => {
  it("todos los estados tienen textos para cliente y equipo", () => {
    for (const estado of ESTADOS_PROPUESTA) {
      expect(INFO_ESTADO[estado].etiqueta).not.toBe("");
      expect(INFO_ESTADO[estado].descripcionCliente).not.toBe("");
      expect(INFO_ESTADO[estado].descripcionEquipo).not.toBe("");
    }
  });

  it("las etapas visibles terminan en finalizada", () => {
    expect(ETAPAS_PROCESO.at(-1)).toBe("finalizada");
  });

  it("ubica cada etapa en su posición", () => {
    expect(indiceEtapaActual("pendiente")).toBe(0);
    expect(indiceEtapaActual("verificando")).toBe(3);
    expect(indiceEtapaActual("finalizada")).toBe(4);
  });

  it("en una pausa usa la última etapa alcanzada", () => {
    expect(
      indiceEtapaActual("requiere_informacion", [
        "requiere_informacion",
        "en_elaboracion",
        "pendiente",
      ]),
    ).toBe(2);
    expect(indiceEtapaActual("cancelada", ["cancelada", "en_diagnostico"])).toBe(1);
    expect(indiceEtapaActual("requiere_informacion")).toBe(0);
  });

  it("valida valores desconocidos", () => {
    expect(esEstadoPropuesta("verificando")).toBe(true);
    expect(esEstadoPropuesta("aprobada")).toBe(false);
    expect(esEstadoPropuesta(undefined)).toBe(false);
  });
});
