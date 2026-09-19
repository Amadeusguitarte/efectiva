import { describe, expect, it } from "vitest";

import { esRutaDocumentoValida, rutaDocumentoPropuesta } from "@/lib/propuestas/documentos";

import { actualizarEstadoSchema } from "./propuesta";

const cliente = "0b6a3a1e-6f55-4a8c-9f1d-2f3c4d5e6f70";
const propuesta = "7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";

describe("documentos de propuesta", () => {
  it("acepta solo rutas dentro de la carpeta de la propuesta", () => {
    const ruta = rutaDocumentoPropuesta(cliente, propuesta, "1726581000000.pdf");
    expect(esRutaDocumentoValida(ruta, cliente, propuesta)).toBe(true);
    expect(esRutaDocumentoValida(`${cliente}/otra/1.pdf`, cliente, propuesta)).toBe(false);
    expect(esRutaDocumentoValida(`${cliente}/${propuesta}/../../x.pdf`, cliente, propuesta)).toBe(
      false,
    );
    expect(esRutaDocumentoValida(`${cliente}/${propuesta}/doc.exe`, cliente, propuesta)).toBe(
      false,
    );
  });
});

describe("actualizarEstadoSchema", () => {
  it("valida el estado y limpia el mensaje", () => {
    const datos = actualizarEstadoSchema.parse({
      propuesta_id: propuesta,
      estado: "verificando",
      mensaje_cliente: "  ",
    });
    expect(datos.mensaje_cliente).toBeNull();
    expect(
      actualizarEstadoSchema.safeParse({ propuesta_id: propuesta, estado: "aprobada" }).success,
    ).toBe(false);
  });
});
