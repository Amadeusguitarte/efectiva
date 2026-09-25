import { beforeAll, describe, expect, it } from "vitest";

import { crearBaseDePruebas } from "./entorno-supabase";

type Entorno = Awaited<ReturnType<typeof crearBaseDePruebas>>;
type ConId = { id: string };
type Registro = {
  caso_id: string;
  mensaje_id: number | string;
  caso_nuevo: boolean;
  mensaje_nuevo: boolean;
};

let e: Entorno;
let adminId: string;
let otroAdminId: string;
let anaId: string;
let clienteAnaId: string;
let etapas: { id: string; nombre: string; orden: number }[];

const etapa = (nombre: string) => {
  const encontrada = etapas.find((x) => x.nombre === nombre);
  if (!encontrada) throw new Error(`Etapa ${nombre} no existe`);
  return encontrada.id;
};

async function registrar(
  canal: "whatsapp" | "correo",
  identificador: string,
  nombre: string | null,
  contenido: string,
  idExterno: string | null = null,
  asunto: string | null = null,
) {
  const [fila] = await e.consultar<Registro>(
    "select * from public.crm_registrar_entrante($1, $2, $3, $4, $5, $6, null)",
    [canal, identificador, nombre, contenido, idExterno, asunto],
  );
  return fila!;
}

beforeAll(async () => {
  e = await crearBaseDePruebas();

  const [admin] = await e.consultar<ConId>(
    `insert into auth.users (email, email_confirmed_at, raw_app_meta_data)
     values ('equipo@ie.co', now(), '{"provider":"email"}') returning id`,
  );
  adminId = admin!.id;
  await e.consultar("update public.perfiles set rol = 'admin' where id = $1", [adminId]);

  const [otro] = await e.consultar<ConId>(
    `insert into auth.users (email, email_confirmed_at, raw_app_meta_data)
     values ('abogada@ie.co', now(), '{"provider":"email"}') returning id`,
  );
  otroAdminId = otro!.id;
  await e.consultar("update public.perfiles set rol = 'admin' where id = $1", [otroAdminId]);

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
  await e.consultar("update public.clientes set telefono = '300 123 4567' where id = $1", [
    clienteAnaId,
  ]);

  etapas = await e.consultar("select id, nombre, orden from public.crm_etapas order by orden");
});

describe("etapas y ajustes iniciales", () => {
  it("vienen sembradas y ordenadas", () => {
    expect(etapas.map((x) => x.nombre)).toEqual([
      "Nuevo",
      "Contactado",
      "Documentos solicitados",
      "En diagnóstico",
      "Propuesta enviada",
      "Cliente",
      "Descartado",
    ]);
  });

  it("existen las filas de ajustes y la cuenta principal de WhatsApp", async () => {
    const ajustes = await e.consultar<{ clave: string }>(
      "select clave from public.crm_ajustes order by clave",
    );
    expect(ajustes.map((a) => a.clave)).toEqual(["correo", "ia", "whatsapp"]);
    const cuentas = await e.consultar<{ estado: string }>("select estado from public.wa_cuentas");
    expect(cuentas).toEqual([{ estado: "desconectado" }]);
  });
});

describe("crm_registrar_entrante", () => {
  let casoWhatsApp: string;

  it("crea el caso en la primera etapa, guarda el mensaje y avisa a todo el equipo", async () => {
    const r = await registrar("whatsapp", "573001234567@s.whatsapp.net", "Carlos", "Hola", "wa-1");
    expect(r.caso_nuevo).toBe(true);
    expect(r.mensaje_nuevo).toBe(true);
    casoWhatsApp = r.caso_id;

    const [caso] = await e.consultar<{
      nombre: string;
      telefono: string;
      etapa_id: string;
      origen: string;
      cliente_id: string | null;
      ultimo_mensaje_direccion: string;
    }>("select * from public.crm_casos where id = $1", [casoWhatsApp]);
    expect(caso).toMatchObject({
      nombre: "Carlos",
      telefono: "573001234567",
      etapa_id: etapa("Nuevo"),
      origen: "whatsapp",
      ultimo_mensaje_direccion: "entrada",
    });
    // El expediente de Ana tiene 300 123 4567: queda vinculado.
    expect(caso?.cliente_id).toBe(clienteAnaId);

    const avisos = await e.consultar<{ perfil_id: string; titulo: string }>(
      "select perfil_id, titulo from public.crm_notificaciones where caso_id = $1 order by id",
      [casoWhatsApp],
    );
    expect(avisos.map((a) => a.perfil_id).sort()).toEqual([adminId, otroAdminId].sort());
    expect(avisos[0]?.titulo).toBe("Nuevo WhatsApp de Carlos");
  });

  it("no duplica un mensaje con el mismo id externo y reutiliza el caso por teléfono", async () => {
    const repetido = await registrar("whatsapp", "573001234567", "Carlos", "Hola", "wa-1");
    expect(repetido).toMatchObject({
      caso_id: casoWhatsApp,
      caso_nuevo: false,
      mensaje_nuevo: false,
    });
    const otro = await registrar("whatsapp", "573001234567", null, "¿Me pueden ayudar?", "wa-2");
    expect(otro).toMatchObject({ caso_id: casoWhatsApp, caso_nuevo: false, mensaje_nuevo: true });
    const mensajes = await e.consultar("select id from public.crm_mensajes where caso_id = $1", [
      casoWhatsApp,
    ]);
    expect(mensajes).toHaveLength(2);
  });

  it("los correos crean su propio caso y guardan el asunto", async () => {
    const r = await registrar(
      "correo",
      "  Pedro@Dominio.com ",
      "Pedro Gómez",
      "Adjunto mis documentos",
      "<m1@dominio.com>",
      "Documentos",
    );
    expect(r.caso_nuevo).toBe(true);
    const [caso] = await e.consultar<{ email: string; origen: string }>(
      "select email, origen from public.crm_casos where id = $1",
      [r.caso_id],
    );
    expect(caso).toEqual({ email: "pedro@dominio.com", origen: "correo" });
    const [mensaje] = await e.consultar<{ asunto: string; direccion: string }>(
      "select asunto, direccion from public.crm_mensajes where id = $1",
      [r.mensaje_id],
    );
    expect(mensaje).toEqual({ asunto: "Documentos", direccion: "entrada" });
  });

  it("rechaza identificadores inválidos", async () => {
    await expect(registrar("whatsapp", "abc", null, "x")).rejects.toThrow(/Identificador/);
    await expect(registrar("correo", "sin-arroba", null, "x")).rejects.toThrow(/Identificador/);
  });
});

describe("crm_mover_etapa", () => {
  let casoId: string;

  beforeAll(async () => {
    const [caso] = await e.como(adminId, () =>
      e.consultar<ConId>(
        `insert into public.crm_casos (nombre, email, etapa_id, responsable_id, creado_por)
         values ('Laura Ruiz', 'laura@gmail.com', $1, $2, $3) returning id`,
        [etapa("Nuevo"), otroAdminId, adminId],
      ),
    );
    casoId = caso!.id;
  });

  it("registra el cambio, crea las tareas de la etapa, avisa al responsable y encola el correo", async () => {
    await e.como(adminId, () =>
      e.consultar("select public.crm_mover_etapa($1, $2, $3, $4)", [
        casoId,
        etapa("Documentos solicitados"),
        adminId,
        "Ya hablamos por teléfono",
      ]),
    );

    const [caso] = await e.consultar<{ etapa_id: string }>(
      "select etapa_id from public.crm_casos where id = $1",
      [casoId],
    );
    expect(caso?.etapa_id).toBe(etapa("Documentos solicitados"));

    const eventos = await e.consultar<{ tipo: string; descripcion: string; autor_id: string }>(
      "select tipo, descripcion, autor_id from public.crm_eventos where caso_id = $1 order by id",
      [casoId],
    );
    expect(eventos[0]).toEqual({
      tipo: "etapa",
      descripcion: "Pasó de «Nuevo» a «Documentos solicitados». Ya hablamos por teléfono",
      autor_id: adminId,
    });
    expect(eventos.map((x) => x.tipo)).toEqual([
      "etapa",
      "tarea_creada",
      "tarea_creada",
      "correo_automatico",
    ]);

    const tareas = await e.consultar<{
      tipo: string;
      titulo: string;
      responsable_id: string;
      dias: number;
      estado: string;
    }>(
      `select tipo, titulo, responsable_id, estado,
              (vence_at - (now() at time zone 'America/Bogota')::date) as dias
       from public.crm_tareas where caso_id = $1 order by vence_at`,
      [casoId],
    );
    expect(tareas).toEqual([
      {
        tipo: "documentos",
        titulo: "Revisar los documentos recibidos",
        responsable_id: otroAdminId,
        estado: "pendiente",
        dias: 3,
      },
      {
        tipo: "recontacto",
        titulo: "Recordar el envío de documentos si no han llegado",
        responsable_id: otroAdminId,
        estado: "pendiente",
        dias: 5,
      },
    ]);

    // Solo se avisa al responsable (no a quien hizo el cambio).
    const avisos = await e.consultar<{ perfil_id: string; titulo: string }>(
      "select perfil_id, titulo from public.crm_notificaciones where caso_id = $1 order by id",
      [casoId],
    );
    expect(avisos).toHaveLength(2);
    expect(new Set(avisos.map((a) => a.perfil_id))).toEqual(new Set([otroAdminId]));
    expect(avisos[0]?.titulo).toBe("Nueva tarea: Revisar los documentos recibidos");

    const [correo] = await e.consultar<{
      canal: string;
      direccion: string;
      estado_envio: string;
      asunto: string;
      contenido: string;
    }>(
      "select canal, direccion, estado_envio, asunto, contenido from public.crm_mensajes where caso_id = $1",
      [casoId],
    );
    expect(correo).toMatchObject({
      canal: "correo",
      direccion: "salida",
      estado_envio: "pendiente",
      asunto: "Documentos para su proceso de insolvencia",
    });
    expect(correo?.contenido.startsWith("Hola Laura Ruiz,")).toBe(true);
  });

  it("no hace nada si el caso ya está en esa etapa", async () => {
    await e.como(adminId, () =>
      e.consultar("select public.crm_mover_etapa($1, $2, $3, null)", [
        casoId,
        etapa("Documentos solicitados"),
        adminId,
      ]),
    );
    const eventos = await e.consultar("select id from public.crm_eventos where caso_id = $1", [
      casoId,
    ]);
    expect(eventos).toHaveLength(4);
  });

  it("sin correo en el caso no encola correo; sin responsable avisa a todo el equipo", async () => {
    const [caso] = await e.como(adminId, () =>
      e.consultar<ConId>(
        "insert into public.crm_casos (nombre, telefono, etapa_id) values ('Sin correo', '573009998877', $1) returning id",
        [etapa("Nuevo")],
      ),
    );
    await e.como(adminId, () =>
      e.consultar("select public.crm_mover_etapa($1, $2, null, null)", [
        caso!.id,
        etapa("Documentos solicitados"),
      ]),
    );
    const correos = await e.consultar(
      "select id from public.crm_mensajes where caso_id = $1 and canal = 'correo'",
      [caso!.id],
    );
    expect(correos).toHaveLength(0);
    const avisos = await e.consultar<{ perfil_id: string }>(
      "select perfil_id from public.crm_notificaciones where caso_id = $1",
      [caso!.id],
    );
    // 2 tareas × 2 admins
    expect(avisos).toHaveLength(4);
  });

  it("falla con un caso o etapa inexistentes", async () => {
    await e.como(adminId, async () => {
      await expect(
        e.consultar("select public.crm_mover_etapa($1, $2, null, null)", [
          "00000000-0000-4000-8000-000000000000",
          etapa("Nuevo"),
        ]),
      ).rejects.toThrow(/Caso no encontrado/);
      await expect(
        e.consultar("select public.crm_mover_etapa($1, $2, null, null)", [
          casoId,
          "00000000-0000-4000-8000-000000000000",
        ]),
      ).rejects.toThrow(/Etapa no encontrada/);
    });
  });
});

describe("permisos", () => {
  it("un cliente no ve casos, mensajes, ajustes ni cuentas de WhatsApp", async () => {
    await e.como(anaId, async () => {
      expect(await e.consultar("select id from public.crm_casos")).toHaveLength(0);
      expect(await e.consultar("select id from public.crm_mensajes")).toHaveLength(0);
      expect(await e.consultar("select clave from public.crm_ajustes")).toHaveLength(0);
      expect(await e.consultar("select id from public.wa_cuentas")).toHaveLength(0);
      await expect(
        e.consultar("insert into public.crm_casos (nombre, etapa_id) values ('x', $1)", [
          etapa("Nuevo"),
        ]),
      ).rejects.toThrow();
      await expect(
        e.consultar("select public.crm_mover_etapa($1, $2, null, null)", [
          "00000000-0000-4000-8000-000000000000",
          etapa("Nuevo"),
        ]),
      ).rejects.toThrow();
    });
  });

  it("cada admin solo ve sus notificaciones y puede marcarlas leídas", async () => {
    const propias = await e.como(otroAdminId, () =>
      e.consultar<{ perfil_id: string }>("select perfil_id from public.crm_notificaciones"),
    );
    expect(propias.length).toBeGreaterThan(0);
    expect(new Set(propias.map((n) => n.perfil_id))).toEqual(new Set([otroAdminId]));
    const marcadas = await e.como(otroAdminId, () =>
      e.consultar(
        "update public.crm_notificaciones set leida_at = now() where leida_at is null returning id",
      ),
    );
    expect(marcadas).toHaveLength(propias.length);
  });

  it("la sesión de WhatsApp no es accesible para usuarios autenticados ni anónimos", async () => {
    await e.como(adminId, async () => {
      await expect(e.consultar("select * from public.wa_auth")).rejects.toThrow();
    });
    await e.comoAnonimo(async () => {
      await expect(e.consultar("select id from public.crm_casos")).rejects.toThrow();
      await expect(e.consultar("select * from public.wa_auth")).rejects.toThrow();
    });
  });

  it("el equipo puede leer y escribir ajustes y la cuenta de WhatsApp", async () => {
    await e.como(adminId, async () => {
      const filas = await e.consultar(
        `update public.crm_ajustes set valor = '{"proveedor":"openai","modelo":"gpt-4o-mini"}'::jsonb, secreto = 'cifrado'
         where clave = 'ia' returning clave`,
      );
      expect(filas).toHaveLength(1);
      const cuentas = await e.consultar(
        "update public.wa_cuentas set reinicio_solicitado = true returning id",
      );
      expect(cuentas).toHaveLength(1);
    });
  });
});

describe("integridad", () => {
  it("no se puede borrar una etapa con casos y los casos se borran con sus mensajes y tareas", async () => {
    await expect(
      e.consultar("delete from public.crm_etapas where id = $1", [etapa("Nuevo")]),
    ).rejects.toThrow();

    const [caso] = await e.consultar<ConId>(
      "select id from public.crm_casos where telefono = '573001234567'",
    );
    await e.consultar("delete from public.crm_casos where id = $1", [caso!.id]);
    expect(
      await e.consultar("select id from public.crm_mensajes where caso_id = $1", [caso!.id]),
    ).toHaveLength(0);
    expect(
      await e.consultar("select id from public.crm_notificaciones where caso_id = $1", [caso!.id]),
    ).toHaveLength(0);
  });

  it("rechaza teléfonos con letras y correos sin arroba", async () => {
    await expect(
      e.consultar(
        "insert into public.crm_casos (nombre, telefono, etapa_id) values ('x', '30a', $1)",
        [etapa("Nuevo")],
      ),
    ).rejects.toThrow();
    await expect(
      e.consultar(
        "insert into public.crm_casos (nombre, email, etapa_id) values ('x', 'nada', $1)",
        [etapa("Nuevo")],
      ),
    ).rejects.toThrow();
  });
});
