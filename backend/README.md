# Backend PCdex

API REST: Node.js 24, Express 5, TypeScript estricto, Prisma 6.19.0 y SQL Server 2022. Cada paquete tiene sus propias dependencias, configuración y comandos; el frontend consume la API mediante `/api`.

## Instalación

```powershell
cd backend
Copy-Item .env.example .env
# Edita SQLSERVER_PASSWORD y DATABASE_URL con credenciales locales reales.
npm ci
npm run prisma:generate
npm run build
npm test
```

`schema.prisma` usa el conector `sqlserver` de Prisma 6.19.0, fijado igual que Prisma Client. No mezclar esta configuración con la de Prisma 7, que utiliza adaptadores y otra configuración de conexión.

## SQL Server en Docker

Requiere Docker Engine y Docker Compose. Usa una contraseña propia que cumpla la política de SQL Server, no el marcador de `.env.example`.

```powershell
docker compose up -d --build
```

Compose inicia SQL Server, espera su healthcheck, crea `pcdex` si no existe, aplica las migraciones versionadas y arranca la API. No importa catálogo automáticamente ni descarga OpenDB. `migrate deploy` es un proceso independiente del arranque de Express. La contraseña del volumen existente debe coincidir con la configurada.

Para trabajar con Node fuera del contenedor:

```powershell
docker compose up -d sqlserver db-init
npm run prisma:deploy
npm run seed -- --dry-run
npm run seed
npm run dev
```

El `DATABASE_URL` de `.env` debe apuntar a localhost; Compose usa `sqlserver` como host interno. API: http://localhost:3000. CORS permite el origen configurado, por defecto http://localhost:5173. El healthcheck `/health` comprueba el proceso; `/health/ready` comprueba la BD. SQL Server requiere una plataforma compatible (habitualmente x86-64).

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

- `GET /api/componentes`: filtros `categoria`, `marca`, `precio_min`, `precio_max`, `q`, `page`, `limit`. Marca es coincidencia exacta según collation de SQL Server; `q` busca nombre o marca con contains. Paginación por defecto 1/20, máximo 100 por página. Orden estable por ID; filtro, conteo y paginación se ejecutan en BD. La respuesta es `{data, meta: {page, limit, total, pages}}`.
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

Consulta un snapshot de componentes cotizados en SQL Server. Busca una pieza por cada categoría, realiza poda por coste mínimo, socket, RAM, potencia y cooler, y vuelve a ejecutar las reglas completas antes de aceptar cada solución.

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

- Prisma 6 / SQL Server: https://www.prisma.io/docs/orm/v6/overview/databases/sql-server
- OpenDB: https://github.com/buildcores/buildcores-open-db
- Esquemas originales: https://github.com/buildcores/buildcores-open-db/tree/main/schemas

La diferencia entre un esquema de especificaciones y una fuente de precios es deliberada. Conserva la atribución y licencia del conjunto de datos descargado. No se incluye ni redistribuye una descarga del catálogo en este paquete.


## Estado de la integración (pendiente)

Las rutas `/api/componentes` y `/api/components`, la administración, los ensambles y el importador utilizan `Componente`. Las tablas históricas `Component` se conservan; si contienen datos, la migración se detiene y requiere convertirlos y revisar posibles colisiones de identificadores antes de continuar.

El archivo `src/seed.ts` crea únicamente categorías y roles; no inserta productos ficticios. Los datos sintéticos de la otra rama se encuentran solo en `tests/fixtures.remote.ts`. La API protegida requiere configurar `SESSION_SECRET` y `TOTP_ENCRYPTION_KEY`.
