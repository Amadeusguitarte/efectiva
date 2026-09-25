import { describe, expect, it } from "vitest";

import { cifrar, claveDesdeEntorno, descifrar, generarClave } from "./cifrado";

describe("cifrado de secretos", () => {
  const clave = claveDesdeEntorno(generarClave());

  it("acepta claves en hex o base64 de 32 bytes y rechaza el resto", () => {
    expect(clave).not.toBeNull();
    expect(claveDesdeEntorno(Buffer.alloc(32, 7).toString("base64"))).not.toBeNull();
    expect(claveDesdeEntorno(undefined)).toBeNull();
    expect(claveDesdeEntorno("corta")).toBeNull();
    expect(claveDesdeEntorno(Buffer.alloc(16, 1).toString("base64"))).toBeNull();
  });

  it("cifra y descifra ida y vuelta con un resultado distinto cada vez", () => {
    const a = cifrar("sk-secreta-123", clave!);
    const b = cifrar("sk-secreta-123", clave!);
    expect(a).not.toBe(b);
    expect(a.startsWith("v1.")).toBe(true);
    expect(descifrar(a, clave!)).toBe("sk-secreta-123");
    expect(descifrar(b, clave!)).toBe("sk-secreta-123");
  });

  it("falla con otra clave o con un blob alterado", () => {
    const blob = cifrar("hola", clave!);
    const otra = claveDesdeEntorno(generarClave())!;
    expect(() => descifrar(blob, otra)).toThrow();
    expect(() => descifrar(`${blob.slice(0, -6)}AAAAAA`, clave!)).toThrow();
    expect(() => descifrar("sin-formato", clave!)).toThrow(/formato/);
  });
});
