import { describe, expect, it } from "vitest";

import { clienteSchema } from "./cliente";

const base = {
  nombre_completo: "  Ana Pérez ",
  email: "ANA@Correo.com ",
  telefono: "",
  tipo_documento: "",
  numero_documento: "",
  ciudad: "",
};

describe("clienteSchema", () => {
  it("normaliza los datos y convierte vacíos en null", () => {
    const resultado = clienteSchema.parse(base);
    expect(resultado).toEqual({
      nombre_completo: "Ana Pérez",
      email: "ana@correo.com",
      telefono: null,
      tipo_documento: null,
      numero_documento: null,
      ciudad: null,
    });
  });

  it("exige tipo y número de documento juntos", () => {
    const soloTipo = clienteSchema.safeParse({ ...base, tipo_documento: "CC" });
    expect(soloTipo.success).toBe(false);
    expect(soloTipo.error?.issues[0]?.path).toEqual(["numero_documento"]);

    const completo = clienteSchema.safeParse({
      ...base,
      tipo_documento: "CC",
      numero_documento: "1020304050",
    });
    expect(completo.success).toBe(true);
  });

  it("rechaza correos y teléfonos inválidos", () => {
    expect(clienteSchema.safeParse({ ...base, email: "no-es-correo" }).success).toBe(false);
    expect(clienteSchema.safeParse({ ...base, telefono: "abc" }).success).toBe(false);
    expect(clienteSchema.safeParse({ ...base, telefono: "+57 319 542 0600" }).success).toBe(true);
  });
});
