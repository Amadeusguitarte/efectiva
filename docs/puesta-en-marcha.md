# Puesta en marcha y despliegue

Pasos para dejar la plataforma funcionando en un proyecto de Supabase nuevo y publicarla en Railway. Siguen el orden en que conviene hacerlos.

> Los nombres de menús corresponden al panel de Supabase y de Railway en septiembre de 2026; pueden variar ligeramente.

## 1. Base de datos (Supabase)

Aplica **todas** las migraciones de `supabase/migrations/`, en orden alfabético y una sola vez cada una:

| Archivo                                 | Qué crea                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `20260917120000_base_plataforma.sql`    | Perfiles, clientes, propuestas, historial, notas, consentimientos, RLS y el bucket `propuestas` |
| `20260919120000_matriz_diagnostico.sql` | Matriz de diagnóstico: `diagnosticos`, `obligaciones` y la función `guardar_diagnostico`        |

Cada pull request que cambie el esquema añade un archivo nuevo; nunca se edita uno ya aplicado.

**Opción A: editor SQL.** En _SQL Editor_ pega el contenido del archivo y ejecútalo una sola vez.

**Opción B: CLI** (recomendada a partir de la segunda migración):

```bash
npx supabase login
npx supabase init            # solo la primera vez; conserva las migraciones existentes
npx supabase link --project-ref <id-del-proyecto>
npx supabase db push
```

Después de cambiar el esquema, regenera los tipos:

```bash
npx supabase gen types typescript --project-id <id-del-proyecto> --schema public > src/types/database.ts
```

## 2. Autenticación

### 2.1 URLs permitidas

_Authentication → URL Configuration_

- **Site URL:** `https://insolvenciaefectiva.com`
- **Redirect URLs:**
  - `http://localhost:3000/**`
  - `https://insolvenciaefectiva.com/**`
  - `https://<servicio>.up.railway.app/**` (dominio temporal de Railway)

### 2.2 Inicio de sesión con Google (clientes)

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto y configura la **pantalla de consentimiento de OAuth**: nombre _Insolvencia Efectiva_, logo, dominio `insolvenciaefectiva.com`, y los enlaces a `/politica-de-privacidad` y `/terminos-y-condiciones`.
2. Crea una credencial **ID de cliente de OAuth → Aplicación web**:
   - Orígenes autorizados: `https://insolvenciaefectiva.com` y `http://localhost:3000`.
   - URI de redireccionamiento autorizado: `https://<id-del-proyecto>.supabase.co/auth/v1/callback`.
3. En Supabase, _Authentication → Sign In / Providers → Google_: activa el proveedor y pega el _Client ID_ y el _Client Secret_.

Cuando un cliente entra por primera vez con Google:

- Si el equipo ya había creado su expediente con el mismo correo, la cuenta se vincula a ese expediente.
- Si no existía, se crea un expediente nuevo con su propuesta en estado _Pendiente_.

### 2.3 Cuentas del equipo (correo y contraseña)

- Mantén activo el proveedor _Email_ con **Confirm email** habilitado.
- Las cuentas del equipo se crean por invitación. Quien se registre por su cuenta con correo y contraseña queda como cliente sin expediente y no ve ningún dato.

### 2.4 Plantillas de correo

_Authentication → Emails → Templates_. Los enlaces deben apuntar a `/auth/confirm` para que el servidor pueda validar la sesión.

**Invite user** (obligatorio):

```html
<h2>Te invitaron al panel de Insolvencia Efectiva</h2>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&siguiente=/actualizar-contrasena"
    >Crear mi contraseña</a
  >
</p>
```

**Reset password** (recomendado):

```html
<h2>Restablecer contraseña</h2>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&siguiente=/actualizar-contrasena"
    >Crear una nueva contraseña</a
  >
</p>
```

### 2.5 Correo de salida (SMTP)

El servidor de correo incluido en Supabase tiene límites de envío muy bajos y solo sirve para pruebas. En producción configura un SMTP propio en _Authentication → Emails → SMTP Settings_ (por ejemplo Resend, Postmark o Amazon SES) con un remitente del dominio, como `no-responder@insolvenciaefectiva.com`.

## 3. Primer administrador

1. _Authentication → Users → Invite user_ con el correo de la persona.
2. En _SQL Editor_:

   ```sql
   update public.perfiles set rol = 'admin' where email = 'correo@dominio.com';
   ```

3. La persona abre el correo de invitación, crea su contraseña y entra a `/admin`.

Para quitar el acceso, cambia el rol a `'cliente'` o elimina el usuario.

## 4. Variables de entorno

| Variable                               | Obligatoria      | Descripción                           |
| -------------------------------------- | ---------------- | ------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Sí en producción | URL pública, sin barra final          |
| `NEXT_PUBLIC_SUPABASE_URL`             | Sí               | _Project Settings → API_              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sí               | Clave publicable (`sb_publishable_…`) |
| `NEXT_PUBLIC_GA_ID`                    | No               | ID de medición de GA4 (`G-…`)         |
| `NEXT_PUBLIC_META_PIXEL_ID`            | No               | ID del píxel de Meta                  |

La clave publicable puede estar en el navegador: la seguridad la garantiza RLS. **Nunca** configures la _secret/service role key_ en la aplicación.

## 5. Railway

La aplicación se publica como contenedor Docker: `Dockerfile` en la raíz y Next.js en modo `standalone`. Railway construye la imagen en cada push a `main` y la mantiene siempre encendida, sin arranques en frío.

1. En [railway.com](https://railway.com) crea un proyecto → _Deploy from GitHub repo_ → `Amadeusguitarte/efectiva`, rama `main`. Railway detecta el `Dockerfile` y lee `railway.json` (comprobación de salud en `/api/salud` y reinicio automático si falla).
2. En el servicio, _Settings → Region_: **US East**, la más cercana a Colombia.
3. _Variables_: agrega las de la sección 4. Las `NEXT_PUBLIC_*` se incrustan durante el build; Railway las pasa como _build args_ porque el `Dockerfile` las declara con `ARG`. Cambiar una variable requiere un nuevo despliegue (_Deploy → Redeploy_).
4. _Settings → Networking → Generate Domain_: obtienes `https://<servicio>.up.railway.app`. Úsala en `NEXT_PUBLIC_SITE_URL` y en las _Redirect URLs_ de Supabase (sección 2.1) para probar todo antes de tocar el dominio.
5. _Custom Domain_: agrega `insolvenciaefectiva.com` y `www.insolvenciaefectiva.com` y crea en el DNS los registros que indique Railway. Cuando resuelvan, cambia `NEXT_PUBLIC_SITE_URL` a `https://insolvenciaefectiva.com` y vuelve a desplegar.
6. Cuando el dominio responda desde Railway, desactiva GitHub Pages en _GitHub → Settings → Pages_.

> Plan mínimo: **Hobby** (5 USD al mes con 5 USD de uso incluidos); es el primero que permite dominios propios. Esta aplicación usa unos 300 MB de memoria en reposo y cabe en ese crédito.
>
> Opcional: _Settings → Environments → PR environments_ despliega cada pull request en una URL temporal.

## 6. GitHub

- Haz el repositorio **privado** (_Settings → General → Danger Zone_).
- Protege la rama `main` (_Settings → Branches_): exige pull request y que pasen los checks **Lint, tipos, formato, pruebas y build** e **Imagen Docker**.
- En _Settings → Secrets and variables → Actions → Variables_ agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (la CI funciona sin ellas, con valores de ejemplo).
- Dependabot abre cada semana pull requests con actualizaciones agrupadas.

## 7. Antes de publicar

- [ ] Completar razón social, NIT y dirección en `src/config/site.ts` (`legal`).
- [ ] Revisión jurídica de la política de datos, los términos y el aviso legal.
- [ ] Confirmar el año de inicio de operaciones (`foundedYear`) del que salen los años de experiencia.
- [ ] Configurar GA4 y el píxel de Meta si se usan en campañas.
- [ ] Probar el flujo completo: cliente con Google → autorización → el equipo cambia el estado y sube el PDF → el cliente lo descarga.
