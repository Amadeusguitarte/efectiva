# CRM

CRM propio del panel (`/admin/crm`): pipeline por etapas, casos con responsable, próxima acción e historial, tareas y notificaciones, bandejas de WhatsApp y correo con respuesta manual, y análisis con IA. Todo vive en el mismo Supabase y se despliega en Railway junto a la plataforma.

## Conceptos

| Concepto     | Dónde                               | Qué es                                                                                                                                                       |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Etapa        | Configuración → Etapas              | Columna del pipeline. Tiene color, descripción, tipo (en curso / cierre ganado / cierre perdido), tareas automáticas y correo automático.                    |
| Caso         | Pipeline, ficha `/admin/crm/casos`  | Un contacto (teléfono y/o correo) con su etapa, responsable, próxima acción, análisis de IA, mensajes, tareas e historial. Puede vincularse a un expediente. |
| Tarea        | Ficha del caso, `/admin/crm/tareas` | Documentos solicitados, recontacto, seguimiento u otra; con plazo y responsable. Las crea el equipo o una etapa al entrar un caso.                           |
| Notificación | Campana del panel                   | Aviso al responsable (o a todo el equipo si no hay) por mensajes nuevos, tareas y asignaciones.                                                              |
| Bandeja      | `/admin/crm/whatsapp`, `/correo`    | Conversaciones por canal; se responde a mano. La IA nunca escribe al contacto.                                                                               |
| Expediente   | Ficha del caso → Expediente         | Cliente + propuesta de la plataforma. Se crea desde el caso o se vincula uno existente; al llegar un mensaje se vincula solo si coincide teléfono o correo.  |

## Cómo llega y sale la información

```
 WhatsApp (QR, Baileys)  ─┐                         ┌─ Panel (Next.js en Railway)
 Correo (IMAP)           ─┤  worker (Railway)  ───► │   crm_registrar_entrante → caso + mensaje + aviso
                          │                    ◄─── │   crm_mensajes (salida, pendiente) = cola de envío
 WhatsApp / SMTP (envío) ─┘                         └─ Configuración: etapas, IA, WhatsApp, correo
                              Supabase (Postgres + RLS)
```

- **Web** (`src/app/admin/crm`, `src/app/admin/configuracion`): usa la sesión del admin y RLS, como el resto del panel. Escribe los mensajes de salida en `crm_mensajes` con `estado_envio = 'pendiente'`.
- **Worker** (`worker/`): proceso aparte con la clave secreta de Supabase (`SUPABASE_SECRET_KEY`). Mantiene la sesión de WhatsApp (guardada en `wa_auth`), revisa la bandeja IMAP cada minuto, registra lo entrante con `crm_registrar_entrante` y envía lo pendiente. Es el único lugar donde existe la clave secreta.
- **Base** (`supabase/migrations/20260925120000_crm.sql`): funciones `crm_mover_etapa` (cambio de etapa + tareas + correo automático + avisos, en una transacción) y `crm_registrar_entrante` (alta o actualización del caso, deduplicación por id externo, aviso al responsable). Todas las tablas `crm_*` y `wa_cuentas` son solo para admins; `wa_auth` no es accesible para ningún usuario.

## Etapas y automatizaciones

Al mover un caso a una etapa (arrastrando en el tablero, desde la ficha o por la IA):

1. Se registra el cambio en el historial.
2. Se crean las **tareas automáticas** de la etapa, asignadas al responsable del caso y con plazo en días desde ese momento. El responsable recibe una notificación.
3. Si la etapa tiene **correo automático** y el caso tiene correo, se encola un correo con `{{nombre}}` y `{{etapa}}` reemplazados. Sale cuando la cuenta de correo esté conectada.

Las etapas iniciales (Nuevo → Contactado → Documentos solicitados → En diagnóstico → Propuesta enviada → Cliente / Descartado) son editables y reordenables; una etapa con casos no se puede eliminar.

## IA

Configuración → Inteligencia artificial: proveedor (OpenAI, Anthropic o Gemini), modelo y clave de API (cifrada). El análisis de un caso (`src/lib/crm/ia.ts`) lee la conversación y las notas y devuelve resumen, prioridad, etapa sugerida, próxima acción, documentos pendientes y datos detectados. Se ejecuta desde la ficha o con «Analizar con IA» en el pipeline (casos con mensajes nuevos, hasta 15 por vez). Si se activa «Mover a la etapa sugerida automáticamente», el análisis también cambia la etapa (y dispara sus automatizaciones); si no, solo sugiere y el equipo aplica con un clic.

La IA no responde mensajes y no hay ninguna función de respuesta automática visible ni activa.

## Configuración y despliegue

### Variables de entorno

| Variable              | Dónde            | Para qué                                                                                                                                                                |
| --------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CRM_CLAVE_CIFRADO`   | web **y** worker | 32 bytes en hex (`openssl rand -hex 32`). Cifra la clave de API de la IA y la contraseña del correo (AES-256-GCM). Sin ella no se pueden guardar ni leer esos secretos. |
| `SUPABASE_SECRET_KEY` | solo worker      | Supabase → Project Settings → API Keys → _secret key_. Nunca en el servicio web.                                                                                        |
| `SUPABASE_URL`        | worker           | Opcional: si no está, usa `NEXT_PUBLIC_SUPABASE_URL`.                                                                                                                   |

### Railway: segundo servicio «worker»

1. En el proyecto de Railway: **New → GitHub Repo → el mismo repositorio**. Nómbralo `worker`.
2. Settings → Build: define la variable `RAILWAY_DOCKERFILE_PATH=Dockerfile.worker` (o en Settings → Config-as-code apunta a `railway.worker.json`).
3. Variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CRM_CLAVE_CIFRADO`.
4. No necesita dominio ni puerto. Deploy Latest Commit y revisa los logs: debe decir «Worker en marcha».
5. En el servicio web agrega también `CRM_CLAVE_CIFRADO` (el mismo valor) y vuelve a desplegar.

En local: `npm run worker` (lee `.env.local`).

### Conectar los canales

Los instructivos están en el panel: Configuración → WhatsApp (QR) y Configuración → Correo (SMTP/IMAP con contraseña de aplicación). La pantalla de WhatsApp muestra si el worker está activo, el QR y el estado; la de correo permite probar la conexión antes de activarla.

## Límites conocidos

- Una sola cuenta de WhatsApp. Los mensajes de grupos, canales y estados se ignoran. Contactos que llegan solo con identificador LID (sin teléfono) se omiten con aviso en el log.
- La bandeja IMAP revisa la carpeta INBOX; la primera vez importa los correos de los últimos 2 días y después continúa por UID.
- Los mensajes de salida se envían como texto; no hay adjuntos por ahora.
- WhatsApp por QR es una integración no oficial (WhatsApp Web); Meta puede cerrar la sesión y habrá que volver a escanear.
