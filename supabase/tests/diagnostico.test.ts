import { beforeAll, describe, expect, it } from "vitest";

import { crearBaseDePruebas } from "./entorno-supabase";

type Entorno = Awaited<ReturnType<typeof crearBaseDePruebas>>;
type ConId = { id: string };
type Guardado = { id: string; propuesta_en_diagnostico: boolean };

let e: Entorno;
let adminId: string;
let anaId: string;
let clienteAnaId: string;

const diagnostico = {
  ocupacion: "Administrativa",
  ingresos_mensuales: 2_800_000,
  gastos_mensuales: 1_000_000,
  bienes: "Apartamento hipotecado",
  estado_civil: "soltero",
  tipo_servicio: "acuerdo_pago_bilateral",
  porcentaje_honorarios: 5,
  cuotas_honorarios: 6,
  requiere_centro_conciliacion: true,
  descuento_centro_conciliacion: 500_000,
  observaciones_juridicas: null,
  situacion_urgencia: "Riesgo de embargo",
  objetivo_cliente: "Conservar el apartamento",
};

const obligaciones = [
  {
    acreedor: "Davivienda",
    concepto: "Crédito hipotecario",
    capital: 150_000_000,
    intereses: 0,
    mora: "mas_90_dias",
    dias_mora: 120,
    descuento_nomina: false,
    tipo_garantia: "hipoteca",
    clase: "tercera",
  },
  { acreedor: "Tigo", capital: 300_000, mora: "mas_90_dias" },
];

async function guardar(
  clienteId: string,
  datos: unknown = diagnostico,
  deudas: unknown[] = obligaciones,
  actualizadoEn: string | Date | null = null,
) {
  const [fila] = await e.consultar<Guardado>(
    "select * from public.guardar_diagnostico($1, $2::jsonb, $3::jsonb, $4::timestamptz)",
    [clienteId, JSON.stringify(datos), JSON.stringify(deudas), actualizadoEn],
  );
  return fila;
}

async function actualizadoEnDe(clienteId: string) {
  const [fila] = await e.consultar<{ updated_at: Date }>(
    "select updated_at from public.diagnosticos where cliente_id = $1",
    [clienteId],
  );
  return fila?.updated_at ?? null;
}

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

describe("guardar_diagnostico", () => {
  let diagnosticoId: string | undefined;

  it("crea el diagnóstico y sus obligaciones con el autor, y abre el diagnóstico de la propuesta", async () => {
    const guardado = await e.como(adminId, () => guardar(clienteAnaId));
    diagnosticoId = guardado?.id;
    expect(diagnosticoId).toBeTruthy();
    expect(guardado?.propuesta_en_diagnostico).toBe(true);

    const [propuesta] = await e.consultar<{ estado: string }>(
      "select estado from public.propuestas where cliente_id = $1",
      [clienteAnaId],
    );
    expect(propuesta?.estado).toBe("en_diagnostico");
    const eventos = await e.consultar<{ estado_nuevo: string; creado_por: string | null }>(
      "select estado_nuevo, creado_por from public.propuesta_eventos where propuesta_id = (select id from public.propuestas where cliente_id = $1) order by id",
      [clienteAnaId],
    );
    expect(eventos.at(-1)).toEqual({ estado_nuevo: "en_diagnostico", creado_por: adminId });

    const [fila] = await e.consultar<{
      tipo_servicio: string;
      porcentaje_honorarios: string;
      requiere_centro_conciliacion: boolean;
      actualizado_por: string;
    }>(
      "select tipo_servicio, porcentaje_honorarios, requiere_centro_conciliacion, actualizado_por from public.diagnosticos where id = $1",
      [diagnosticoId],
    );
    expect(fila).toMatchObject({
      tipo_servicio: "acuerdo_pago_bilateral",
      requiere_centro_conciliacion: true,
      actualizado_por: adminId,
    });
    expect(Number(fila?.porcentaje_honorarios)).toBe(5);

    const deudas = await e.consultar<{
      orden: number;
      acreedor: string;
      capital: string;
      clase: string;
      dias_mora: number | null;
    }>(
      "select orden, acreedor, capital, clase, dias_mora from public.obligaciones where diagnostico_id = $1 order by orden",
      [diagnosticoId],
    );
    expect(
      deudas.map((d) => [d.orden, d.acreedor, Number(d.capital), d.clase, d.dias_mora]),
    ).toEqual([
      [1, "Davivienda", 150_000_000, "tercera", 120],
      [2, "Tigo", 300_000, "quinta", null],
    ]);
  });

  it("al guardar de nuevo conserva el id, reemplaza las obligaciones y no vuelve a tocar la propuesta", async () => {
    const guardado = await e.como(adminId, () =>
      guardar(clienteAnaId, { ...diagnostico, cuotas_honorarios: 12 }, [
        { acreedor: "Claro", capital: 100_000, mora: "menos_90_dias" },
      ]),
    );
    expect(guardado?.id).toBe(diagnosticoId);
    expect(guardado?.propuesta_en_diagnostico).toBe(false);

    const [fila] = await e.consultar<{ cuotas_honorarios: number }>(
      "select cuotas_honorarios from public.diagnosticos where cliente_id = $1",
      [clienteAnaId],
    );
    expect(fila?.cuotas_honorarios).toBe(12);
    const deudas = await e.consultar<{ acreedor: string }>(
      "select acreedor from public.obligaciones where diagnostico_id = $1",
      [diagnosticoId],
    );
    expect(deudas.map((d) => d.acreedor)).toEqual(["Claro"]);
  });

  it("es atómico: si una obligación no es válida no se pierde nada, ni la cabecera", async () => {
    await e.como(adminId, async () => {
      await expect(
        guardar(clienteAnaId, { ...diagnostico, cuotas_honorarios: 3 }, [
          { acreedor: "Válida", capital: 1 },
          { acreedor: "", capital: 1 },
        ]),
      ).rejects.toThrow();
    });
    const [fila] = await e.consultar<{ cuotas_honorarios: number }>(
      "select cuotas_honorarios from public.diagnosticos where cliente_id = $1",
      [clienteAnaId],
    );
    expect(fila?.cuotas_honorarios).toBe(12);
    const deudas = await e.consultar<{ acreedor: string }>(
      "select acreedor from public.obligaciones where diagnostico_id = $1",
      [diagnosticoId],
    );
    expect(deudas.map((d) => d.acreedor)).toEqual(["Claro"]);
  });

  it("rechaza guardar sobre una versión que otra persona ya cambió", async () => {
    const version = await actualizadoEnDe(clienteAnaId);
    expect(version).not.toBeNull();

    // Con la versión vigente se guarda; después esa versión queda obsoleta.
    await e.como(adminId, () =>
      guardar(clienteAnaId, { ...diagnostico, ocupacion: "Docente" }, obligaciones, version),
    );
    await e.como(adminId, async () => {
      await expect(
        guardar(clienteAnaId, { ...diagnostico, ocupacion: "Pisada" }, obligaciones, version),
      ).rejects.toThrow(/modificada por otra persona/);
    });
    const [fila] = await e.consultar<{ ocupacion: string }>(
      "select ocupacion from public.diagnosticos where cliente_id = $1",
      [clienteAnaId],
    );
    expect(fila?.ocupacion).toBe("Docente");
  });

  it("aplica las restricciones de la tabla", async () => {
    await e.como(adminId, async () => {
      await expect(guardar(clienteAnaId, { ...diagnostico, cuotas_honorarios: 0 })).rejects.toThrow(
        /cuotas_honorarios/,
      );
      await expect(
        guardar(clienteAnaId, { ...diagnostico, porcentaje_honorarios: 101 }),
      ).rejects.toThrow(/porcentaje_honorarios/);
      await expect(
        guardar(clienteAnaId, diagnostico, [{ acreedor: "X", capital: -1 }]),
      ).rejects.toThrow(/capital/);
      await expect(guardar(clienteAnaId, [], [])).rejects.toThrow(/no válido/);
    });
  });

  it("rechaza clientes inexistentes", async () => {
    await e.como(adminId, async () => {
      await expect(guardar("00000000-0000-4000-8000-000000000000")).rejects.toThrow();
    });
  });
});

describe("permisos", () => {
  it("el cliente no ve ni guarda diagnósticos, ni siquiera el suyo", async () => {
    await e.como(anaId, async () => {
      expect(await e.consultar("select id from public.diagnosticos")).toHaveLength(0);
      expect(await e.consultar("select id from public.obligaciones")).toHaveLength(0);
      await expect(guardar(clienteAnaId)).rejects.toThrow(/Solo el equipo/);
      await expect(
        e.consultar("insert into public.diagnosticos (cliente_id) values ($1)", [clienteAnaId]),
      ).rejects.toThrow();
    });
  });

  it("el equipo ve todos los diagnósticos", async () => {
    await e.como(adminId, async () => {
      expect(await e.consultar("select id from public.diagnosticos")).toHaveLength(1);
    });
  });

  it("el acceso anónimo está bloqueado", async () => {
    await e.comoAnonimo(async () => {
      await expect(e.consultar("select id from public.diagnosticos")).rejects.toThrow();
      await expect(e.consultar("select id from public.obligaciones")).rejects.toThrow();
      await expect(guardar(clienteAnaId)).rejects.toThrow();
    });
  });

  it("al eliminar el cliente desaparece su diagnóstico", async () => {
    await e.como(adminId, () =>
      e.consultar("delete from public.clientes where id = $1", [clienteAnaId]),
    );
    expect(await e.consultar("select id from public.diagnosticos")).toHaveLength(0);
    expect(await e.consultar("select id from public.obligaciones")).toHaveLength(0);
  });
});
