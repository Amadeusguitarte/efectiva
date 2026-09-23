import { beforeAll, describe, expect, it } from "vitest";

import { crearBaseDePruebas } from "./entorno-supabase";

type Entorno = Awaited<ReturnType<typeof crearBaseDePruebas>>;
type ConId = { id: string };

let e: Entorno;
let adminId: string;
let anaId: string;
let clienteAnaId: string;

beforeAll(async () => {
  e = await crearBaseDePruebas();

  const [admin] = await e.consultar<ConId>(
    `insert into auth.users (email, email_confirmed_at, raw_app_meta_data)
     values ('equipo@ie.co', now(), '{"provider":"email"}') returning id`,
  );
  adminId = admin!.id;
  await e.consultar("update public.perfiles set rol = 'admin' where id = $1", [adminId]);

  const [ana] = await e.consultar<ConId>(
    `insert into auth.users (email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
     values ('ana@gmail.com', now(), '{"full_name":"Ana Pérez","email_verified":true}', '{"provider":"google"}')
     returning id`,
  );
  anaId = ana!.id;
  const [cliente] = await e.consultar<ConId>(
    "select id from public.clientes where perfil_id = $1",
    [anaId],
  );
  clienteAnaId = cliente!.id;
});

describe("propuesta_redacciones", () => {
  it("el equipo crea la redacción con su autor y el tratamiento por defecto", async () => {
    const [fila] = await e.como(adminId, () =>
      e.consultar<{ id: string; tratamiento: string; actualizado_por: string }>(
        `insert into public.propuesta_redacciones (cliente_id, situacion_legal, actualizado_por)
         values ($1, 'Texto del equipo.', $2) returning id, tratamiento, actualizado_por`,
        [clienteAnaId, adminId],
      ),
    );
    expect(fila).toMatchObject({ tratamiento: "senor", actualizado_por: adminId });
  });

  it("al actualizar se refresca updated_at", async () => {
    await e.como(adminId, () =>
      e.consultar(
        "update public.propuesta_redacciones set tratamiento = 'senora', honorarios = 'Primer pago acordado.' where cliente_id = $1",
        [clienteAnaId],
      ),
    );
    const [fila] = await e.consultar<{
      tratamiento: string;
      honorarios: string;
      adelantado: boolean;
    }>(
      "select tratamiento, honorarios, updated_at > created_at as adelantado from public.propuesta_redacciones where cliente_id = $1",
      [clienteAnaId],
    );
    expect(fila).toEqual({
      tratamiento: "senora",
      honorarios: "Primer pago acordado.",
      adelantado: true,
    });
  });

  it("solo admite una redacción por cliente y textos de hasta 8000 caracteres", async () => {
    await e.como(adminId, async () => {
      await expect(
        e.consultar("insert into public.propuesta_redacciones (cliente_id) values ($1)", [
          clienteAnaId,
        ]),
      ).rejects.toThrow();
      await expect(
        e.consultar(
          "update public.propuesta_redacciones set recomendacion = repeat('a', 8001) where cliente_id = $1",
          [clienteAnaId],
        ),
      ).rejects.toThrow();
    });
  });

  it("un cliente no ve ni escribe redacciones, ni siquiera la suya", async () => {
    await e.como(anaId, async () => {
      expect(
        await e.consultar("select id from public.propuesta_redacciones where cliente_id = $1", [
          clienteAnaId,
        ]),
      ).toHaveLength(0);
      await expect(
        e.consultar(
          "update public.propuesta_redacciones set honorarios = 'gratis' where cliente_id = $1 returning id",
          [clienteAnaId],
        ),
      ).resolves.toHaveLength(0);
      await expect(
        e.consultar(
          "insert into public.propuesta_redacciones (cliente_id, situacion_legal) values ($1, 'x')",
          [clienteAnaId],
        ),
      ).rejects.toThrow();
    });
  });

  it("el rol anónimo no tiene acceso", async () => {
    await e.comoAnonimo(async () => {
      await expect(e.consultar("select id from public.propuesta_redacciones")).rejects.toThrow();
    });
  });

  it("se elimina junto con el cliente", async () => {
    await e.consultar("delete from public.clientes where id = $1", [clienteAnaId]);
    expect(
      await e.consultar("select id from public.propuesta_redacciones where cliente_id = $1", [
        clienteAnaId,
      ]),
    ).toHaveLength(0);
  });
});
