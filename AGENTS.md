<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Convenciones del proyecto

Guía para cualquier persona o agente que modifique este repositorio. El README explica qué es el proyecto; aquí están las reglas de trabajo.

## Idioma

- Interfaz, textos, dominio de negocio y base de datos en **español** (`clientes`, `propuestas`, `requerirAdmin`).
- Infraestructura genérica en inglés cuando es el nombre estándar (`createClient`, `updateSession`, `SiteHeader`).
- Identificadores solo con caracteres ASCII.

## Verificación antes de entregar

```bash
npm run check   # lint + tipos + pruebas + formato
npm run build
```

## Seguridad (no negociable)

- **Toda Server Action y todo Route Handler valida la sesión y el rol** con `requerirAdmin()` / `requerirCliente()` de `src/lib/auth/sesion.ts`, aunque el proxy o el layout ya lo hagan: las acciones se pueden invocar directamente por POST. Única excepción: `src/app/api/salud/route.ts`, la comprobación de salud del host, que no lee sesión ni datos.
- Los datos se leen solo desde la capa de datos (`src/lib/datos/*`, marcada con `server-only`) y se devuelven como objetos mínimos. Nunca pases a un Client Component filas completas ni rutas internas de Storage.
- La base de datos aplica RLS en todas las tablas. Nunca uses la _service role key_ en la aplicación.
- Valida toda entrada con Zod (`src/lib/validaciones`). Las rutas de retorno (`siguiente`) pasan siempre por `rutaSegura()`.
- Las herramientas de medición (GA4, Meta Pixel) solo se cargan en el grupo `(marketing)`, nunca en `/admin` ni `/portal`.
- Los documentos de clientes (Excel, Word, PDF) jamás se versionan; `.gitignore` los excluye en la raíz y en `/privado`.

## Base de datos

- Cada cambio de esquema es una migración nueva en `supabase/migrations` (nunca edites una ya aplicada).
- Acompaña cada migración con pruebas en `supabase/tests` (Postgres en memoria con PGlite).
- Actualiza `src/types/database.ts` (idealmente con `supabase gen types`).

## Interfaz

- Componentes base de shadcn/ui en `src/components/ui` (`npx shadcn@latest add <componente>`). Importan `cn` desde `"cn"`.
- Usa los tokens de `src/app/globals.css` (`bg-primary`, `text-muted-foreground`, `bg-success-soft`…); no uses colores sueltos.
- Formularios: Server Action + `useActionState` + `EstadoAccion`. Devuelve `valores` en los errores para no perder lo escrito (React 19 reinicia el formulario).
- Textos de contacto, URLs y datos legales salen de `src/config/site.ts`.
- Enlaces internos tipados (`typedRoutes`); para rutas dinámicas usa `as Route`.

## Estructura

```
src/app/(marketing)   Web pública (estática)
src/app/(auth)        Ingreso, recuperación y cambio de contraseña
src/app/admin         Panel del equipo (rol admin)
src/app/portal        Portal del cliente (rol cliente)
src/app/auth          Retornos de Supabase Auth
src/app/documentos    Descarga segura de documentos
src/components        UI por área (marketing, admin, portal, propuestas, ui…)
src/lib               Lógica: auth, datos, validaciones, estados, supabase
supabase/             Migraciones y pruebas de políticas
```
