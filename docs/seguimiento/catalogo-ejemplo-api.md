# Catálogo de ejemplo para la API

## Objetivo y límites

`backend/api/ejemplos/catalogo-verificado.json` contiene un ejemplo por cada una de las ocho categorías actuales. Es una **base mínima de cobertura por categoría**, no una afirmación de que exista un mínimo de catálogo aprobado para el proyecto. Los nombres y campos técnicos incluidos se contrastaron con las fuentes del fabricante enlazadas a continuación; no se verificaron precios, existencias ni comercios.

El archivo conserva el formato `version`, `components`, `builds` que acepta el importador existente. Cada elemento utiliza los campos validados por la API. El campo `priceKind: DEMO` es una opción obligatoria del modelo actual; `estimatedPrice: null`, `priceSource: null` y `priceReferenceDate: null` indican expresamente que no existe un precio verificado. No son cotizaciones y no debe mostrarse cero como precio real.

## Fuentes de los ejemplos

| ID | Fuente oficial | Campos técnicos respaldados |
|---|---|---|
| `ejemplo-cpu-ryzen-5600` | [AMD Ryzen 5 5600](https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-5-5600.html) y [AMD lanzamiento de procesadores Ryzen](https://www.amd.com/en/newsroom/press-releases/2022-3-15-amd-launches-the-ultimate-gaming-processor-brings.html) | AM4, 6 núcleos, 12 hilos, frecuencia base 3.5 GHz, TDP 65 W y arquitectura Zen 3. |
| `ejemplo-gpu-rx-7600` | [AMD Radeon RX 7600](https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600.html) | 8 GB GDDR6 y potencia de tarjeta de referencia 165 W. No se afirma una longitud aplicable a todas las marcas. |
| `ejemplo-board-b550-a-pro` | [MSI B550-A PRO](https://www.msi.com/Motherboard/B550-A-PRO/Specification) | AM4, B550, formato ATX y memoria DDR4. La compatibilidad con procesadores concretos depende de la BIOS. |
| `ejemplo-ram-kf432c16bbk2-16` | [Kingston KF432C16BBK2/16](https://www.kingston.com/es/memory/search?partid=KF432C16BBK2%2F16) | DDR4, kit de 16 GB y dos módulos. El fabricante señala DDR4-3200 en MT/s; se omitió `frequencyMHz` para no confundir tasa de transferencia con frecuencia física. |
| `ejemplo-ssd-snv2s-1000g` | [Kingston SNV2S/1000G](https://www.kingston.com/en/memory/search/discontinuedmodels?partid=SNV2S%2F1000G) | SSD NVMe de 1 TB, representado como 1000 GB. La página lo identifica entre modelos discontinuados; no implica disponibilidad. |
| `ejemplo-psu-rm750e` | [CORSAIR RM750e CP-9020262-NA](https://www.corsair.com/ww/en/p/psu/cp-9020262-na/rme-series-rm750e-fully-modular-low-noise-atx-power-supply-cp-9020262-na) | 750 W de potencia continua y certificación 80 PLUS Gold. |
| `ejemplo-case-4000d-airflow` | [CORSAIR 4000D AIRFLOW CC-9011200-WW](https://www.corsair.com/es/es/p/pc-cases/cc-9011200-ww/4000d-airfl) | Admite formatos ATX, MicroATX y Mini-ITX; longitudes máximas de GPU 360 mm y refrigerador 170 mm. Se normaliza MicroATX a `Micro-ATX` según el formato usado en PCdex. |
| `ejemplo-cooler-nh-u12s` | [Noctua NH-U12S](https://www.noctua.at/en/products/nh-u12s/specifications) | Altura con ventilador de 158 mm y sockets AM4, AM5 y LGA1700. Comprobar la versión y piezas incluidas de cada unidad. |

Fuentes consultadas el 17 de noviembre de 2026. `generation` usa la denominación de arquitectura del fabricante. No se incluyeron valores dudosos, precios inventados ni una lista de generaciones soportadas por la placa sin comprobar CPU y BIOS. Los campos omitidos significan **dato pendiente**, no incompatibilidad. Las fuentes pueden cambiar y deben revisarse al actualizar los datos.

## Validación y uso

Desde la raíz de PCdex:

```powershell
npm.cmd --prefix backend run validate:catalog:example
```

Esta comprobación lee el archivo, valida sus campos con `src/validation.ts`, verifica IDs únicos, precios no informados y al menos un ejemplo de cada categoría. No comprueba automáticamente las páginas externas ni escribe en la base.

El archivo **no se carga automáticamente** ni modifica registros existentes. El importador `scripts/import-json.ts` ejecuta el `seed()` actual antes de importar; por ello también puede agregar los 40 registros de demostración antiguos, conservar IDs existentes y detenerse parcialmente ante errores. No se ha ejecutado con este archivo y no conviene hacerlo sobre datos útiles sin revisar antes esa conducta, hacer respaldo y probar en una base aislada. Los datos antiguos contienen valores simplificados y no se consideran verificados por este documento.

## Relación entre TypeScript, JavaScript y `dist`

`backend/src` contiene el código fuente TypeScript. `npm run build` ejecuta el compilador de TypeScript (`tsc`) de acuerdo con `backend/tsconfig.json`: genera JavaScript en `backend/dist`. En producción `npm start` ejecuta `node dist/server.js`; por eso los `.js` son salida generada para Node.js, no una arquitectura paralela. No convertir ni editar directamente `dist`: una compilación posterior sobrescribiría los cambios. Es normal que TypeScript importe rutas terminadas en `.js` con la configuración ESM/NodeNext; esas rutas corresponden a la salida compilada.

## Pendientes

- Acordar cuántos productos por categoría necesita el MVP y ampliar el catálogo con modelos exactos y fuentes de cada campo.
- Revisar `seed-data.ts`: contiene precios demo y datos simplificados. No asumir que esta nueva muestra corrige automáticamente los registros existentes.
- Definir trazabilidad de fuentes en el propio modelo/API, soporte de `MT/s`, revisión de BIOS y granularidad de modelos de GPU. El esquema actual no incluye campos para fuente técnica por especificación ni datos históricos de precios reales.
- Verificar la persistencia de cuentas MySQL y probar la importación y consultas de extremo a extremo sobre una base de pruebas aislada.
- Reconciliar las métricas de potencia de CPU y GPU: el TDP nominal de CPU y los vatios de tarjeta GPU no son directamente un consumo máximo garantizado. La regla actual es una estimación que necesita revisión para recomendaciones reales.
