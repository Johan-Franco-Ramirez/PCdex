# API v1: catálogo, compatibilidad y generación

## Enlaces en la API e imágenes del catálogo (17 de noviembre de 2026)

Se incorporó `catalog.presenter.ts`: `catalogResponse` conserva la información del componente, entrega `image` con la URL guardada o `null` y construye `links_tiendas` a partir del nombre codificado. Amazon y Mercado Libre reciben enlaces de **búsqueda**, no enlaces a productos u ofertas verificadas. Los resultados pueden variar y deben revisarse en la tienda. Se aplicó a las rutas de catálogo `/api/components` y `/api/v1/components`, tanto a los listados como a los detalles; las respuestas de creación y edición anteriores también usan el presentador. La respuesta calculada no se escribe en MySQL y no cambia el esquema.

El frontend conserva `image` al transformar la respuesta y `ComponentImage.tsx` la muestra en las tarjetas y en la ficha. Ante una URL ausente, inválida o que no cargue, aparece una ilustración genérica identificada. Las URL se aceptan si usan HTTP/HTTPS o una ruta local absoluta sin host; no se aceptan URLs con credenciales. Se agregó un campo URL en Administración, que usa el campo `image` ya existente y requiere la cuenta administrativa y MFA que exige la API. Para cada producto: entrar como administrador, abrir Administración, editar el registro, pegar una URL de imagen del modelo correcto y guardar. Verificar que se muestre en la ficha; una URL puede dejar de funcionar o bloquear la carga externa. No se cargan archivos con este campo.

Se hizo una consulta de solo lectura a la API anterior y a MySQL mediante una instancia temporal del backend actualizado: inicialmente había 40 componentes activos, ninguno con imagen guardada; los dos listados entregaron enlaces de búsqueda para los 40. La instancia temporal se detuvo después. Se identificó una imagen de la [tienda oficial MSI](https://us-store.msi.com/PRO-B650-P-WIFI) y se guardó su URL en `motherboard-1` (MSI PRO B650-P WIFI), solo porque coincidían ID, nombre y campo de imagen vacío. Una segunda consulta confirmó 1 imagen y 39 faltantes. El repositorio trae fichas de ejemplo sin imágenes; cada fotografía restante debe verificarse y registrarse. No se ha confirmado que las imágenes de terceros permitan incrustación o uso en PCdex.

Se comprobaron `npm run typecheck`, `npm test` y `npm run test:api:v1` del backend, además de `npm run build`, `npm run lint`, `npm test` y `npm run test:store-links` del frontend. Las pruebas HTTP automatizadas usan Prisma simulado; la prueba de 40 componentes usó la base real y realizó consultas GET. Por separado se actualizó exclusivamente la URL de la placa MSI indicada y se verificó su presencia mediante la API. Falta reconstruir los contenedores y verificar la interfaz en navegador, junto con la carga de imágenes verificadas.

**Jira propuesto:** recopilar y asociar las 39 fotografías faltantes, identificando fuente y modelo; comprobar la carga de las 40 imágenes en fichas y tarjetas. Aceptación: cada registro activo tiene URL pertinente, la imagen carga en la aplicación, se puede actualizar desde Administración y se muestra la alternativa genérica al fallar. Depende de revisar los derechos y la disponibilidad de las fuentes.

## Enlaces a tiendas en el frontend (17 de noviembre de 2026)

La ficha real del catálogo se muestra en `frontend/src/pages/ComponentDetail/CatalogDetail.tsx`. Se incorporó `StoreLinks` desde `frontend/src/components/catalog/StoreLinks.tsx`, que presenta por separado «Ver en Amazon» y «Ver en Mercado Libre» cuando cada URL está disponible. Los enlaces se abren en otra pestaña con `noopener noreferrer`; se ignoran valores vacíos, inválidos, que no usen HTTP o HTTPS, o que incluyan credenciales. No se comprueba que la tienda, el producto, el precio o la disponibilidad sean correctos.

El tipo opcional `StoreLinks` se añadió en `frontend/src/types/hardware.ts`. `ApiComponent` y `toCatalog` en `frontend/src/services/api.ts` conservan `links_tiendas` para que llegue desde la respuesta hasta la ficha. El componente usa Tailwind: una columna por defecto y dos desde el punto de corte `sm`. Los vínculos tienen indicador de enfoque y texto accesible que advierte de la nueva pestaña. La tarjeta del catálogo no se cambió.

**Estado previo de esta sección:** el frontend consultaba `/api/components` y el backend local aún no devolvía `links_tiendas`. Esa limitación se atendió en la actualización descrita al comienzo de este documento; queda pendiente reconstruir Docker.

Las comprobaciones `npm run build`, `npm run lint`, `npm test` y `npm run test:store-links` pasaron en `frontend`. La última prueba renderiza React con datos simulados y verifica mapeo, ambos enlaces, ausencia de datos, enlaces individuales y URLs inválidas. La presentación en navegador móvil/escritorio y la integración con una API real que entregue los enlaces quedan pendientes. La imagen Docker aún requiere reconstrucción por el usuario: el acceso al daemon fue denegado en la sesión anterior.

**Jira propuesto:** verificar que `/api/components` entregue `links_tiendas` en la versión usada; probar la ficha en móvil y escritorio con dos enlaces, uno solo y ninguno. Criterio: los enlaces válidos se muestran, conservan su destino y se abren de forma segura; los ausentes o inválidos no generan botones. Depende de una fuente real de enlaces.

Fecha: 17 de noviembre de 2026. Entrega implementada sobre los archivos locales de `feature/backend-api`; no incluye cambios de ramas remotas aún no integradas. No se modificó el esquema Prisma, no se ejecutaron migraciones ni se escribieron registros. La generación devuelve una propuesta; guardarla es una operación distinta ya existente.

## Arquitectura y archivos

Las relaciones reales del esquema son `cpu`, `gpu`, `motherboard`, `ram`, `storage`, `psu`, `case` y `cooler`. `includeSpecs` las incluye y `fromRow` las transforma al formato `specs` utilizado por PCdex. El campo `category` identifica la categoría relacionada. Solo se consultan componentes activos para el catálogo y la generación.

| Archivo | Responsabilidad |
|---|---|
| `backend/src/modules/catalog/catalog.service.ts` | Consultar componentes, relaciones y detalle. |
| `backend/src/modules/catalog/catalog.routes.ts` | Validar parámetros y exponer el catálogo. |
| `backend/src/modules/compatibility/compatibility.service.ts` | Consultar IDs y evaluar reglas de compatibilidad. |
| `backend/src/modules/compatibility/compatibility.routes.ts` | Validar el cuerpo y exponer el resultado. |
| `backend/src/modules/builds/builds-generation.service.ts` | Buscar una combinación completa y dentro del presupuesto. |
| `backend/src/modules/builds/builds.service.ts` | Reexportar la generación conservando el guardado anterior. |
| `backend/src/modules/builds/builds.routes.ts` | Validar presupuesto y perfil; exponer la generación. |
| `backend/src/app.ts` | Registrar las rutas después de los controles de seguridad. |
| `backend/tests/api-v1.test.ts` | Probar reglas y HTTP con Prisma simulado. |

La app ya tenía `express.json()`, CORS, sesiones, límite de solicitudes y CSRF; se reutilizan. Las rutas anteriores se conservan.

## Contrato HTTP

Las respuestas exitosas usan `{ "success": true, "data": ... }`, el formato existente de PCdex. Los errores usan `{ "success": false, "error": { "message": "..." } }`.

| Método y ruta | Entrada | Salida en `data` |
|---|---|---|
| `GET /api/v1/components` | Opcionales `category=cpu` y `q=Ryzen`. `q` busca en el nombre según la intercalación de MySQL. | Lista de componentes activos con `specs`. |
| `GET /api/v1/components/:id` | ID existente y activo. | Componente y especificaciones; 404 si no está disponible. |
| `POST /api/v1/compatibility/validate` | `{ "componente_ids": ["id-real-1", "id-real-2"] }` | `{ "compatible": boolean, "errores": string[], "advertencias": string[] }`. |
| `POST /api/v1/builds/generate` | `{ "presupuesto": 6000000, "uso": "gaming" }` | Perfil, presupuesto, total COP, IDs, componentes y compatibilidad. |

Perfiles: `gaming`, `estudio`, `trabajo`, `oficina` y `diseño`. Categorías: `cpu`, `gpu`, `motherboard`, `ram`, `storage`, `psu`, `case` y `cooler`. Los IDs de ejemplo son marcadores: utiliza los que devuelva tu catálogo.

Los POST requieren una cookie de sesión y `X-CSRF-Token`. Se obtienen consultando `GET /api/auth/session`; ambos deben permanecer privados. Las reglas de origen y CORS existentes siguen vigentes.

## Reglas y límites

`validarBuild` comprueba IDs activos y admite una pieza por categoría. `evaluarBuild` conserva el motor previo para socket, tipo de RAM, generación/chipset, caja, almacenamiento, refrigeración y dimensiones. En la nueva API se sustituye únicamente la regla de potencia por `(TDP CPU + vatios GPU + 100 W) <= (vatios fuente × 0,8)`. La ruta anterior conserva su fórmula original: pueden discrepar y conviene acordar una regla compartida.

Una selección incompleta o con datos insuficientes se considera no verificada: `compatible` es `false` y se explica en `advertencias`. Las incompatibilidades se muestran en `errores`. Aun con `compatible: true`, se adjunta una advertencia: no se verifican BIOS, conectores ni todas las dimensiones; el consumo es una estimación, no una medición completa.

`generarBuild` consulta componentes activos con precio y busca las ocho categorías usando las mismas reglas. Compara dinero en centavos. Para cada perfil prioriza categorías según la heurística existente de PCdex y ordena algunos candidatos por precio: un precio superior no demuestra mejor rendimiento y no se garantiza una solución óptima. Se necesitan fichas suficientes. La búsqueda se limita a 10.000 candidatos y 100.000 intentos; si se supera el límite, responde 503 sin afirmar que no existe solución. Responde 422 si faltan candidatos, el presupuesto mínimo es mayor o no hay combinación verificable tras completar la búsqueda.

## Pruebas y puesta en marcha

Desde `backend`:

```powershell
npm run typecheck
npm test
npm run test:api:v1
```

El 17 de noviembre pasaron typecheck, tres pruebas existentes y dos pruebas nuevas. Las nuevas usaron Prisma simulado y un servidor HTTP local: probaron catálogo, detalle, CSRF, generación, presupuesto, IDs inexistentes, duplicados, datos ausentes y límite de potencia. No confirman consultas reales a MySQL.

Desde la raíz, para reconstruir la imagen con los cambios cuando Docker esté disponible:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --build
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps
```

El puerto web predeterminado es 8081; utiliza el configurado localmente si se cambió. La reconstrucción puede reiniciar servicios y conserva el volumen. No uses `down -v` ni ejecutes seed o migraciones automáticamente sobre datos existentes.

Ejemplo PowerShell para consultar el catálogo y generar una propuesta; la consulta de sesión conserva la cookie y permite usar el token sin imprimirlo:

```powershell
$pcdexBase = 'http://localhost:8081'
$componentes = Invoke-RestMethod "$pcdexBase/api/v1/components"
$componentes.data | Select-Object id, name, category, estimatedPrice
$sesion = Invoke-RestMethod "$pcdexBase/api/auth/session" -SessionVariable pcdexSesion
$cabeceras = @{ 'X-CSRF-Token' = $sesion.data.csrfToken }
$cuerpo = @{ presupuesto = 6000000; uso = 'gaming' } | ConvertTo-Json
Invoke-RestMethod "$pcdexBase/api/v1/builds/generate" -Method Post -WebSession $pcdexSesion -Headers $cabeceras -ContentType 'application/json' -Body $cuerpo
```

Si faltan fichas o precios necesarios, la generación puede responder 422; revisa los datos antes de interpretarlo como fallo de conexión. Si la web usa otro origen, revisa la configuración CORS. El daemon Docker rechazó el acceso desde esta sesión: reconstrucción, conexión real y persistencia siguen pendientes de comprobación.

## Jira: tareas propuestas

- **Validar API v1 con MySQL real:** reconstruir, listar componentes, validar ocho IDs reales y generar una build; aceptar cuando respuestas y errores coincidan con el contrato sin alterar datos. Depende de Docker y catálogo suficiente.
- **Unificar cálculo de potencia:** decidir y probar una regla compartida entre la API anterior y v1; documentar la decisión antes de cambiar el comportamiento existente.
- **Mejorar generación:** acordar métricas verificables por uso, paginación y búsqueda eficiente; aceptar con datos reales y casos de presupuesto insuficiente y búsqueda agotada.
