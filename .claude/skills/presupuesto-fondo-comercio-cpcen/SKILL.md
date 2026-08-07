---
name: presupuesto-fondo-comercio-cpcen
description: Arma presupuestos de honorarios profesionales para transferencias de fondo de comercio (Ley 11.867) usando el calculador de honorarios mínimos del CPCEN (Neuquén). Úsala cuando el usuario pida cotizar, presupuestar o estimar honorarios de una compraventa/transferencia de fondo de comercio, valuación de negocio en marcha o due diligence de un comercio.
---

# Presupuesto de fondo de comercio — CPCEN Neuquén

## Restricción fundamental

El calculador del CPCEN **no tiene un ítem "fondo de comercio"**. Verificado sobre las
27 categorías. El presupuesto SIEMPRE se arma por composición: descomponer el encargo
en tareas elementales y mapear cada tarea al ítem más específico del nomenclador.

Nunca inventes ítems ni importes. Todo valor debe salir de la vista previa del sistema.

## Contexto del sistema

- URL base: `https://cpcen.org.ar/webapps/modulos/pre/`
- Pantallas: `hmComitente.php` (datos), `hmElegirCat.php` (categorías),
  `hmSeleccionar.php?cat=N` (ítems), `hmVistaPrevia.php` (total e impresión),
  `hmNuevoPresupuesto.php` (reset — destructivo, pedir confirmación antes de usar).
- Requiere sesión iniciada del matriculado.
- Resolución vigente: 777/2026. Los encabezados de `hmSeleccionar.php` todavía dicen
  "727/2024": es una etiqueta vieja, ignorala.
- Valor del módulo verificado al 07/08/2026: $10.500. **Reverificalo siempre**, cambia.

### IDs de categoría

1 Valor hora profesional · 8 Societario · 12 Administrativo-Contable · 18 Ganancias ·
26 Bienes Personales · 30 IVA/Internos · 34 Monotributo · 40 Procedimiento y Vs. ·
83 Renta financiera · 84 Inspecciones · 52 Ingresos Brutos · 58 Convenio Multilateral ·
65 TISH/EMPROTUR · 226 Haberes régimen general · 235 Casas particulares · 239 Previsional ·
244 Otros servicios · 104 Lic. en economía · 110 Gestión empresarial ·
128 Sistemas administrativos · 142 Comercialización · 163 Producción ·
176 Económico-financiera · 192 Gestión del talento · 209 Desarrollo sostenible ·
216 Otros ámbitos de gestión · 222 Valor hora (Lic. Administración)

## Criterios de armado

1. **Composición por etapas cronológicas del encargo (Ley 11.867).** Recorrer las seis
   etapas de abajo en orden. Garantiza cobertura completa sin ítems huérfanos.
2. **Máxima especificidad.** Elegir el ítem cuya descripción nombre explícitamente la
   tarea. Solo por analogía si no existe uno específico, y dejándolo asentado.
3. **Sin solapamiento.** Un mismo esfuerzo profesional no se factura dos veces.
   Ej.: si va 1.6 Flujo de Fondos, no va 10.5.6. Si va 5.5.4 (DGI + DGR), no va 6.1.5.
4. **Cantidad = repeticiones reales del trámite**, no unidades de esfuerzo.
   Ej.: 5.5.4 con cantidad 2 = alta del adquirente + baja del transmitente.
5. **Complejidad según el tamaño real del negocio**, no por defecto. El sistema arranca
   todo en "Alta", que suele sobredimensionar comercios chicos. Ver reglas abajo.
6. **Divisor** solo si el honorario se prorratea entre partes o profesionales.
7. **Todo lo dudoso va como opcional**, listado aparte, no cargado en el sistema.

## Plantilla base (núcleo, 9 ítems)

| Etapa | Ítem | Descripción | Módulos (Alta) |
|---|---|---|---|
| 1. Encuadre | 1.3 | Consulta Escrita | 39 |
| 2. Relevamiento / due diligence | 10.2.1 | Diagnóstico de situación actual | 240 |
| 3. Determinación patrimonial | 3.2 | Armado de Estados Contables | 260 |
| 3. Inventario art. 2 Ley 11.867 | 1.4 | Certificación de Ingresos y otras certificaciones | 39 |
| 4. Valuación — proyección | 1.6 | Flujo de Fondos | 70 |
| 4. Valuación — núcleo | 10.5.3 | Informes para decisiones en fusiones y adquisiciones | 480 |
| 4. Valuación — diagnóstico | 10.5.7 | Análisis de rentabilidad, endeudamiento y riesgo | 480 |
| 5. Pasivo laboral (arts. 225-228 LCT) | 8.5 | Estimación costos indemnizatorios / liquidación final | 20 |
| 6. Trámites fiscales | 5.5.4 | Inscripciones DGI y DGR SOCIEDADES (cantidad 2) | 120 c/u |

Total de referencia con todo en Alta y módulo a $10.500: **$19.614.000**.

### Sustituciones y opcionales

- Si el adquirente es persona humana (no sociedad): reemplazar 5.5.4 por **5.5.1**
  Inscripción AFIP Persona Física.
- Si se instrumenta como cesión de cuotas: agregar **2.3** (transferencia de cuotas o
  modificación de contrato) y **2.4** (rúbrica de libros).
- Sujeto obligado UIF: agregar **1.7** Certificación Fondos Lícitos.
- Personal que se transfiere: agregar **8.1** y **8.2** por empleado.
- Si el vendedor no lleva contabilidad organizada: agregar **3.1**.

## Reglas de complejidad

Aplicar el mismo nivel a los tres ítems pesados (10.2.1, 10.5.3, 10.5.7), que son los
que mueven el total. Criterio orientativo por tamaño del fondo:

- **Baja**: comercio unipersonal, sin empleados o hasta 2, sin sucursales, contabilidad
  simple, sin activos intangibles relevantes.
- **Media**: PyME con contabilidad organizada, hasta ~10 empleados, una sola jurisdicción.
- **Alta**: múltiples sucursales o jurisdicciones, marcas/licencias/franquicias,
  litigios o contingencias, o valuación con dictamen para terceros.

Los trámites (5.5.x, 8.x, 1.3, 1.4) suelen ir en Baja o Media salvo justificación.

**Ojo:** los valores por complejidad son propios de cada ítem, no un multiplicador
uniforme. Verificado: en 1.3, Baja = Media = 20 módulos y Alta = 39. Nunca estimes el
efecto de cambiar la complejidad; cargalo y leé la vista previa.

## Procedimiento operativo

1. Verificar sesión iniciada y leer el valor del módulo en `hmVistaPrevia.php`.
2. Si hay un presupuesto previo cargado, **preguntar** antes de usar
   `hmNuevoPresupuesto.php` (borra todo).
3. Cargar datos del comitente en `hmComitente.php`: nombre, CUIT y vigencia.
   Si el usuario no los dio, pedirlos; no inventar.
4. Por cada categoría involucrada: navegar a `hmSeleccionar.php?cat=N`, tildar los
   ítems, ajustar cantidad/complejidad/divisor y pulsar ACTUALIZAR PRESUPUESTO.
   El botón envía **solo** la categoría en pantalla; hay que repetir por categoría.
5. Leer `hmVistaPrevia.php` y presentar el desglose al usuario **antes** de imprimir.
6. Imprimir solo con confirmación explícita.

### Trampas de automatización verificadas

- Las selecciones persisten en sesión: al volver a una categoría los tildes siguen ahí.
- Asignar el valor del `<select>` de complejidad por DOM/JS **no persiste** al enviar.
  Usar interacción nativa: click sobre el combo y flechas + Enter.
- Reenviar una categoría con un ítem ya cargado no siempre actualiza su complejidad.
  Si hay que corregirla: destildar → actualizar → volver a tildar con el valor nuevo →
  actualizar. Confirmar el cambio en la vista previa.
- Los importes solo aparecen en la vista previa, nunca en la pantalla de selección.

## Entregable

Devolver siempre: tabla con código de ítem, concepto, cantidad, complejidad e importe;
total; supuestos asumidos; ítems opcionales no incluidos y bajo qué condición
corresponderían; y la aclaración de que son honorarios **mínimos** de referencia según
la resolución vigente, sujetos al valor del módulo a la fecha.
