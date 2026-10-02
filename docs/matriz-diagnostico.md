# Matriz de diagnóstico

Reemplaza el Excel «Matriz_Diagnostico_Insolvencia_Efectiva_Ley_2445_2025». El equipo la diligencia en el panel (`/admin/clientes/<id>/diagnostico`) durante la reunión con el cliente; los indicadores se recalculan mientras se escribe y se guardan al final.

El cliente nunca ve la matriz: solo recibe la propuesta final en su portal.

## Hojas del dashboard (pestañas)

Como el libro de Excel, el diagnóstico de cada cliente tiene varias hojas, todas con el mismo diseño de dashboard y una barra de pestañas común:

| Pestaña                 | Ruta                                               | Hoja del Excel      |
| ----------------------- | -------------------------------------------------- | ------------------- |
| Diagnóstico             | `/admin/clientes/<id>/diagnostico`                 | Diagnóstico Cliente |
| Datos para la propuesta | `/admin/clientes/<id>/diagnostico/datos-propuesta` | DATOS PROPUESTA     |
| Listas                  | `/admin/clientes/<id>/diagnostico/listas`          | Listas              |

- **Encabezado común** (`src/components/diagnostico/matriz/encabezado-dashboard.tsx`), de lo general a lo particular: el cliente (enlace de regreso a su ficha y botón «Cambiar de cliente»), el título de la hoja con el estado de la propuesta y la fecha del último guardado de la matriz, y una sola fila de pestañas cuya activa va unida a la franja azul oscura de la hoja. Las acciones propias de la hoja (Diagnóstico: «Guía de clases» y «Guardar»; Datos: «Copiar como texto» e «Imprimir o guardar PDF»; Listas: «Guía de clases») van a la derecha del título; en contenedores angostos bajan después de la franja, para que las pestañas queden a la misma altura en las tres hojas.
- **Barra de pestañas** (`pestanas-hojas.tsx`): enlaces reales (`Link`) dentro de `<nav aria-label="Hojas del diagnóstico">`, con `aria-current="page"` en la activa y un icono por hoja. Como las hojas del libro de Excel, la activa es una pestaña de carpeta en el azul oscuro de la franja, unida a ella (sin la esquina superior izquierda redondeada si es la primera); las inactivas van en texto oscuro y el foco con teclado es un anillo opaco. Mientras se abre una hoja, su icono pasa a indicador de carga (`useLinkStatus`). En pantallas angostas usa etiquetas cortas («Datos propuesta») y, si aun así no caben, se desplaza en horizontal sin mover la página, con la pestaña activa a la vista. No se imprime. Si la matriz tiene cambios sin guardar, la pestaña Diagnóstico lleva un punto ámbar.
- **Cambios sin guardar:** las pestañas son enlaces, así que la guarda de la matriz pide confirmación antes de salir de Diagnóstico (igual que con cualquier enlace del panel). No pregunta al volver a la pestaña activa ni al abrir un enlace en otra pestaña del navegador (Ctrl/Mayús + clic).
- **Cambiar de cliente** abre la misma hoja del cliente elegido (diagnóstico, datos o listas).
- El orden, los títulos y las rutas salen de `src/lib/diagnostico/hojas.ts` (`HOJAS_DIAGNOSTICO`, `rutaHoja()`); `hojas.test.ts` comprueba además que cada hoja tenga su `page.tsx`. Para agregar una hoja: súmala ahí, crea su página con `EncabezadoDashboard` y una franja (`FRANJA` e `Indicador` de `resumen-indicadores.tsx`) y valida el id con `z.uuid()` y `notFound()` como las demás.

## Panel de la matriz

La matriz es un panel de trabajo del administrador con la identidad visual de la hoja «Diagnóstico Cliente» del Excel (sus azules, las etiquetas azul claro, las franjas de la tabla, los colores por clase y el TOTAL en amarillo, aquí suavizado), sin imitar la cuadrícula ni la tipografía del Excel: todo usa la fuente y los colores del panel. El código está en `src/components/diagnostico/matriz/`. La página fluye con el desplazamiento normal del panel y se adapta al ancho disponible, desde el celular hasta pantallas de 1920 px. Usa _container queries_, así que también responde al tamaño del menú lateral.

De arriba abajo:

1. **Encabezado común** de las hojas (ver [arriba](#hojas-del-dashboard-pestañas)): regreso a la ficha del cliente, botón «Cambiar de cliente» (ver [abajo](#cambiar-de-cliente)), estado de la propuesta, fecha de la última actualización, las acciones «Guía de clases» y «Guardar» y la barra de pestañas.
2. **Franja de resumen** (azul oscuro del título del Excel):
   - La elegibilidad preliminar en una pastilla: ELEGIBLE en verde (con texto oscuro, por contraste), NO ELEGIBLE en rojo o SIN DATOS.
   - Sus tres condiciones visibles, cada una con su mínimo. El % del pasivo en mora se muestra con un decimal y truncado, para que un 29,96 % no aparezca como «30 %» junto a «No cumple».
   - El tipo de servicio.
   - Los indicadores pasivo total, honorarios (con su %), valor de la cuota (con el número de cuotas) y costo del proceso (con el desglose de gastos y centro).
3. **Revisión:** solo aparece si el motor marca alertas. Los errores salen en rojo y los avisos en ámbar. «Obligación N» y «La obligación N» se renumeran a la fila que se ve en la tabla.
4. **Tres tarjetas** con la cabecera azul de las secciones del Excel (una sola columna en pantallas angostas, dos desde 56rem de contenido y tres desde 80rem; en tarjetas de menos de 24rem la etiqueta va encima del campo):
   - «Datos del cliente»: nombre completo, documento (tipo y número), correo, teléfono y ciudad del expediente, más ocupación, ingresos, gastos, bienes y estado civil. Los datos del expediente se guardan junto con la matriz (también se pueden editar en la ficha del cliente).
   - «Servicio y honorarios», con la tarifa del centro y el valor de la cuota calculados. El centro es obligatorio en los acuerdos de pago.
   - «Notas del caso», con las preguntas guía de los comentarios del Excel como texto de ayuda.
5. **Obligaciones:** tabla editable en línea con franjas, la columna CLASE coloreada y la fila TOTAL en amarillo. Necesita unos 66,75rem; si el contenido es más angosto solo la tabla se desplaza en horizontal, un sombreado marca el lado con columnas ocultas y, desde 42rem, CLASE y el botón de eliminar quedan fijos a la derecha.
6. **«Resumen por clase»** (con una barra del peso de cada clase en el pasivo) y **«Acreedores para la propuesta»**, lado a lado y con la misma altura, el TOTAL al pie de ambas. Las tres filas TOTAL de la página tienen el mismo estilo.

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

### Crear un cliente

No hay formulario aparte: «Nuevo cliente» (en Resumen y en Clientes) abre `/admin/clientes/nuevo`, que es esta misma matriz vacía. Se escriben los datos del cliente en «Datos del cliente» (nombre y correo son obligatorios; el correo es con el que el cliente entra a su portal) junto con su diagnóstico, y al guardar:

- La Server Action `crearClienteConMatriz()` (en `src/app/admin/clientes/[id]/diagnostico/acciones.ts`) valida la sesión de admin, la matriz y los datos del cliente (`leerFormularioMatriz()` de `src/lib/diagnostico/guardado.ts`, que marca los errores del cliente con el prefijo `cliente.`).
- Crea el expediente (la base le abre su propuesta) y guarda la matriz con `guardar_diagnostico`. Si la matriz no se puede guardar, borra el expediente recién creado para no dejar clientes a medias.
- Un correo o documento repetido se marca en su campo y no crea nada.
- Al terminar abre la matriz del cliente nuevo (`?creado=1` muestra el aviso «Cliente creado y matriz guardada.» y se quita de la dirección).

Mientras el cliente no existe, las pestañas «Datos para la propuesta» y «Listas» aparecen desactivadas.

### Cambiar de cliente

El botón «Cambiar de cliente», junto al enlace de regreso a la ficha en el encabezado de cada hoja, abre un buscador para pasar a otro cliente sin volver al listado, en la misma hoja que se estaba viendo (`src/components/diagnostico/matriz/selector-cliente.tsx`):

- Sin texto muestra los 8 clientes con actividad más reciente; con texto busca en el servidor, tras una espera de 250 ms, por nombre, documento, correo o teléfono. Hay indicador de carga, estado «Sin resultados» y, si falla la red, un aviso con «Reintentar». Cada vez que se abre vuelve a consultar (los datos pueden haber cambiado con un guardado); mientras tanto muestra la lista anterior.
- Cada resultado muestra el nombre, un dato secundario (el documento; si lo buscado no está en el nombre ni en el documento sino en el correo o el teléfono, ese dato), el estado de la propuesta y si ya tiene matriz. El cliente actual aparece marcado y elegirlo solo cierra el panel. Al pie, «Ver todos los clientes» lleva a `/admin/clientes`.
- Teclado (patrón _combobox_ accesible): el foco va al buscador al abrir; las flechas recorren la lista, Enter abre el cliente y Esc cierra y devuelve el foco al botón. Al abrir otro cliente, el foco pasa al botón de la página nueva, cuyo nombre accesible incluye el del cliente («Cambiar de cliente (cliente actual: …)»; el título del documento no lo lleva).
- Si la matriz tiene cambios sin guardar, pide confirmación antes de cambiar de cliente. Al cambiar, se abre la misma hoja del otro cliente (`rutaHoja()`) y la matriz se monta de nuevo con sus datos (`key` por cliente en la página).
- Servidor: la Server Action `buscarClientesMatriz()` (en `acciones.ts` de la página) valida la sesión de admin y el texto (`busquedaClientesSchema`, máx. 100 caracteres) y llama a `buscarClientesParaMatriz()` de `src/lib/datos/diagnostico.ts`, que devuelve solo `{ id, nombre, detalle, estadoPropuesta, tieneMatriz }`. La «actividad reciente» es la fecha más reciente entre la ficha, la matriz y la propuesta: como PostgREST no ordena por la mayor de varias columnas, se piden los 8 primeros según cada fecha y `masRecientes()` los combina. El filtro sale de `filtroBusqueda()` (`src/lib/busqueda.ts`), la misma utilidad del listado de clientes y del CRM: quita los caracteres reservados de PostgREST y busca `_` como carácter literal, no como comodín de `ilike`. Si lo escrito solo tiene caracteres que se quitan (p. ej. «,,,»), devuelve «Sin resultados» sin consultar. La lógica pura está probada en `src/lib/diagnostico/selector-cliente.test.ts`.

## Qué se registra

| Sección                 | Campos                                                                                                                  | Hoja del Excel                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Datos del cliente       | Nombre, documento, correo, teléfono y ciudad (expediente); ocupación, estado civil, ingresos y gastos mensuales, bienes | Diagnóstico Cliente, «Datos del cliente»   |
| Obligaciones            | Acreedor, concepto, capital, intereses y otros, mora, días de mora, descuento de nómina, tipo de garantía, clase        | Diagnóstico Cliente, tabla de obligaciones |
| Servicio y honorarios   | Tipo de servicio, % de honorarios, cuotas, requiere centro de conciliación, descuento del centro                        | Diagnóstico Cliente, «Indicadores»         |
| Notas para la propuesta | Observaciones jurídicas, situación y urgencia, objetivo del cliente                                                     | Diagnóstico Cliente, columnas K a M        |

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

`/admin/clientes/<id>/diagnostico/datos-propuesta` equivale a la hoja «DATOS PROPUESTA» con el diseño del dashboard (`src/components/diagnostico/datos-propuesta.tsx`):

- La misma franja de resumen de la matriz (`ResumenIndicadores`: elegibilidad, tipo de servicio, pasivo total, honorarios, cuota y costo del proceso), calculada con la matriz guardada.
- Tarjetas con la cabecera azul del Excel: «Datos del cliente» y «Honorarios y datos del contrato» lado a lado; «Deudas del cliente» a todo el ancho, con la clase en su color y el TOTAL en amarillo (si no cabe, solo la tabla se desplaza, con el mismo sombreado de «Obligaciones» y foco de teclado para desplazarla); y «Observaciones jurídicas», «Situación / urgencia del cliente» y «Objetivo del cliente».
- Las etiquetas son las que espera el prompt (clase en mayúsculas, «> 90 días», «Sin garantía», «SI»/«NO»). El tipo de servicio y «Requiere centro de conciliación» se ven en pantalla como en la franja y en Diagnóstico («Acuerdo de pago», «Sí») y salen con el texto exacto del prompt («Acuerdo de Pago», «SI») al imprimir y en la copia como texto. Si hay alertas de nivel error, la hoja, la impresión y el texto empiezan con «REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA» y la lista de errores, como exige el prompt; los avisos solo se ven en pantalla.
- **Imprimir o guardar PDF:** se ocultan el encabezado, las pestañas y la franja; la hoja lleva su propio encabezado (Insolvencia Efectiva, cliente y fecha) y las seis secciones van en una columna, numeradas y en el orden del Excel y de la copia como texto (1. Datos del cliente … 6. Honorarios). Los colores del Excel se imprimen aunque el navegador tenga desactivados los gráficos de fondo (`print-color-adjust: exact`), las tarjetas pequeñas no se parten entre páginas y la tabla de deudas se parte entre filas.
- **Copiar como texto** usa `datosPropuestaComoTexto()`, el mismo formato que recibe el prompt de la propuesta.
- **Sin matriz guardada:** la pestaña sigue visible y, en lugar de la franja, un estado vacío explica que la hoja se arma con la matriz y lleva a la pestaña Diagnóstico.

En la fase de propuestas con IA esta misma estructura (`construirDatosPropuesta()`) alimentará el generador.

## Listas

`/admin/clientes/<id>/diagnostico/listas` equivale a la hoja «Listas» del Excel: los catálogos de las listas desplegables y los parámetros del motor, de solo lectura (`src/components/diagnostico/listas-diagnostico.tsx`, componente de servidor). Todo sale de `catalogos.ts` y `parametros.ts`, los mismos valores que usa el motor, así que nunca se desalinea con los cálculos.

- **Franja:** aviso de solo lectura («Estos valores se configuran en el sistema; para cambiarlos contacta al equipo técnico.») y los parámetros clave: % de honorarios por defecto, cuotas, gastos del proceso y rangos de tarifas del centro.
- **Tarjetas**, en tres filas de una columna ancha y otra angosta (una sola columna en pantallas angostas). Las columnas se alinean arriba y ninguna tarjeta se estira: el espacio sobrante queda fuera de las tarjetas, no como un hueco en blanco dentro de ellas. Contenido: «Clases de crédito» (con su color, qué incluye y base legal; la guía completa está en «Guía de clases»), «Mora» (con el texto de la lista de la matriz y cuál cuenta para la elegibilidad), «Tipo de garantía» (con la clase esperada), «Tipos de servicio» (descripción y si el centro de conciliación es obligatorio), «Estado civil», «% de honorarios» (sugeridos y por defecto), «Cuotas de honorarios» (de 1 al máximo, `opcionesCuotas()`, en una cuadrícula de 6, 10, 15 o 20 columnas según el ancho de la tarjeta, para que las 60 cuotas llenen filas completas), «Tarifas del centro de conciliación» (desde, hasta y tarifa; si no cabe, la tabla se desplaza y recibe el foco del teclado), «Gastos del proceso» y «Reglas de elegibilidad».
- Los datos del cliente para el encabezado salen de `obtenerEncabezadoDiagnostico()` (`src/lib/datos/diagnostico.ts`): solo id, nombre, estado de la propuesta y fecha de la matriz.

## Modelo de datos

- `public.diagnosticos`: uno por cliente (`cliente_id` único). Guarda solo las entradas; los indicadores no se almacenan y se recalculan con los parámetros vigentes.
- `public.obligaciones`: una fila por deuda, con `orden`.
- `public.guardar_diagnostico(cliente, diagnóstico, obligaciones, actualizado_en)`: crea o actualiza la matriz, reemplaza las obligaciones y pasa la propuesta «pendiente» a «en diagnóstico», todo en una sola transacción. Solo admin. Si `actualizado_en` no coincide con el `updated_at` actual (otra persona guardó antes), rechaza el guardado y el panel pide recargar.
- RLS: ambas tablas son exclusivas del rol admin; el rol cliente y el acceso anónimo no ven nada.
- Al guardar la primera vez, una propuesta en estado «pendiente» pasa a «en diagnóstico» (el cliente lo ve en su portal) dentro de la misma transacción.
- Pruebas: `supabase/tests/diagnostico.test.ts` (políticas, atomicidad, restricciones) y `src/lib/diagnostico/*.test.ts` (motor).
