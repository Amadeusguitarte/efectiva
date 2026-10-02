# CRM

CRM propio del panel (`/admin/crm`): pipeline por etapas, casos con responsable, próxima acción e historial, tareas y notificaciones, inbox de chat (WhatsApp) e inbox de correo con respuesta manual, y análisis con IA. La interfaz sigue la estética y el funcionamiento de Kommo, el CRM que el equipo ya conoce. Todo vive en el mismo Supabase y se despliega en Railway junto a la plataforma.

## Conceptos

| Concepto     | Dónde                               | Qué es                                                                                                                                                       |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Etapa        | Configuración → Etapas              | Columna del pipeline. Tiene color, descripción, tipo (en curso / cierre ganado / cierre perdido), tareas automáticas y correo automático.                    |
| Caso         | Pipeline, ficha `/admin/crm/casos`  | Un contacto (teléfono y/o correo) con su etapa, responsable, próxima acción, análisis de IA, mensajes, tareas e historial. Puede vincularse a un expediente. |
| Tarea        | Panel del caso, `/admin/crm/tareas` | Documentos solicitados, recontacto, seguimiento u otra; con plazo y responsable. Las crea el equipo o una etapa al entrar un caso.                           |
| Notificación | Campana del panel                   | Aviso al responsable (o a todo el equipo si no hay) por mensajes nuevos, tareas y asignaciones.                                                              |
| Inbox        | `/admin/crm/whatsapp`, `/correo`    | Conversaciones de cada canal; se responde a mano. La IA nunca escribe al contacto.                                                                           |
| Expediente   | Panel del caso → Expediente         | Cliente + propuesta de la plataforma. Se crea desde el caso o se vincula uno existente; al llegar un mensaje se vincula solo si coincide teléfono o correo.  |

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

## Interfaz (estilo Kommo)

Todas las vistas del CRM ocupan la pantalla completa (sin márgenes), con la tipografía PT Sans y los colores `crm-*` de `src/app/globals.css`. Las piezas están en `src/components/crm/kommo/`.

### Inbox de chat e inbox de correo

`/admin/crm/whatsapp` y `/admin/crm/correo` tienen tres columnas, como el «Inbox de chat» de Kommo:

1. **Lista de conversaciones** (`lista-conversaciones.tsx`): «Buscar» (nombre, teléfono o correo), el chip verde del filtro y «Total: N». Cada fila muestra el avatar con la insignia del canal, el nombre con el código del caso en verde, la etapa, el último mensaje con el prefijo del autor («Tú:» o el nombre del agente), la hora al estilo Kommo («9:51 p. m.», «Ayer 9:51 p. m.» o «23/09/2026») y un punto rojo si está sin responder. La conversación abierta va en azul con el texto blanco.
2. **Panel del caso** (`panel-caso.tsx`), plegable con la flecha «‹» del borde; el estado plegado se recuerda en el navegador.
3. **Feed del caso** (`feed-caso.tsx`) con el compositor abajo.

Cada inbox muestra solo las conversaciones de su canal: los casos con al menos un mensaje de ese canal o que llegaron por él (`origen`). Un caso creado por el equipo y sin mensajes no aparece en ningún inbox (está en el pipeline). Reglas en `src/lib/crm/bandeja.ts`:

| Parámetro | Valores                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `q`       | Búsqueda por nombre, teléfono o correo.                                                                   |
| `filtro`  | `todos` («Chats abiertos» / «Correos abiertos»), `sin_responder`, `mios` (asignados a mí), `sin_asignar`. |
| `carpeta` | Solo correo: `recibidos` (el último correo llegó) o `enviados` (el último correo lo envió el equipo).     |
| `caso`    | Conversación abierta.                                                                                     |

«Sin responder» es por canal: el último mensaje de ese canal lo escribió el contacto. Con el mismo criterio salen los contadores rojos del menú (Inbox de chat / Inbox de correo), calculados en `obtenerResumenCrm()` sobre las 500 conversaciones más recientes (cada caso trae solo su último mensaje de cada canal).

Sin conversación abierta se ve un estado vacío. Si WhatsApp no está conectado (o el correo no está configurado) aparece una franja con el enlace a Configuración; lo que se escriba queda en cola. En el celular se ve la lista y, al abrir una conversación, el feed con «‹» para volver; el panel abre como hoja lateral con el botón «Caso #…».

### Ficha del caso

`/admin/crm/casos/[id]` es la página del lead de Kommo: el panel del caso a la izquierda (alto completo, con su propio scroll) y el feed a la derecha. La flecha «‹» del panel vuelve al pipeline.

### Panel del caso

- Cabecera azul petróleo: «Caso #XXXXXX» (código corto derivado del id), el nombre y el menú «…» (abrir la ficha completa desde el inbox, abrir el expediente, eliminar el caso con confirmación).
- Etiquetas: prioridad del análisis de IA, canal de origen, «Sin responder» y «Con expediente».
- Etapa con los días que lleva en ella (desde el último cambio de etapa o la creación) y la barra segmentada del pipeline. Al elegir otra etapa se mueve el caso; si la etapa envía un **correo automático** (por ejemplo, «Documentos solicitados») y el caso tiene correo, primero se pide confirmación indicando destinatario, asunto y tareas que se crearán. Lo mismo al aplicar la etapa sugerida por la IA.
- Pestañas: **Principal** (usuario responsable, próxima acción y fecha editables en línea, expediente para crear o vincular, contacto con teléfono y correo editables, «Agregar nota» y «Agregar tarea»), **Análisis IA** (resumen, prioridad, etapa sugerida, documentos pendientes, volver a analizar) y **Tareas** (pendientes con completar y cancelar; las cerradas, plegadas).

### Feed y compositor

El feed une en orden cronológico los mensajes (entrantes a la izquierda con el avatar del contacto; salientes a la derecha en azul con autor y estado «Entregado», «En cola» o «No enviado»), las notas internas (tarjeta amarilla) y los eventos del sistema (línea gris centrada), con separadores de día («Hoy», «Ayer», «Martes, 22 de septiembre») y la marca «Conversación Nº …». Baja al último elemento al abrir y cuando llega algo nuevo si ya se estaba al final. La lógica de fechas y del feed está en `src/lib/crm/linea-tiempo.ts` (sin `Intl`, para que el servidor y el navegador escriban lo mismo).

El compositor tiene tres modos, como en Kommo («Chat ▾ para <contacto>:»):

- **Chat**: WhatsApp o correo (con asunto, que se propone como «Re: …» del último correo recibido). Enter envía y Mayús+Enter hace un salto de línea. Siempre lo escribe una persona.
- **Nota**: nota interna, que solo ve el equipo.
- **Tarea**: responsable, fecha, tipo y título.

La página vuelve a pedir los datos cada 8 segundos mientras la pestaña está visible (`actualizacion-periodica.tsx`), sin perder lo que se está escribiendo.

## Etapas y automatizaciones

Al mover un caso a una etapa (arrastrando en el tablero, desde la ficha o por la IA):

1. Se registra el cambio en el historial.
2. Se crean las **tareas automáticas** de la etapa, asignadas al responsable del caso y con plazo en días desde ese momento. El responsable recibe una notificación.
3. Si la etapa tiene **correo automático** y el caso tiene correo, se encola un correo con `{{nombre}}` y `{{etapa}}` reemplazados. Sale cuando la cuenta de correo esté conectada.

Las etapas iniciales (Nuevo → Contactado → Documentos solicitados → En diagnóstico → Propuesta enviada → Cliente / Descartado) son editables y reordenables; una etapa con casos no se puede eliminar.

## Pipeline, tareas y nuevo caso (estética de Kommo)

Las vistas siguen la de Kommo, que es la que el equipo ya conoce, y ocupan toda la pantalla.

- **Pipeline** (`/admin/crm`, `src/components/crm/tablero-pipeline.tsx`): como la vista «Leads». Arriba, un solo buscador («Búsqueda y filtro»): el texto busca por nombre, teléfono o correo y el botón de filtros abre atajos (Mis casos, Sin asignar, Sin responder, Sin tareas, Con tareas vencidas) y los filtros por responsable, canal y tareas. Los filtros activos se ven como chips verdes y viven en la URL (`q`, `responsable`, `canal`, `sin_responder`, `tareas`). Una columna por etapa (las de cierre al final) con su línea de color, el conteo y «Agregar rápido», que abre «Nuevo caso» con esa etapa; cada columna tiene su propio scroll. Cada tarjeta muestra el contacto y la fecha del último mensaje, el nombre, «Sin responder», las etiquetas (canal, prioridad de la IA, expediente), la próxima acción (en rojo si venció), el indicador de tareas («Sin tareas» en ámbar, vencida en rojo, de hoy en verde) y el responsable.
- **Mover casos**: arrastrando la tarjeta o con su menú «…» (sirve con teclado y en pantallas táctiles); el cambio se ve al instante y se revierte si falla. Si la etapa de destino envía un correo automático (por ejemplo, «Documentos solicitados») y el caso tiene correo, primero se pide confirmación con el asunto y el destinatario. Pasar a una etapa de cierre perdido pide un motivo opcional, que queda en el historial.
- **Tareas** (`/admin/crm/tareas`): lista agrupada por plazo: Vencidas, Hoy, Mañana, Esta semana (hasta el domingo), Más adelante y Sin fecha; en las vistas «Completadas» y «Todas» siguen las completadas y las canceladas. Casilla para completar al instante, «×» para cancelar, fecha relativa («Vencida hace 2 días»), enlace al caso y responsable. Filtros en la barra: Pendientes / Completadas / Todas y responsable («Mis tareas»).
- **Nuevo caso** (`/admin/crm/nuevo`): como «Nuevo lead»: panel oscuro con el nombre y la etapa (con su barra de avance) y, debajo, responsable (por defecto, quien lo crea), próxima acción y contacto. Usa la acción `crearCaso` con sus mismas validaciones. Crear un caso directamente en una etapa no dispara sus tareas ni su correo automático; eso solo pasa al cambiar de etapa.
- **Lógica pura** (con pruebas): `src/lib/crm/plazos.ts` (plazos y fechas relativas en hora de Bogotá, con nombres fijos para que servidor y navegador escriban lo mismo) y `src/lib/crm/pipeline.ts` (orden de las etapas, totales por columna, filtros rápidos e indicador de tareas de las tarjetas).

## IA

Configuración → Inteligencia artificial: proveedor (OpenAI, Anthropic o Gemini), modelo y clave de API (cifrada). El análisis de un caso (`src/lib/crm/ia.ts`) lee la conversación y las notas y devuelve resumen, prioridad, etapa sugerida, próxima acción, documentos pendientes y datos detectados. Se ejecuta desde la ficha o con «Analizar pendientes con IA» en el pipeline (casos con mensajes nuevos, hasta 15 por vez). Si se activa «Mover a la etapa sugerida automáticamente», el análisis también cambia la etapa (y dispara sus automatizaciones); si no, solo sugiere y el equipo aplica con un clic.

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
