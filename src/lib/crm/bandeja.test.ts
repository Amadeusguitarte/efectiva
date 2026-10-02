import { describe, expect, it } from "vitest";

import {
  contarSinResponder,
  enBandeja,
  etiquetaFiltroBandeja,
  filtrarConversaciones,
  leerCarpetaCorreo,
  leerFiltroBandeja,
  prefijoAutor,
  sinResponderEnCanal,
  urlBandeja,
} from "./bandeja";

const YO = "11111111-1111-4111-8111-111111111111";
const OTRA = "22222222-2222-4222-8222-222222222222";

const conversaciones = [
  { id: "a", sinResponder: true, responsableId: YO, ultimaDireccion: "entrada" as const },
  { id: "b", sinResponder: false, responsableId: OTRA, ultimaDireccion: "salida" as const },
  { id: "c", sinResponder: false, responsableId: null, ultimaDireccion: null },
  { id: "d", sinResponder: true, responsableId: null, ultimaDireccion: "entrada" as const },
];

function ids(lista: { id: string }[]) {
  return lista.map((c) => c.id);
}

describe("inbox del CRM", () => {
  it("lee el filtro y la carpeta con lista blanca", () => {
    expect(leerFiltroBandeja("sin_responder")).toBe("sin_responder");
    expect(leerFiltroBandeja("cualquiera")).toBe("todos");
    expect(leerFiltroBandeja(undefined)).toBe("todos");
    expect(leerCarpetaCorreo("enviados")).toBe("enviados");
    expect(leerCarpetaCorreo("eliminados")).toBe("recibidos");
  });

  it("nombra el filtro del chip según el canal", () => {
    expect(etiquetaFiltroBandeja("whatsapp", "todos")).toBe("Chats abiertos");
    expect(etiquetaFiltroBandeja("correo", "todos")).toBe("Correos abiertos");
    expect(etiquetaFiltroBandeja("correo", "mios")).toBe("Asignados a mí");
  });

  it("muestra en cada inbox solo las conversaciones de su canal", () => {
    expect(enBandeja("whatsapp", { origen: null, ultimoDelCanal: { direccion: "entrada" } })).toBe(
      true,
    );
    // Caso nuevo sin mensajes: según el canal por el que llegó.
    expect(enBandeja("whatsapp", { origen: "whatsapp", ultimoDelCanal: null })).toBe(true);
    expect(enBandeja("correo", { origen: "whatsapp", ultimoDelCanal: null })).toBe(false);
    // Creado por el equipo y sin mensajes: no aparece en ningún inbox.
    expect(enBandeja("correo", { origen: null, ultimoDelCanal: null })).toBe(false);
  });

  it("está sin responder si el último mensaje del canal es de entrada", () => {
    expect(sinResponderEnCanal({ direccion: "entrada" })).toBe(true);
    expect(sinResponderEnCanal({ direccion: "salida" })).toBe(false);
    expect(sinResponderEnCanal(null)).toBe(false);
  });

  it("filtra por el chip", () => {
    const opciones = { usuarioId: YO };
    expect(ids(filtrarConversaciones(conversaciones, { ...opciones, filtro: "todos" }))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(
      ids(filtrarConversaciones(conversaciones, { ...opciones, filtro: "sin_responder" })),
    ).toEqual(["a", "d"]);
    expect(ids(filtrarConversaciones(conversaciones, { ...opciones, filtro: "mios" }))).toEqual([
      "a",
    ]);
    expect(
      ids(filtrarConversaciones(conversaciones, { ...opciones, filtro: "sin_asignar" })),
    ).toEqual(["c", "d"]);
  });

  it("separa los correos en Recibidos y Enviados por la dirección del último", () => {
    const base = { usuarioId: YO, filtro: "todos" as const };
    expect(ids(filtrarConversaciones(conversaciones, { ...base, carpeta: "recibidos" }))).toEqual([
      "a",
      "c",
      "d",
    ]);
    expect(ids(filtrarConversaciones(conversaciones, { ...base, carpeta: "enviados" }))).toEqual([
      "b",
    ]);
    expect(
      ids(
        filtrarConversaciones(conversaciones, {
          ...base,
          filtro: "sin_asignar",
          carpeta: "recibidos",
        }),
      ),
    ).toEqual(["c", "d"]);
  });

  it("cuenta las conversaciones sin responder por canal", () => {
    expect(
      contarSinResponder([
        { whatsapp: { direccion: "entrada" }, correo: { direccion: "salida" } },
        { whatsapp: { direccion: "salida" }, correo: { direccion: "entrada" } },
        { whatsapp: { direccion: "entrada" }, correo: null },
        { whatsapp: null, correo: null },
      ]),
    ).toEqual({ chat: 2, correo: 1 });
  });

  it("arma la URL del inbox sin escribir los valores por defecto", () => {
    const chat = {
      canal: "whatsapp" as const,
      busqueda: "",
      filtro: "todos" as const,
      carpeta: null,
    };
    expect(urlBandeja(chat)).toBe("/admin/crm/whatsapp");
    expect(urlBandeja(chat, { caso: "abc" })).toBe("/admin/crm/whatsapp?caso=abc");
    expect(urlBandeja({ ...chat, busqueda: "ana" }, { filtro: "sin_responder" })).toBe(
      "/admin/crm/whatsapp?q=ana&filtro=sin_responder",
    );
    const correo = { ...chat, canal: "correo" as const, carpeta: "recibidos" as const };
    expect(urlBandeja(correo)).toBe("/admin/crm/correo");
    expect(urlBandeja(correo, { carpeta: "enviados", caso: "abc" })).toBe(
      "/admin/crm/correo?carpeta=enviados&caso=abc",
    );
  });

  it("pone el prefijo del autor del último mensaje", () => {
    expect(prefijoAutor({ direccion: "entrada", autorId: null, autor: null }, YO)).toBeNull();
    expect(prefijoAutor({ direccion: "salida", autorId: YO, autor: "Ana Pérez" }, YO)).toBe("Tú");
    expect(prefijoAutor({ direccion: "salida", autorId: OTRA, autor: "Kevin Ruiz" }, YO)).toBe(
      "Kevin",
    );
    expect(prefijoAutor({ direccion: "salida", autorId: null, autor: null }, YO)).toBe("Equipo");
  });
});
