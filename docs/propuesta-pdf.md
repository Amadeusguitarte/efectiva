# Propuesta legal en PDF

La plataforma genera la propuesta legal de cada cliente con el formato de la plantilla oficial (encabezado y pie con la marca, tabla de acreencias y las seis secciones), a partir de la matriz de diagnóstico y de la redacción del equipo. Sigue las reglas del prompt oficial de propuestas.

## Dónde está

- Ficha del cliente → botón **Generar propuesta en PDF** → `/admin/clientes/<id>/propuesta`.
- En esa página, **Generar PDF** abre `/admin/clientes/<id>/propuesta/pdf` en una pestaña nueva (solo administradores). Desde el visor se descarga o se imprime.
- El PDF no se guarda: se genera al momento con los datos vigentes. Para entregárselo al cliente en su portal, cárgalo como documento final en la ficha (sección Propuesta).

## Qué se redacta y qué es fijo

| Parte                                            | Origen                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Fecha, tratamiento (Señor/Señora), nombre        | Fecha del día, `propuesta_redacciones.tratamiento`, nombre del cliente en mayúsculas                         |
| 1. Situación económica (texto antes de la tabla) | Borrador automático con ocupación, ingresos, gastos y bienes; editable                                       |
| Pasivo total, tabla, mora y elegibilidad         | Siempre automáticos, con las cifras de la matriz                                                             |
| 2. Situación legal                               | Borrador con las obligaciones por garantía, observaciones jurídicas, situación/urgencia y objetivo; editable |
| 3. Recomendación jurídica                        | Borrador según el tipo de servicio (liquidación con/sin centro, acuerdo de pago, bilateral); editable        |
| Párrafo fijo del punto 3                         | Fijo (designación de la abogada como liquidadora)                                                            |
| 4. Honorarios                                    | Borrador con honorarios, %, cuotas, centro de conciliación y costo del proceso; editable                     |
| 5. Gestión, 6. Idoneidad, cierre y firma         | Fijos (`src/lib/propuestas/textos-fijos.ts`)                                                                 |
| Membrete y abogada                               | `siteConfig.letterhead` y `siteConfig.lawyer` en `src/config/site.ts`                                        |

Reglas del borrador (tomadas del prompt): no inventa hechos; el "Acuerdo de Pago Bilateral" nunca se menciona al cliente; en acuerdos de pago se habla de negociación sin prometer resultados; sin centro de conciliación no se menciona su costo y se advierte la lentitud de la justicia ordinaria.

## Redacción del equipo

Cada campo parte del texto sugerido. Si el equipo lo edita, se guarda en `propuesta_redacciones`; si vuelve a dejarlo igual al sugerido, se guarda como `null` y sigue actualizándose cuando cambie la matriz. El tratamiento cambia "El señor" / "La señora" en los textos sugeridos.

## Bloqueos

El PDF no se genera (respuesta 409 y botón deshabilitado) cuando falta la matriz o cuando tiene alertas de nivel error (sin tipo de servicio, acuerdo sin centro, descuento mayor que la tarifa, obligaciones sin valor…). Es la regla «REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA» del prompt.

## Técnica

- `src/lib/propuestas/contenido.ts`: borrador y contenido completo (funciones puras, con pruebas).
- `src/lib/propuestas/pdf/documento.tsx`: documento con `@react-pdf/renderer` (Helvetica incorporada; encabezado y pie incrustados en `recursos.ts`).
- `src/app/admin/clientes/[id]/propuesta/pdf/route.ts`: genera el PDF con `requerirAdmin()`.
- La firma manuscrita de la plantilla no se incluye: el repositorio es público. Si el equipo la quiere en el PDF, debe guardarse en un bucket privado y leerse al generar.
- Fase siguiente: redactar los puntos 1 a 3 con IA usando el prompt oficial y guardarlos en los mismos campos.
