# Backend PCdex

API REST con Node.js, Express, Prisma 6.19 y MySQL 8.4. El catálogo y la validación de ensambles se consumen desde el frontend.

## Arranque con Docker

Inicia Docker Desktop y, desde `backend`, ejecuta:

```powershell
docker compose --env-file .env.mysql up -d --build
```

El archivo local `.env.mysql` contiene contraseñas generadas para MySQL. Está excluido de Git. Compose crea una base `pcdex` vacía en el volumen `mysql-data`, aplica la migración de MySQL y arranca la API y el frontend en http://localhost:8081. No importa componentes automáticamente; sigue las instrucciones de datos de abajo para cargar el catálogo. El API está en http://localhost:3000 y `/health/ready` comprueba la conexión.

El volumen anterior de SQL Server y la migración anterior se conservan. MySQL empieza vacío: los datos de SQL Server no se transfieren automáticamente. La migración anterior está en `prisma/migrations-sqlserver` para referencia y no se ejecuta en MySQL.

Para ejecutar Node fuera de Docker, ajusta `DATABASE_URL` en `.env` a `mysql://pcdex:CONTRASEÑA@localhost:3307/pcdex`, usando la contraseña de `.env.mysql`; usa caracteres alfanuméricos o codifica los caracteres especiales de la URL. Prisma lee `.env` automáticamente. Si creas el archivo desde `.env.example`, configura tus propias contraseñas. El usuario y la contraseña se aplican cuando se crea el volumen de MySQL; cambiarlos después requiere actualizar también la cuenta en la base de datos.

## Estructura de datos

El catálogo se almacena en `Componente` y sus ocho tablas de especificaciones. `Usuario` guarda la cuenta y un hash de contraseña; `Sesion` guarda un hash del token y su vencimiento. `Favorito` enlaza usuarios con componentes, y `Ensamble` y `PiezaEnsamble` guardan las configuraciones de cada usuario. Los correos, tokens y favoritos tienen restricciones de unicidad; las claves foráneas protegen las referencias existentes.

El registro e inicio de sesión usan `Usuario` y `Sesion`. El perfil y los favoritos se guardan en MySQL. Ensambles guardados y administración siguen siendo demostraciones locales. Los componentes y precios reales se cargan por separado con el importador; no se crean cuentas ni productos de ejemplo.

## Autenticación

`POST /api/auth/registro` recibe `username`, `email` y `password`; `POST /api/auth/login` recibe `email` y `password`. Ambos devuelven el perfil y una cookie HttpOnly con vencimiento de siete días. `GET /api/auth/sesion` recupera el perfil y `POST /api/auth/logout` invalida la sesión. Las contraseñas se protegen con scrypt y una sal aleatoria; solo se guarda el hash del token de sesión. Las peticiones de escritura comprueban el origen y registro e inicio de sesión tienen un límite básico de intentos por proceso.

`PATCH /api/auth/perfil` actualiza el nombre del usuario autenticado. `GET /api/auth/favoritos` lista sus componentes; `PUT` y `DELETE /api/auth/favoritos/:id` los agregan o retiran de manera idempotente. Las operaciones usan la sesión activa y no reciben el identificador del usuario desde el cliente.

`PATCH /api/auth/perfil/correo` recibe `email` y `currentPassword`; `PATCH /api/auth/perfil/contrasena` recibe `currentPassword` y `newPassword`. Ambos comprueban la contraseña actual y el origen de la solicitud. Al cambiar la contraseña se invalidan las otras sesiones, manteniendo la sesión actual. El correo se actualiza sin verificación mediante mensaje, así que el formulario solicita escribirlo dos veces. Las cuentas que solo tienen Google pueden crear primero una contraseña local tras verificar de nuevo la misma cuenta de Google; la autorización es de un solo uso, está vinculada a la sesión y vence en cinco minutos.

Para desplegar con HTTPS, configura `COOKIE_SECURE=true` y `CORS_ORIGIN` con el origen autorizado; si frontend y API usan dominios diferentes, debe revisarse la política de cookies. El límite de intentos en memoria es local a cada proceso y debe sustituirse por un control compartido al operar varias instancias. Aún no hay verificación de correo ni recuperación de contraseña.

### Acceso con Google

En Google Cloud, configura la pantalla de consentimiento y crea un cliente OAuth de tipo aplicación web. Para Docker local, usa `http://localhost:8081` como origen y `http://localhost:8081/api/auth/google/callback` como URI de redirección autorizada. Si la aplicación está en modo de prueba, agrega la cuenta de Google a los usuarios de prueba.

Agrega a `.env.mysql` los valores privados `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. Mantén `GOOGLE_REDIRECT_URI=http://localhost:8081/api/auth/google/callback` y `FRONTEND_URL=http://localhost:8081` para el entorno Docker. Reinicia con `docker compose --env-file .env.mysql up -d --build`. Para Vite local, configura en `.env` el origen y la redirección correspondientes a `http://localhost:5173` y autorízalos en Google Cloud. En producción, usa HTTPS y las direcciones reales.

El servidor comprueba la firma, audiencia, emisor y vencimiento del ID token con la biblioteca de Google, y valida `state`, PKCE, nonce y correo verificado. El identificador estable de Google se guarda en `Usuario.google_sub`. Una cuenta local con el mismo correo no se vincula automáticamente: usa su contraseña hasta que exista una función explícita de vinculación. Las cuentas creadas con Google pueden crear una contraseña local desde su perfil tras volver a autenticarse con Google.

## Datos reales y precios

Coloca el JSON que descargues en `data/buildcores.json`. El formato está documentado en `data/README.md`; el importador acepta registros agrupados por categoría o un arreglo con categoría explícita. No adivina un payload de API desconocido.

OpenDB no publica precios. `Componente.precio` es `Decimal?` y se almacena como NULL si no hay una cotización. La generación consulta exclusivamente piezas con precio positivo. El catálogo puede mostrar piezas no cotizadas y la validación técnica no inventa precios.

Puedes suministrar `data/precios-cop.json`: un objeto cuyas claves son IDs de OpenDB y cuyos valores contienen `precio` y `moneda: "COP"`. Una alternativa es enriquecer cada registro con `precio` y `moneda: "COP"`. Los USD u otras monedas nunca se convierten automáticamente.

Refrigeracion.tdp_soportado es nullable porque OpenDB no proporciona esa capacidad en su esquema actual. La API emite una advertencia si no puede comprobarla. No inventa capacidad térmica ni deduce TDP de la cantidad de ventiladores.

El importador preserva el `opendb_id`, mapea unidades explícitas (GB y W) y exige los datos técnicos requeridos por cada subtipo. Los registros incompletos se reportan y el lote se rechaza antes de escribir. No hay seeds de catálogo inventado. RAM usa capacidad total; si falta, multiplica cantidad de módulos por capacidad individual.

El seed es idempotente mediante upsert. No cambia la categoría de IDs existentes. Valida todo el archivo antes de escribir, pero las transacciones se ejecutan en lotes de 100 para no bloquear una importación grande: un fallo de BD revierte el lote actual y reporta cuántos registros quedaron confirmados. Reejecutarlo permite completar la carga. Los precios previamente cargados se conservan si el nuevo archivo no trae una cotización.

En `prisma/seed.ts` está señalado el punto futuro `actualizarPreciosDesdeMercadoLibre()`. No hay scraping implementado ni peticiones ocultas a Mercado Libre.

## Contrato HTTP

Categorías canónicas: `CPU`, `GPU`, `MOTHERBOARD`, `RAM`, `PSU`, `STORAGE`, `CASE`, `COOLER`. El frontend actual usa nombres españoles; debe adaptarlos al consumir esta API.

- `GET /api/componentes`: filtros `categoria`, `marca`, `precio_min`, `precio_max`, `q`, `page`, `limit`. Marca es coincidencia exacta según collation de MySQL; `q` busca nombre o marca con contains. Paginación por defecto 1/20, máximo 100 por página. Orden estable por ID; filtro, conteo y paginación se ejecutan en BD. La respuesta es `{data, meta: {page, limit, total, pages}}`.
- `GET /api/componentes/:id`: devuelve `{data}` con todos los subtipos; el no aplicable es null. Un ID desconocido devuelve 404.
- `POST /api/builds/validar`: `{ "componente_ids": [ ...IDs reales de la BD... ] }`. Respuesta `{compatible, errores, advertencias}`. Un resultado incompatible devuelve HTTP 200 con `compatible:false`; una petición mal formada devuelve 400.
- `POST /api/builds/generar`: `{ "presupuesto": 4000000, "uso": "gaming" }`. Usos permitidos: `gaming`, `trabajo`, `ofimatica`. No acepta sobreescrituras de datos técnicos desde el cliente. Devuelve IDs, componentes, presupuesto, total, restante, moneda, uso y validación; los importes monetarios se serializan como cadenas decimales para conservar centavos.

Ejemplo de búsqueda:

```text
GET /api/componentes?categoria=CPU&marca=AMD&precio_min=100000&precio_max=2000000&page=1&limit=20
```

No hay respuestas con productos prefijados: con BD vacía, el catálogo devuelve una lista vacía y el generador devuelve un error de catálogo insuficiente.

## Compatibilidad estricta y alcance

`validarBuild(ids)` consulta la base de datos y evalúa los registros, sin confiar en el frontend o en una IA. Para una build completa se exige exactamente un componente de cada una de las ocho categorías. Se rechazan IDs desconocidos, repetidos, categorías duplicadas y relaciones ausentes o inconsistentes.

Reglas:

1. Socket CPU = socket de motherboard (normalización de espacios, guiones y mayúsculas).
2. Tipo de RAM de motherboard = tipo del kit RAM.
3. `(TDP_CPU + TDP_GPU + 100 W) <= 0.8 * vatios_PSU`.
4. Si se conoce el TDP soportado del cooler, debe alcanzar el TDP del CPU.

El cálculo eléctrico usa multiplicación entera para no redondear a favor de una fuente insuficiente. Se advierte sobre BIOS, conectores, dimensiones, formatos admitidos y capacidad térmica desconocida. El margen fijo de 100 W cubre el resto del sistema según la regla solicitada, no representa consumos individuales medidos. El esquema mínimo no permite certificar toda la compatibilidad física. La IA recibe el resultado; no decide si es compatible.

## Generación automática

Consulta un snapshot de componentes cotizados en MySQL. Busca una pieza por cada categoría, realiza poda por coste mínimo, socket, RAM, potencia y cooler, y vuelve a ejecutar las reglas completas antes de aceptar cada solución.

Criterios transparentes basados en especificaciones, sin benchmarks ficticios:
- gaming: maximiza VRAM, luego núcleos y capacidad RAM; a igualdad, menor coste.
- trabajo: maximiza núcleos, luego RAM y VRAM; a igualdad, menor coste.
- ofimatica: menor coste compatible.

Ningún criterio equivale a una predicción de FPS o rendimiento real. El presupuesto se comprueba con Prisma.Decimal. No devuelve builds por encima del presupuesto. La solución es exacta para los datos consultados si termina dentro de los límites.

Límites de seguridad de trabajo: máximo 10000 candidatos cotizados, número de nodos y tiempo configurables por entorno. La búsqueda cede periódicamente el event loop. Un límite excedido devuelve 503; no se presenta como inexistencia de combinaciones ni se devuelve una solución parcial como óptima. Presupuesto insuficiente, catálogo incompleto o ausencia de combinación comprobada: HTTP 422. No hay selección silenciosa de las primeras N piezas por categoría.

## Archivos y responsabilidades

- `src/modules/catalog/`: tipos, validación de filtros, consultas Prisma, controladores y rutas.
- `src/modules/compatibility/`: reglas deterministas, validación del cuerpo, servicio de consulta, controlador y router montado en `/api/builds/validar`.
- `src/modules/builds/`: contrato de generación, búsqueda acotada, servicio de BD, controlador y router.
- `src/config/`: entorno y cliente Prisma.
- `src/shared/`: errores tipados y middleware de respuesta.
- `prisma/schema.prisma`: esquema 1:1 con PK compartida para cada subtipo.
- `prisma/buildcores.mapper.ts`: transformación comprobable del JSON externo.
- `prisma/seed.ts`: lectura, validación, upsert e informe.
- `prisma/migrations/`: migración inicial generada desde el esquema.
- `tests/`: fixtures exclusivos de pruebas, nunca servidos ni insertados por el seed.

## Fuentes consultadas

- Prisma 6 / MySQL: https://www.prisma.io/docs/orm/v6/overview/databases/mysql
- OpenDB: https://github.com/buildcores/buildcores-open-db
- Esquemas originales: https://github.com/buildcores/buildcores-open-db/tree/main/schemas

La diferencia entre un esquema de especificaciones y una fuente de precios es deliberada. Conserva la atribución y licencia del conjunto de datos descargado. No se incluye ni redistribuye una descarga del catálogo en este paquete.

