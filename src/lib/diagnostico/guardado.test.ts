import { describe, expect, it } from "vitest";

import { diagnosticoVacio, obligacionVacia } from "./calcular";
import { filasObligaciones, leerFormularioMatriz } from "./guardado";

const clienteValido = {
  nombre_completo: "Heidy Paola Lancheros",
  email: "Heidy@Correo.com ",
  telefono: "",
  tipo_documento: "CC",
  numero_documento: "1144103758",
  ciudad: "Bogotá",
};

function formulario(datos: unknown, cliente: unknown, actualizadoEn = "") {
  const formData = new FormData();
  formData.set("datos", typeof datos === "string" ? datos : JSON.stringify(datos));
  formData.set("cliente", typeof cliente === "string" ? cliente : JSON.stringify(cliente));
  formData.set("actualizado_en", actualizadoEn);
  return formData;
}

describe("leerFormularioMatriz", () => {
  it("valida la matriz y los datos del cliente juntos", () => {
    const datos = {
      ...diagnosticoVacio(),
      obligaciones: [{ ...obligacionVacia(), acreedor: "Davivienda", capital: 1000 }],
    };
    const resultado = leerFormularioMatriz(
      formulario(datos, clienteValido, "2026-09-25T10:00:00Z"),
    );
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.formulario.cliente).toMatchObject({
      nombre_completo: "Heidy Paola Lancheros",
      email: "heidy@correo.com",
      telefono: null,
      tipo_documento: "CC",
    });
    expect(resultado.formulario.actualizadoEn).toBe("2026-09-25T10:00:00Z");
    expect(filasObligaciones(resultado.formulario.diagnostico)[0]).toMatchObject({
      acreedor: "Davivienda",
      dias_mora: null,
    });
  });

  it("matriz nueva sin versión", () => {
    const resultado = leerFormularioMatriz(formulario(diagnosticoVacio(), clienteValido));
    expect(resultado.ok && resultado.formulario.actualizadoEn).toBeNull();
  });

  it("marca los errores del cliente con el prefijo cliente. y los de la matriz con su ruta", () => {
    const datos = { ...diagnosticoVacio(), obligaciones: [{ ...obligacionVacia(), capital: 5 }] };
    const resultado = leerFormularioMatriz(
      formulario(datos, { ...clienteValido, nombre_completo: "", email: "no-es-correo" }),
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    const errores = resultado.estado.errores ?? {};
    expect(Object.keys(errores).sort()).toEqual([
      "cliente.email",
      "cliente.nombre_completo",
      "obligaciones.0.acreedor",
    ]);
  });

  it("exige tipo y número de documento juntos", () => {
    const resultado = leerFormularioMatriz(
      formulario(diagnosticoVacio(), { ...clienteValido, tipo_documento: "" }),
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.estado.errores?.["cliente.tipo_documento"]).toBeDefined();
  });

  it("rechaza un formulario ilegible", () => {
    const sinCliente = new FormData();
    sinCliente.set("datos", JSON.stringify(diagnosticoVacio()));
    for (const formData of [formulario("{roto", clienteValido), sinCliente]) {
      const resultado = leerFormularioMatriz(formData);
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.estado.errores).toBeUndefined();
    }
  });
});
