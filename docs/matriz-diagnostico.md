# Matriz de diagnóstico

Reemplaza el Excel «Matriz_Diagnostico_Insolvencia_Efectiva_Ley_2445_2025». El equipo la diligencia en el panel (`/admin/clientes/<id>/diagnostico`) durante la reunión con el cliente; los indicadores se recalculan mientras se escribe y se guardan al final.

El cliente nunca ve la matriz: solo recibe la propuesta final en su portal.

## Panel de la matriz

La matriz es un panel de trabajo del administrador con la identidad visual de la hoja «Diagnóstico Cliente» del Excel (sus azules, las etiquetas azul claro, las franjas de la tabla, los colores por clase y el TOTAL en amarillo, aquí suavizado), sin imitar la cuadrícula ni la tipografía del Excel: todo usa la fuente y los colores del panel. El código está en `src/components/diagnostico/matriz/`. La página fluye con el desplazamiento normal del panel y se adapta al ancho disponible, desde el celular hasta pantallas de 1920 px. Usa _container queries_, así que también responde al tamaño del menú lateral.

De arriba abajo:

1. **Encabezado:** enlace de regreso a la ficha del cliente (el mismo patrón «‹» de las demás páginas de detalle), estado de la propuesta y fecha de la última actualización. Tiene las acciones «Guía de clases», «Datos para la propuesta» (solo si la matriz ya se guardó) y «Guardar».
2. **Pestaña «Cambiar de cliente»** (ver [abajo](#cambiar-de-cliente)): unida a la franja de resumen, muestra las iniciales y el nombre del cliente.
3. **Franja de resumen** (azul oscuro del título del Excel):
   - La elegibilidad preliminar en una pastilla: ELEGIBLE en verde (con texto oscuro, por contraste), NO ELEGIBLE en rojo o SIN DATOS.
   - Sus tres condiciones visibles, cada una con su mínimo. El % del pasivo en mora se muestra con un decimal y truncado, para que un 29,96 % no aparezca como «30 %» junto a «No cumple».
   - El tipo de servicio.
   - Los indicadores pasivo total, honorarios (con su %), valor de la cuota (con el número de cuotas) y costo del proceso (con el desglose de gastos y centro).
4. **Revisión:** solo aparece si el motor marca alertas. Los errores salen en rojo y los avisos en ámbar. «Obligación N» y «La obligación N» se renumeran a la fila que se ve en la tabla.
5. **Tres tarjetas** con la cabecera azul de las secciones del Excel (una sola columna en pantallas angostas, dos desde 56rem de contenido y tres desde 80rem; en tarjetas de menos de 24rem la etiqueta va encima del campo):
   - «Datos del cliente».
   - «Servicio y honorarios», con la tarifa del centro y el valor de la cuota calculados. El centro es obligatorio en los acuerdos de pago.
   - «Notas del caso», con las preguntas guía de los comentarios del Excel como texto de ayuda.
6. **Obligaciones:** tabla editable en línea con franjas, la columna CLASE coloreada y la fila TOTAL en amarillo. Necesita unos 66,75rem; si el contenido es más angosto solo la tabla se desplaza en horizontal, un sombreado marca el lado con columnas ocultas y, desde 42rem, CLASE y el botón de eliminar quedan fijos a la derecha.
7. **«Resumen por clase»** (con una barra del peso de cada clase en el pasivo) y **«Acreedores para la propuesta»**, lado a lado y con la misma altura, el TOTAL al pie de ambas. Las tres filas TOTAL de la página tienen el mismo estilo.

Comportamiento de la tabla de obligaciones (lógica pura en `src/lib/diagnostico/hoja.ts`):

- Muestra las filas con datos más 3 filas libres al final, con un mínimo de 5 filas (`ajustarFilasLibres()`). Al escribir en las últimas filas aparecen filas nuevas. «Agregar obligación» lleva a la primera fila libre (`primeraFilaLibre()`). Las filas vacías no se guardan (`filasIncluidas()`).
- Las listas desplegables usan los textos del Excel (`> 90 días`, `TERCERA`, `Sin garantía`). Los días de mora fijan la categoría de mora, y la garantía real sugiere la clase.
- Teclado: Enter baja, Mayús+Enter sube y las flechas mueven entre celdas. La celda enfocada nunca queda bajo el encabezado fijo, la barra de guardado ni las columnas fijas.
- Se pueden pegar filas copiadas del Excel a partir de la celda activa. Si se pegan en ACREEDOR filas copiadas desde N° (o desde la columna A), esas primeras celdas se descartan cuando están vacías o son números de fila (`celdasSobrantesAlInicio()`). Los importes con `$` y puntos se interpretan (`pegarBloque()`).

Guardado:

- «Guardar» en el encabezado, Ctrl+S, o la barra fija al pie que aparece mientras hay cambios sin guardar (clara, con un punto ámbar, para no confundirse con los bloques azul oscuro).
- El navegador avisa si se intenta salir con cambios.
- Los errores de validación se marcan en su campo o fila, y el foco va al primero.
- Si otra persona guardó antes, el guardado se rechaza (`actualizado_en`).

La «Guía de clases» se abre en un panel lateral, con la prelación de créditos de la hoja «Guía 5 Clases» y sus fuentes. Los colores son tokens `hoja-*` y `clase-*` (más `clase-*-intenso` para las barras) de `globals.css`.

### Cambiar de cliente

La pestaña del cliente, sobre la franja de resumen, abre un buscador para pasar a la matriz de otro cliente sin volver al listado (`src/components/diagnostico/matriz/selector-cliente.tsx`):

- Sin texto muestra los 8 clientes con actividad más reciente; con texto busca en el servidor, tras una espera de 250 ms, por nombre, documento, correo o teléfono. Hay indicador de carga, estado «Sin resultados» y, si falla la red, un aviso con «Reintentar». Cada vez que se abre vuelve a consultar (los datos pueden haber cambiado con un guardado); mientras tanto muestra la lista anterior.
- Cada resultado muestra el nombre, un dato secundario (el documento; si lo buscado no está en el nombre ni en el documento sino en el correo o el teléfono, ese dato), el estado de la propuesta y si ya tiene matriz. El cliente actual aparece marcado y elegirlo solo cierra el panel. Al pie, «Ver todos los clientes» lleva a `/admin/clientes`.
- Teclado (patrón _combobox_ accesible): el foco va al buscador al abrir; las flechas recorren la lista, Enter abre el cliente y Esc cierra y devuelve el foco a la pestaña. Al abrir otro cliente, el foco pasa a la pestaña nueva, cuyo nombre accesible incluye el del cliente (el título del documento no lo lleva).
- Si la matriz tiene cambios sin guardar, pide confirmación antes de cambiar de cliente. Al cambiar, la matriz se monta de nuevo con los datos del otro cliente (`key` por cliente en la página).
- Servidor: la Server Action `buscarClientesMatriz()` (en `acciones.ts` de la página) valida la sesión de admin y el texto (`busquedaClientesSchema`, máx. 100 caracteres) y llama a `buscarClientesParaMatriz()` de `src/lib/datos/diagnostico.ts`, que devuelve solo `{ id, nombre, detalle, estadoPropuesta, tieneMatriz }`. La «actividad reciente» es la fecha más reciente entre la ficha, la matriz y la propuesta: como PostgREST no ordena por la mayor de varias columnas, se piden los 8 primeros según cada fecha y `masRecientes()` los combina. El filtro sale de `filtroBusqueda()` (`src/lib/busqueda.ts`), la misma utilidad del listado de clientes y del CRM: quita los caracteres reservados de PostgREST y busca `_` como carácter literal, no como comodín de `ilike`. Si lo escrito solo tiene caracteres que se quitan (p. ej. «,,,»), devuelve «Sin resultados» sin consultar. La lógica pura está probada en `src/lib/diagnostico/selector-cliente.test.ts`.

## Qué se registra

| Sección                 | Campos                                                                                                           | Hoja del Excel                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Situación económica     | Ocupación, estado civil, ingresos y gastos mensuales, bienes a nombre del deudor                                 | Diagnóstico Cliente, «Datos del cliente»   |
| Obligaciones            | Acreedor, concepto, capital, intereses y otros, mora, días de mora, descuento de nómina, tipo de garantía, clase | Diagnóstico Cliente, tabla de obligaciones |
| Servicio y honorarios   | Tipo de servicio, % de honorarios, cuotas, requiere centro de conciliación, descuento del centro                 | Diagnóstico Cliente, «Indicadores»         |
| Notas para la propuesta | Observaciones jurídicas, situación y urgencia, objetivo del cliente                                              | Diagnóstico Cliente, columnas K a M        |

Los catálogos (clases, moras, garantías, tipos de servicio, estados civiles) están en `src/lib/diagnostico/catalogos.ts`, con la guía de prelación de créditos de la hoja oculta «Guía 5 Clases».

## Qué se calcula

Todo lo calcula `calcularDiagnostico()` en `src/lib/diagnostico/calcular.ts`. Es una función pura: la misma en el navegador (vista previa) y en el servidor.

| Indicador                | Regla                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total de cada obligación | capital + intereses y otros                                                                                                                           |
| Pasivo total             | Suma de los totales                                                                                                                                   |
| % de cada deuda          | total ÷ pasivo total                                                                                                                                  |
| Resumen por clase        | Cantidad, total y % del pasivo por clase                                                                                                              |
| Elegibilidad preliminar  | Elegible si hay **2 o más obligaciones** con mora **mayor a 90 días**, de **2 o más acreedores distintos**, que sumen **al menos el 30 %** del pasivo |
| Honorarios               | pasivo total × % de honorarios (redondeado al peso)                                                                                                   |
| Valor de la cuota        | honorarios ÷ cuotas (redondeado al peso)                                                                                                              |
| Tarifa del centro        | Según el rango de pasivo (tabla en `parametros.ts`); se aplica la fila con el mayor «desde» que no supere el pasivo                                   |
| Valor del centro         | tarifa − descuento (nunca negativo)                                                                                                                   |
| ¿Se cobra el centro?     | Siempre en acuerdo de pago y acuerdo de pago bilateral; en liquidación patrimonial solo si «requiere centro» está marcado; sin tipo de servicio, no   |
| Gastos del proceso       | fijos + (por obligación × número de obligaciones)                                                                                                     |
| Costo del proceso        | honorarios + gastos del proceso + valor del centro (si se cobra)                                                                                      |

Los acreedores se comparan sin tildes, mayúsculas ni espacios repetidos: «Banco Ágil» y «banco agil» cuentan como uno solo.

## Alertas

El motor marca inconsistencias, en línea con la sección «INCONSISTENCIAS» del prompt de la propuesta. Un **error** significa que la propuesta no debe redactarse todavía; un **aviso** pide revisar.

| Código                      | Nivel | Cuándo                                                                                        |
| --------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| `acuerdo_sin_centro`        | error | Acuerdo de pago con «requiere centro» sin marcar                                              |
| `descuento_supera_tarifa`   | error | El descuento del centro es mayor que la tarifa                                                |
| `sin_obligaciones`          | error | No hay deudas registradas                                                                     |
| `sin_tipo_servicio`         | error | Falta el tipo de servicio                                                                     |
| `pasivo_fuera_de_tarifas`   | aviso | El pasivo supera el último rango de tarifas del centro                                        |
| `honorarios_cero`           | aviso | Porcentaje de honorarios en 0                                                                 |
| `obligacion_sin_valor`      | aviso | Obligación con total 0                                                                        |
| `obligacion_garantia_clase` | aviso | Hipoteca fuera de tercera clase, prenda fuera de segunda, o sin garantía en segunda o tercera |
| `obligacion_por_verificar`  | aviso | Clase o garantía «por verificar»                                                              |
| `obligacion_mora_dias`      | aviso | Los días de mora no coinciden con la categoría de mora                                        |

## Diferencias respecto al Excel (confirmadas por el equipo)

- **Gastos del proceso: 372.000 fijos por proceso** (`gastosProceso.fijos = 372_000`, `porObligacion = 0`). El Excel llegaba a esa cifra con `120.000 + 12.000 × COUNTA(B14:B35)` sobre la numeración fija de la tabla (siempre 21 celdas). Si algún día se cobra por acreedor, basta cambiar esos dos parámetros.
- **% de cada deuda** se calcula sobre el total (capital + intereses), no solo sobre el capital como hacía el Excel, para que los porcentajes sumen 100 %.
- **Pasivo total de «Datos propuesta».** La hoja del Excel sumaba solo 16 de las 20 filas; aquí siempre se suman todas.
- **Redondeo.** Honorarios y cuota se redondean al peso.
- **Centro con descuento mayor que la tarifa.** El Excel daba un valor negativo; aquí queda en 0 y se marca error.

## Parámetros

Están en `src/lib/diagnostico/parametros.ts`: umbral y mínimos de elegibilidad, porcentajes sugeridos, cuotas máximas, gastos del proceso y la tabla de tarifas del centro de conciliación. Cambiarlos requiere un despliegue; las pruebas de `calcular.test.ts` protegen los casos de referencia (el ejemplo del Excel y una propuesta real).

## Datos para la propuesta

`/admin/clientes/<id>/diagnostico/datos-propuesta` equivale a la hoja «DATOS PROPUESTA», con las mismas tarjetas y tablas de la matriz: los datos del cliente, la tabla de acreencias con las etiquetas que espera el prompt (clase en mayúsculas, «> 90 días», «Sin garantía», «SI»/«NO»), las notas y los honorarios. Se puede imprimir o guardar como PDF y copiar como texto para el prompt de la propuesta. Si hay alertas de nivel error, tanto la impresión como el texto empiezan con «REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA» y la lista de errores, como exige el prompt. En la fase de propuestas con IA esta misma estructura (`construirDatosPropuesta()`) alimentará el generador.

## Modelo de datos

- `public.diagnosticos`: uno por cliente (`cliente_id` único). Guarda solo las entradas; los indicadores no se almacenan y se recalculan con los parámetros vigentes.
- `public.obligaciones`: una fila por deuda, con `orden`.
- `public.guardar_diagnostico(cliente, diagnóstico, obligaciones, actualizado_en)`: crea o actualiza la matriz, reemplaza las obligaciones y pasa la propuesta «pendiente» a «en diagnóstico», todo en una sola transacción. Solo admin. Si `actualizado_en` no coincide con el `updated_at` actual (otra persona guardó antes), rechaza el guardado y el panel pide recargar.
- RLS: ambas tablas son exclusivas del rol admin; el rol cliente y el acceso anónimo no ven nada.
- Al guardar la primera vez, una propuesta en estado «pendiente» pasa a «en diagnóstico» (el cliente lo ve en su portal) dentro de la misma transacción.
- Pruebas: `supabase/tests/diagnostico.test.ts` (políticas, atomicidad, restricciones) y `src/lib/diagnostico/*.test.ts` (motor).
