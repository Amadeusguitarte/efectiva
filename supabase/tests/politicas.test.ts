import { beforeAll, describe, expect, it } from "vitest";

import { crearBaseDePruebas } from "./entorno-supabase";

type Entorno = Awaited<ReturnType<typeof crearBaseDePruebas>>;
type ConId = { id: string };

let e: Entorno;
let adminId: string;
let anaId: string;
let pedroId: string;
let clienteAna: { id: string; nombre_completo: string };
let propuestaAna: { id: string; estado: string };
let rutaDocumento: string;

async function crearUsuario(sql: string) {
  const [usuario] = await e.consultar<ConId>(sql);
  if (!usuario) throw new Error("No se creó el usuario");
  return usuario.id;
}

beforeAll(async () => {
  e = await crearBaseDePruebas();

  adminId = await crearUsuario(
    `insert into auth.users (email, email_confirmed_at, raw_app_meta_data)
     values ('equipo@ie.co', now(), '{"provider":"email"}') returning id`,
  );
  await e.consultar("update public.perfiles set rol = 'admin' where id = $1", [adminId]);

  anaId = await crearUsuario(
    `insert into auth.users (email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
     values ('Ana@Gmail.com', now(), '{"full_name":"Ana Pérez","email_verified":true}', '{"provider":"google"}')
     returning id`,
  );

  const [cliente] = await e.consultar<{ id: string; nombre_completo: string }>(
    "select id, nombre_completo from public.clientes where perfil_id = $1",
    [anaId],
  );
  const [propuesta] = await e.consultar<{ id: string; estado: string }>(
    "select id, estado from public.propuestas where cliente_id = $1",
    [cliente?.id],
  );
  if (!cliente || !propuesta) throw new Error("No se creó el expediente de Ana");
  clienteAna = cliente;
  propuestaAna = propuesta;
  rutaDocumento = `${cliente.id}/${propuesta.id}/final.pdf`;
});

describe("alta de usuarios", () => {
  it("las cuentas del equipo tienen perfil pero no expediente", async () => {
    expect(
      await e.consultar("select id from public.perfiles where id = $1", [adminId]),
    ).toHaveLength(1);
    expect(
      await e.consultar("select id from public.clientes where lower(email) = 'equipo@ie.co'"),
    ).toHaveLength(0);
  });

  it("un cliente de Google obtiene expediente y propuesta pendiente", () => {
    expect(clienteAna.nombre_completo).toBe("Ana Pérez");
    expect(propuestaAna.estado).toBe("pendiente");
  });

  it("vincula al expediente creado por el equipo si el correo coincide", async () => {
    const [expediente] = await e.como(adminId, () =>
      e.consultar<ConId>(
        `insert into public.clientes (nombre_completo, email, tipo_documento, numero_documento, origen, created_by)
         values ('Pedro Gómez', 'pedro@gmail.com', 'CC', '123456789', 'creado_por_admin', $1) returning id`,
        [adminId],
      ),
    );
    pedroId = await crearUsuario(
      `insert into auth.users (email, email_confirmed_at, raw_app_meta_data)
       values ('PEDRO@gmail.com', now(), '{"provider":"google"}') returning id`,
    );
    const [vinculo] = await e.consultar<{ perfil_id: string }>(
      "select perfil_id from public.clientes where id = $1",
      [expediente?.id],
    );
    expect(vinculo?.perfil_id).toBe(pedroId);
    expect(
      await e.consultar("select id from public.clientes where lower(email) = 'pedro@gmail.com'"),
    ).toHaveLength(1);
  });

  it("no vincula correos sin verificar y el registro no falla", async () => {
    await e.como(adminId, () =>
      e.consultar(
        "insert into public.clientes (nombre_completo, email) values ('Luis', 'luis@x.co')",
      ),
    );
    await crearUsuario(
      `insert into auth.users (email, raw_app_meta_data) values ('luis@x.co', '{"provider":"github"}') returning id`,
    );
    const [luis] = await e.consultar<{ perfil_id: string | null }>(
      "select perfil_id from public.clientes where email = 'luis@x.co'",
    );
    expect(luis?.perfil_id).toBeNull();
  });
});

describe("permisos del cliente", () => {
  it("solo ve su propio expediente, propuesta y perfil", async () => {
    await e.como(anaId, async () => {
      expect(await e.consultar("select id from public.clientes")).toHaveLength(1);
      expect(await e.consultar("select id from public.propuestas")).toHaveLength(1);
      expect(await e.consultar("select id from public.perfiles")).toHaveLength(1);
      const [fila] = await e.consultar<{ es: boolean }>("select public.es_admin() as es");
      expect(fila?.es).toBe(false);
    });
  });

  it("no puede cambiar su rol, pero sí su nombre", async () => {
    await e.como(anaId, async () => {
      await expect(
        e.consultar("update public.perfiles set rol = 'admin' where id = $1", [anaId]),
      ).rejects.toThrow();
      await e.consultar("update public.perfiles set nombre_completo = 'Ana P.' where id = $1", [
        anaId,
      ]);
    });
    const [perfil] = await e.consultar<{ rol: string; nombre_completo: string }>(
      "select rol, nombre_completo from public.perfiles where id = $1",
      [anaId],
    );
    expect(perfil).toEqual({ rol: "cliente", nombre_completo: "Ana P." });
  });

  it("no puede modificar propuestas, crear expedientes ni escribir el historial", async () => {
    await e.como(anaId, async () => {
      expect(
        await e.consultar(
          "update public.propuestas set estado = 'finalizada', documento_path = 'x' returning id",
        ),
      ).toHaveLength(0);
      await expect(
        e.consultar("insert into public.clientes (nombre_completo, email) values ('X', 'x@x.co')"),
      ).rejects.toThrow();
      await expect(
        e.consultar(
          "insert into public.propuesta_eventos (propuesta_id, estado_nuevo) values ($1, 'finalizada')",
          [propuestaAna.id],
        ),
      ).rejects.toThrow();
    });
  });

  it("registra solo su propio consentimiento", async () => {
    await e.como(anaId, async () => {
      expect(
        await e.consultar(
          "insert into public.consentimientos (perfil_id, version) values ($1, '2026-09-17') returning id",
          [anaId],
        ),
      ).toHaveLength(1);
      await expect(
        e.consultar("insert into public.consentimientos (perfil_id, version) values ($1, 'v')", [
          pedroId,
        ]),
      ).rejects.toThrow();
    });
  });

  it("no ve las notas internas", async () => {
    await e.como(adminId, () =>
      e.consultar(
        "insert into public.notas_internas (cliente_id, contenido, autor_id) values ($1, 'Privada', $2)",
        [clienteAna.id, adminId],
      ),
    );
    await e.como(anaId, async () => {
      expect(await e.consultar("select id from public.notas_internas")).toHaveLength(0);
    });
  });
});

describe("flujo de estados", () => {
  it("el equipo ve todos los expedientes", async () => {
    await e.como(adminId, async () => {
      expect(await e.consultar("select id from public.clientes")).toHaveLength(3);
    });
  });

  it("no permite finalizar sin documento", async () => {
    await e.como(adminId, async () => {
      await expect(
        e.consultar("update public.propuestas set estado = 'finalizada' where id = $1", [
          propuestaAna.id,
        ]),
      ).rejects.toThrow(/propuestas_finalizada_con_documento/);
    });
  });

  it("registra cada cambio con su autor y la fecha de finalización", async () => {
    await e.como(adminId, async () => {
      await e.consultar(
        "update public.propuestas set estado = 'verificando', mensaje_cliente = 'En revisión' where id = $1",
        [propuestaAna.id],
      );
      await e.consultar(
        "update public.propuestas set documento_path = $2, estado = 'finalizada' where id = $1",
        [propuestaAna.id, rutaDocumento],
      );
    });

    const [propuesta] = await e.consultar<{ finalizada_at: Date | null }>(
      "select finalizada_at from public.propuestas where id = $1",
      [propuestaAna.id],
    );
    expect(propuesta?.finalizada_at).not.toBeNull();

    const eventos = await e.consultar<{
      estado_anterior: string | null;
      creado_por: string | null;
    }>(
      "select estado_anterior, creado_por from public.propuesta_eventos where propuesta_id = $1 order by id",
      [propuestaAna.id],
    );
    expect(eventos).toHaveLength(3);
    expect(eventos[2]).toEqual({ estado_anterior: "verificando", creado_por: adminId });
  });

  it("al reabrir la propuesta se limpia la fecha de finalización", async () => {
    await e.como(adminId, () =>
      e.consultar("update public.propuestas set estado = 'verificando' where id = $1", [
        propuestaAna.id,
      ]),
    );
    const [propuesta] = await e.consultar<{ finalizada_at: Date | null }>(
      "select finalizada_at from public.propuestas where id = $1",
      [propuestaAna.id],
    );
    expect(propuesta?.finalizada_at).toBeNull();
  });
});

describe("documentos en storage", () => {
  beforeAll(async () => {
    await e.como(adminId, async () => {
      await e.consultar("update public.propuestas set estado = 'finalizada' where id = $1", [
        propuestaAna.id,
      ]);
      await e.consultar("insert into storage.objects (bucket_id, name) values ('propuestas', $1)", [
        rutaDocumento,
      ]);
      await e.consultar(
        "insert into storage.objects (bucket_id, name) values ('propuestas', 'otro/doc.pdf')",
      );
    });
  });

  it("el cliente solo ve el documento de su propuesta finalizada", async () => {
    await e.como(anaId, async () => {
      const objetos = await e.consultar<{ name: string }>("select name from storage.objects");
      expect(objetos.map((o) => o.name)).toEqual([rutaDocumento]);
      await expect(
        e.consultar("insert into storage.objects (bucket_id, name) values ('propuestas', 'x.pdf')"),
      ).rejects.toThrow();
    });
  });

  it("otro cliente no ve documentos ajenos", async () => {
    await e.como(pedroId, async () => {
      expect(await e.consultar("select id from storage.objects")).toHaveLength(0);
    });
  });

  it("el documento deja de estar disponible si la propuesta se reabre", async () => {
    await e.como(adminId, () =>
      e.consultar("update public.propuestas set estado = 'verificando' where id = $1", [
        propuestaAna.id,
      ]),
    );
    await e.como(anaId, async () => {
      expect(await e.consultar("select id from storage.objects")).toHaveLength(0);
    });
  });
});

describe("acceso anónimo", () => {
  it("no tiene acceso a las tablas", async () => {
    await e.comoAnonimo(async () => {
      await expect(e.consultar("select id from public.clientes")).rejects.toThrow();
    });
  });
});
