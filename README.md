# Insolvencia Efectiva

Web pública y plataforma de gestión de [insolvenciaefectiva.com](https://insolvenciaefectiva.com): captación de clientes para procesos de insolvencia de persona natural en Colombia, panel para el equipo y portal donde cada cliente sigue el avance de su propuesta legal.

## Qué incluye

| Área               | Ruta      | Quién entra                  | Qué hace                                                                                  |
| ------------------ | --------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| Web pública        | `/`       | Cualquiera                   | Landing, agenda en Calendly, WhatsApp, páginas legales, SEO                               |
| Portal del cliente | `/portal` | Clientes (Google)            | Autorización de datos, estado y etapas de su propuesta, historial, descarga del PDF final |
| Panel              | `/admin`  | Equipo (correo y contraseña) | Resumen, gestión de clientes, estado de cada propuesta, documento final, notas internas   |

Estados de una propuesta: **Pendiente → En diagnóstico → En elaboración → Verificando → Finalizada**, más dos estados de pausa: **Requiere información** y **Cancelada**. Cada cambio queda en un historial que el cliente ve en su portal.

## Tecnología

| Capa           | Herramienta                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estricto             |
| Estilos        | Tailwind CSS 4 · shadcn/ui (Radix) · lucide-react                               |
| Datos y acceso | Supabase: Postgres con RLS, Auth (Google + correo), Storage privado             |
| Validación     | Zod 4                                                                           |
| Calidad        | ESLint 9 · Prettier · Vitest · pruebas de políticas con PGlite · GitHub Actions |
| Alojamiento    | Railway (contenedor Docker, Next.js en modo standalone)                         |

## Requisitos

- Node.js **24 LTS** (mínimo 22.12). Hay un archivo `.nvmrc`.
- Un proyecto de Supabase con la migración aplicada (ver [docs/puesta-en-marcha.md](docs/puesta-en-marcha.md)).
- Si el proyecto vive en una carpeta sincronizada (OneDrive), ten en cuenta que `node_modules` y `.next` suman decenas de miles de archivos: la sincronización tarda y conviene pausarla durante `npm ci`.

## Desarrollo local

```bash
cp .env.example .env.local   # y completa los valores
npm ci
npm run dev                  # http://localhost:3000
```

| Comando                       | Qué hace                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`                 | Servidor de desarrollo                                                                           |
| `npm run build` / `npm start` | Build y servidor de producción (Railway usa `node .next/standalone/server.js`, ver `Dockerfile`) |
| `npm run lint`                | ESLint                                                                                           |
| `npm run typecheck`           | Genera los tipos de rutas y ejecuta `tsc`                                                        |
| `npm test`                    | Pruebas unitarias y de políticas de base de datos                                                |
| `npm run format`              | Formatea con Prettier                                                                            |
| `npm run check`               | Todo lo anterior salvo el build (lo mismo que exige la CI)                                       |

## Estructura

```
src/
  app/
    (marketing)/        Web pública y páginas legales (estáticas)
    (auth)/             Ingresar, recuperar y crear contraseña
    admin/              Panel del equipo
    portal/             Portal del cliente
    auth/               Retornos de Supabase Auth (OAuth y enlaces por correo)
    documentos/         Descarga de documentos con URL firmada
  components/           UI por área + componentes base en ui/
  config/               Datos del negocio y navegación
  content/              Contenido editorial (preguntas frecuentes)
  lib/
    auth/               Sesión, roles y redirecciones seguras
    datos/              Acceso a datos del panel y del portal (solo servidor)
    propuestas/         Estados y documentos de la propuesta
    supabase/           Clientes de Supabase (servidor, navegador, proxy)
    validaciones/       Esquemas Zod
  proxy.ts              Refresco de sesión y protección de rutas
supabase/
  migrations/           Esquema versionado
  tests/                Pruebas de RLS, triggers y Storage
docs/                   Guías de configuración y despliegue
```

## Seguridad

- Row Level Security en todas las tablas: cada cliente solo ve su expediente, su propuesta y su historial; las notas internas son exclusivas del equipo.
- El rol `admin` solo se asigna por SQL; un usuario no puede cambiar su propio rol.
- Los PDF se guardan en un bucket privado. El cliente solo puede descargar el suyo, cuando la propuesta está finalizada, mediante una URL firmada de 60 segundos.
- La autorización de tratamiento de datos (Ley 1581 de 2012) se registra con su versión antes de mostrar información en el portal.
- La medición (GA4 y Meta Pixel) solo se carga en la web pública.
- Los documentos de trabajo con datos de clientes nunca se versionan (ver `.gitignore`).

## Despliegue

La guía completa (Supabase, Google, Railway, dominio y primer administrador) está en [docs/puesta-en-marcha.md](docs/puesta-en-marcha.md).

## Próximas fases

1. **Matriz de diagnóstico**: llevar las fórmulas del Excel a un motor de cálculo en TypeScript con pruebas que verifiquen que coincide con el Excel.
2. **Programación de pagos de honorarios**: tablas por cliente y por fecha, importación desde Excel y cruce con la matriz.
3. **Propuesta con IA**: generación asistida desde el servidor (plantilla de prompt versionada, cifras calculadas por el motor, revisión del abogado antes de entregar).

Las convenciones de código están en [AGENTS.md](AGENTS.md).
