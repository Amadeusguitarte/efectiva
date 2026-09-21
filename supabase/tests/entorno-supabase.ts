import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";

/**
 * Postgres en memoria con una réplica mínima de lo que Supabase provee (roles, auth.users,
 * auth.uid() y storage) para probar las migraciones y las políticas RLS sin Docker.
 */
export async function crearBaseDePruebas() {
  const db = new PGlite();

  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    grant usage on schema public, auth, storage to anon, authenticated, service_role;

    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      email_confirmed_at timestamptz,
      raw_user_meta_data jsonb default '{}'::jsonb,
      raw_app_meta_data jsonb default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant execute on function auth.uid() to anon, authenticated;

    create table storage.buckets (
      id text primary key, name text not null, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets (id), name text, owner uuid
    );
    alter table storage.objects enable row level security;
    grant all on storage.objects to authenticated;

    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  `);

  const carpeta = join(import.meta.dirname, "..", "migrations");
  for (const archivo of readdirSync(carpeta)
    .filter((a) => a.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(join(carpeta, archivo), "utf8"));
  }

  const consultar = async <T = Record<string, unknown>>(sql: string, parametros?: unknown[]) =>
    (await db.query<T>(sql, parametros)).rows;

  /** Ejecuta `fn` como el usuario autenticado `uid` (rol authenticated, con RLS). */
  const como = async <T>(uid: string, fn: () => Promise<T>): Promise<T> => {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid]);
    await db.exec("set role authenticated");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  };

  const comoAnonimo = async <T>(fn: () => Promise<T>): Promise<T> => {
    await db.exec("set role anon");
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  };

  return { db, consultar, como, comoAnonimo };
}
