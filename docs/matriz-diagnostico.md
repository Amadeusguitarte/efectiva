# Matriz de diagnóstico

Reemplaza el Excel «Matriz_Diagnostico_Insolvencia_Efectiva_Ley_2445_2025». El equipo la diligencia en el panel (`/admin/clientes/<id>/diagnostico`) durante la reunión con el cliente; los indicadores se recalculan mientras se escribe y se guardan al final.

El cliente nunca ve la matriz: solo recibe la propuesta final en su portal.

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

## Diferencias deliberadas respecto al Excel

- **Gastos del proceso.** El Excel calculaba `120.000 + 12.000 × COUNTA(B14:B35)`, pero ese rango es la numeración fija de la tabla (siempre 21 celdas), así que sumaba **372.000** en todos los casos; así se cotizaron las propuestas hasta ahora y así se conserva (`gastosProceso.fijos = 372_000`, `porObligacion = 0`). Si el criterio real es 12.000 por acreedor, cambia a `fijos: 120_000` y `porObligacion: 12_000`.
- **% de cada deuda.** El Excel dividía el capital (no el total) entre el pasivo; aquí se usa el total para que los porcentajes sumen 100 %.
- **Pasivo total de «Datos propuesta».** La hoja del Excel sumaba solo 16 de las 20 filas; aquí siempre se suman todas.
- **Redondeo.** Honorarios y cuota se redondean al peso.
- **Centro con descuento mayor que la tarifa.** El Excel daba un valor negativo; aquí queda en 0 y se marca error.

## Parámetros

Están en `src/lib/diagnostico/parametros.ts`: umbral y mínimos de elegibilidad, porcentajes sugeridos, cuotas máximas, gastos del proceso y la tabla de tarifas del centro de conciliación. Cambiarlos requiere un despliegue; las pruebas de `calcular.test.ts` protegen los casos de referencia (el ejemplo del Excel y una propuesta real).

## Datos para la propuesta

`/admin/clientes/<id>/diagnostico/datos-propuesta` equivale a la hoja «DATOS PROPUESTA»: los datos del cliente, la tabla de acreencias con las etiquetas que espera el prompt (clase en mayúsculas, «> 90 días», «Sin garantía», «SI»/«NO»), las notas y los honorarios. Se puede imprimir o guardar como PDF y copiar como texto para el prompt de la propuesta. Si hay alertas de nivel error, tanto la impresión como el texto empiezan con «REQUIERE REVISIÓN ANTES DE GENERAR PROPUESTA» y la lista de errores, como exige el prompt. En la fase de propuestas con IA esta misma estructura (`construirDatosPropuesta()`) alimentará el generador.

## Modelo de datos

- `public.diagnosticos`: uno por cliente (`cliente_id` único). Guarda solo las entradas; los indicadores no se almacenan y se recalculan con los parámetros vigentes.
- `public.obligaciones`: una fila por deuda, con `orden`.
- `public.guardar_diagnostico(cliente, diagnóstico, obligaciones, actualizado_en)`: crea o actualiza la matriz, reemplaza las obligaciones y pasa la propuesta «pendiente» a «en diagnóstico», todo en una sola transacción. Solo admin. Si `actualizado_en` no coincide con el `updated_at` actual (otra persona guardó antes), rechaza el guardado y el panel pide recargar.
- RLS: ambas tablas son exclusivas del rol admin; el rol cliente y el acceso anónimo no ven nada.
- Al guardar la primera vez, una propuesta en estado «pendiente» pasa a «en diagnóstico» (el cliente lo ve en su portal) dentro de la misma transacción.
- Pruebas: `supabase/tests/diagnostico.test.ts` (políticas, atomicidad, restricciones) y `src/lib/diagnostico/*.test.ts` (motor).
