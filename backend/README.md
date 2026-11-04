# PCdex: primera entrega funcional

## Estado real

La primera entrega manual está verificada de extremo a extremo con React/Vite, Express y Prisma/SQL Server. Pasaron las pruebas HTTP de autenticación, roles, TOTP, propiedad, snapshots y persistencia, y el recorrido en Chromium con un reinicio real del proceso del backend. La aplicación Docker está disponible localmente en http://localhost:8080.

Hay 40 componentes demo en la base de desarrollo, cinco por categoría. El seed repetido no añade duplicados. Las pruebas utilizan bases SQL independientes, credenciales temporales y servidores en puertos libres; no usan cuentas ni ensambles de desarrollo. No hay un administrador predeterminado: crea el tuyo mediante los pasos de este documento.

El fallo anterior de Docker está resuelto. Consulta VERIFICATION.md para los comandos ejecutados, los resultados y los pendientes de las siguientes entregas.

## Requisitos

- Node.js 22 LTS o posterior compatible con las dependencias.
- npm.
- SQL Server 2022 local o Docker Desktop con motor Linux operativo.
- Dos terminales para backend y frontend durante desarrollo.
- Google Authenticator u otra aplicación TOTP para el administrador.

## Inicio local recomendado (PowerShell)

Desde la raíz del repositorio:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run local:init
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml up -d pcdex-db
npm --prefix backend run prisma:generate
npm --prefix backend run db:prepare:local
npm --prefix backend run dev:local
```

En otra terminal:

```powershell
npm --prefix frontend run dev
```

Abre http://localhost:5173. El backend escucha en 127.0.0.1:3000. Vite redirige /api al backend. Usa el origen localhost y no 127.0.0.1 en el navegador para coincidir con FRONTEND_ORIGIN.

`local:init` genera contraseñas y claves aleatorias en `backend/.env.functional`, ignorado por Git. Nunca sobrescribe un archivo existente. En este equipo ese archivo ya se ha creado; no vuelvas a ejecutar el inicializador si existe. No se modificó el `.env` anterior. `db:prepare:local` crea solo una base con prefijo pcdex_ si no existe, ejecuta migraciones pendientes y carga el seed. No borra ni reinicia tablas.

El compose funcional usa un volumen nuevo `pcdex-functional-sql-data` y el puerto 1434. Conserva los volúmenes anteriores. Las variables y contraseñas deben mantenerse estables después de crear el volumen: cambiar el archivo no cambia la contraseña de una instancia existente. No uses `down -v` para solucionar un problema de conexión.

Si ya tienes SQL Server, configura su cadena de conexión y usa los comandos sin sufijo `:local` desde backend. `npm run dev`, `npm run db:deploy`, `npm run seed`, `npm run admin:create` leen `.env` y las variables del proceso. `db:prepare` es un inicializador opcional que requiere permisos para crear bases; `db:deploy` necesita una base ya disponible.

### Variables

| Variable | Uso |
|---|---|
| DATABASE_URL | Cadena Prisma de SQL Server; incluye database, user, password y opciones TLS |
| SESSION_SECRET | Secreto aleatorio de al menos 32 caracteres para firmar cookies |
| TOTP_ENCRYPTION_KEY | Otra clave aleatoria estable de al menos 32 caracteres para AES-256-GCM |
| FRONTEND_ORIGIN | Origen exacto permitido; desarrollo http://localhost:5173 |
| HOST / PORT | Interfaz y puerto del backend; predeterminados 127.0.0.1 y 3000 |
| NODE_ENV | production activa cookies Secure; requiere HTTPS |
| TRUST_PROXY | 1 solo cuando exista exactamente un proxy confiable delante del servidor |
| MSSQL_SA_PASSWORD | Contraseña local de la instancia Docker |
| DOCKER_DATABASE_URL | Cadena SQL que utiliza el hostname pcdex-db dentro de Compose |
| VITE_API_URL | Opcional al compilar frontend para un backend en otro origen; normalmente vacío |

No cambies las claves de sesiones/TOTP sin un procedimiento de rotación: invalidarías sesiones o impedirías descifrar secretos. `trustServerCertificate=true` se reserva al entorno local. Producción requiere certificados válidos y HTTPS; no se ha desplegado ningún servicio público.

### Aplicación completa con Docker

Cuando el motor esté operativo:

```powershell
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml --profile app build
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml --profile app run --rm backend npm run db:prepare
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml --profile app up -d
```

Abre http://localhost:8080. Nginx sirve React y redirige /api al backend. La construcción y el arranque de ambas imágenes se verificaron. También se ejecutaron migraciones y seed desde el contenedor Linux del backend, y Chromium comprobó el catálogo público, las cookies HttpOnly y el bloqueo del panel administrativo. El compose original conserva su volumen anterior y ahora exige variables externas, sin contraseñas incrustadas; no lo utilices con claves nuevas contra un volumen antiguo sin revisar antes su configuración. `docker-compose.backend.yml` es un alias del compose funcional.

## Crear administrador y configurar TOTP

Una vez preparada la base:

```powershell
$env:ADMIN_EMAIL = Read-Host 'Correo del administrador'
$adminSecret = Read-Host 'Contraseña (mínimo 12 caracteres)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSecret).Password
npm --prefix backend run admin:create:local
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_EMAIL
```

La contraseña solo se usa para ese comando y se almacena mediante scrypt con sal aleatoria. El comando rechaza cuentas existentes para evitar cambiar sus privilegios o contraseñas sin revisión. El registro público siempre crea USER.

Inicia sesión desde la web. En el primer acceso administrativo aparecerá la clave de configuración para añadir PCdex a Google Authenticator. Confirma con el código de seis dígitos. Mientras no se complete este paso, el servidor no concede acceso administrativo. Los accesos posteriores requieren contraseña y un nuevo código. El mismo intervalo TOTP aceptado no se puede reutilizar: espera el siguiente código si acabas de verificarlo.

El secreto se cifra con AES-256-GCM y solo se devuelve durante el alta pendiente, después de validar la contraseña. No aparece en el perfil ni en el catálogo. No hay todavía recuperación de contraseña ni recuperación automática del segundo factor: conserva las claves y define un procedimiento administrativo antes de producción.

## Arquitectura

- `src/modules/auth`: sesiones persistidas en SQL, acceso, roles, CSRF y TOTP.
- `src/modules/catalog`: consultas y escrituras de componentes mediante Prisma.
- `src/modules/builds`: propiedad, transacciones y snapshots de configuraciones.
- `src/config/database.ts`: cliente Prisma y configuración compartida.
- `src/compatibility.ts`: motor determinista reutilizado.
- `src/services.ts`: selección, totales y recomendador existente.
- `src/validation.ts`: validación por categoría e importes.
- `prisma/schema.prisma`: usuarios, roles, sesiones, categorías, componentes, ocho tablas técnicas y configuraciones con detalles.
- `prisma/migrations`: migración inicial no destructiva; no se utiliza db push ni migrate reset.
- `scripts`: preparación local, importación, administrador y pruebas SQL aisladas.

Las especificaciones se guardan en tablas especializadas. Las listas técnicas cortas se serializan en columnas NVARCHAR de su tabla; no hay una tabla de hardware llena de campos ajenos a la categoría. Diagnósticos y snapshots se serializan en NVARCHAR(MAX), porque Prisma para SQL Server no ofrece el tipo Json de otros conectores.

Los importes usan DECIMAL(18,2) en SQL y suma de centavos enteros en los servicios. Se aceptan importes positivos hasta 10^12 COP con máximo dos decimales. Un precio desconocido es null; el total parcial genera advertencia.

## Contrato REST

Éxito: `{ "success": true, "data": ... }`. Error: `{ "success": false, "error": { "message": "..." } }`. Se utilizan 200, 201, 400, 401, 403, 404, 409, 413, 429 y 500. Los errores no exponen credenciales ni detalles del servidor.

| Método | Ruta | Acceso |
|---|---|---|
| GET | /health | Público; comprueba SELECT 1 en SQL Server |
| GET | /api/auth/session | Público; usuario actual y token CSRF |
| POST | /api/auth/register | Público, con CSRF; crea USER |
| POST | /api/auth/login | Público, con CSRF; contraseña |
| POST | /api/auth/totp/setup | Administrador pendiente de TOTP |
| POST | /api/auth/totp/verify | Administrador pendiente de TOTP |
| POST | /api/auth/logout | Invalida la sesión y elimina cookie |
| GET | /api/categories | Público |
| GET, POST | /api/components | Consulta pública / creación ADMIN con MFA |
| GET, PUT, DELETE | /api/components/:id | Consulta pública / edición y desactivación ADMIN con MFA |
| GET | /api/components/category/:category | Público |
| GET, POST | /api/builds | Solo sesión autenticada; configuraciones propias |
| GET, PUT, DELETE | /api/builds/:id | Exclusivamente propietario |
| POST | /api/compatibility/check | Público con CSRF; buildId privado exige propietario |
| POST | /api/recommendations | Público con CSRF; recomendador básico conservado |

Para Postman/Insomnia: primero GET /api/auth/session, conserva las cookies y envía `X-CSRF-Token` en toda mutación, incluso login. Después del registro, login o TOTP, utiliza el nuevo csrfToken de la respuesta. Si envías Origin, debe coincidir con FRONTEND_ORIGIN. Las cookies son HttpOnly y SameSite=Lax; se firman, las sesiones se guardan en SQL y expiran en ocho horas. El reto TOTP caduca a los cinco minutos. Se limita el módulo de autenticación a 30 solicitudes por IP cada 15 minutos; ese limitador es por proceso y debe sustituirse por almacenamiento compartido si se despliegan varias instancias.

GET components admite `category`, `q`, `page` y `limit` (1 a 100), y `active=true|false`. Incluye meta con total y paginación. Los IDs permiten letras, números, guiones y guiones bajos hasta 60 caracteres. DELETE components desactiva: no borra piezas de configuraciones existentes. PUT reemplaza todos los campos editables y no permite cambiar de categoría. Los campos técnicos omitidos se eliminan de la ficha.

### Ejemplos de cuerpos JSON

Registro:

```json
{"email":"usuario@example.invalid","username":"Explorador","password":"Reemplaza por una contraseña privada"}
```

Selección manual y cálculo (COMPATIBLE para el seed completo):

```json
{"budget":5000000,"componentIds":["cpu-1","gpu-1","motherboard-1","ram-1","storage-1","psu-1","case-1","cooler-1"]}
```

Guardar ensamble:

```json
{"name":"Mi PC","mode":"manual","profile":"gaming","budget":5000000,"componentIds":["cpu-1","gpu-1","motherboard-1","ram-1","storage-1","psu-1","case-1","cooler-1"]}
```

El servidor deriva ownerId de la sesión; rechaza ownerId, owner y visibility enviados por el cliente. Configuraciones ajenas devuelven 404. Al consultar una configuración, se devuelven sus piezas y precios históricos y la lista changes si el catálogo actual ha variado. Al editar/guardar se recalcula con las fichas y precios actuales. Se admiten borradores incompletos o incompatibles con estado visible. Una pieza desactivada solo puede conservarse si ya pertenecía al borrador del propietario. La evaluación de ese borrador admite buildId para validar esta excepción sin permitir agregar piezas inactivas nuevas.

Para probar incompatibilidad, combina cpu-4 con motherboard-1. Una selección vacía devuelve UNVERIFIED. COMPATIBLE significa que pasaron las reglas implementadas; no es una garantía universal de montaje. BIOS, conectores adicionales y aspectos no modelados requieren revisión con el fabricante. Las recomendaciones no usan IA ni garantizan un óptimo global.

## Conservar e importar los datos JSON anteriores

El servidor ya no utiliza el archivo JSON como persistencia. `backend/data/pcdex.json` se conserva intacto. No se importa silenciosamente porque sus configuraciones carecen de propietario.

Desde backend, con DATABASE_URL y claves configuradas:

```powershell
$env:IMPORT_OWNER_EMAIL = Read-Host 'Cuenta existente que recibirá los ensambles antiguos'
node --env-file=.env.functional --import tsx scripts/import-json.ts data/pcdex.json
Remove-Item Env:IMPORT_OWNER_EMAIL
```

El importador conserva IDs válidos. Si un ID ya existe, lo informa y mantiene la versión SQL sin sobrescribirla. Repetirlo no duplica IDs. Las configuraciones se vuelven a validar y valorar con el catálogo SQL, por lo que los importes antiguos no se transfieren como si siguieran vigentes. El proceso puede completarse parcialmente ante un conflicto; revisa sus mensajes y vuelve a ejecutarlo después de resolverlo. Haz una copia del archivo original antes de una migración operativa; el comando no lo modifica.

## Pruebas

```powershell
npm --prefix backend run build
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:sql:local
npm --prefix backend run test:browser:local
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run test:e2e
npm --prefix frontend run test:docker
```

`typecheck` incluye código, scripts y pruebas. `test:sql:local` crea una base nueva pcdex_test_<UUID>, aplica migraciones y ejecuta el recorrido HTTP real. Usa claves aleatorias de prueba; no toca las tablas de desarrollo. Conserva la base de pruebas para inspección y muestra su nombre; no elimina ninguna base ni volumen. El usuario de conexión necesita permiso para crear bases. La prueba verifica también cierre y reapertura del servidor HTTP y lectura con el mismo cliente de sesión SQL; el reinicio real del proceso forma parte del guion manual.

Playwright requiere Chromium: `node frontend/node_modules/playwright/cli.js install chromium`.

`npm --prefix backend run test:browser:local` automatiza la prueba completa: crea una base pcdex_test_browser_<UUID>, aplica migraciones, ejecuta el seed y el comando de creación del administrador con una contraseña aleatoria, inicia backend y Vite en puertos libres y recorre la aplicación con Chromium. Configura TOTP desde la propia interfaz, modifica el catálogo, registra un usuario, comprueba el cambio, detecta y resuelve una incompatibilidad, guarda y edita un ensamble, reinicia el proceso backend y comprueba su recuperación y la privacidad ante otra cuenta. Los servidores temporales se cierran al terminar y la base se conserva para inspección. Los secretos no se muestran ni se escriben en archivos.

Para ejecutar `npm --prefix frontend run test:e2e` directamente, arranca antes la aplicación contra una base exclusiva de pruebas y configura E2E_BASE_URL, E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD. Si el administrador aún no tiene TOTP, la prueba lo configura mediante la interfaz; si ya está configurado, requiere E2E_ADMIN_TOTP_SECRET. El recorrido modifica una ficha y crea cuentas: no lo ejecutes contra una base operativa. La prueba de errores intercepta respuestas 503 para comprobar la interfaz; no sustituye al recorrido real. El límite de intentos permanece activo. Una conexión de diagnóstico puede registrar ECONNRESET durante el reinicio intencionado del backend; las verificaciones posteriores deben completarse correctamente.

`npm --prefix frontend run test:docker` comprueba la aplicación de los contenedores en http://localhost:8080 (o DOCKER_APP_URL): catálogo de al menos 40 componentes, ocho categorías, proxy Nginx/API, cookie HttpOnly y rechazo del panel administrativo sin sesión. Solo consulta datos y crea una sesión anónima; no registra usuarios ni modifica piezas. Guarda una captura del catálogo en frontend/test-results/docker-catalog.png, ignorada por Git.

## Guion de aceptación de la primera entrega

1. Preparar SQL y seed, crear administrador y confirmar TOTP.
2. Iniciar sesión como administrador y modificar la descripción de AMD Ryzen 5 7600.
3. Registrar un usuario normal y comprobar el cambio en catálogo. La cuenta normal no debe ver administración ni poder usar su API de escritura.
4. En Constructor, indicar presupuesto y combinar cpu-4 con motherboard-1: debe aparecer un conflicto de socket.
5. Sustituir la CPU por cpu-1 y completar con gpu-1, ram-1, storage-1, psu-1, case-1, cooler-1: deben actualizarse diagnóstico y total del servidor.
6. Guardar y comprobar que aparece en Mis configuraciones privadas.
7. Cerrar sesión, detener y volver a iniciar el backend sin borrar datos. Entrar de nuevo y cargar el mismo ensamble.
8. Modificarlo y verificar que conserva sus cambios después de recargar.
9. Iniciar sesión con otra cuenta. No debe aparecer el ensamble de la primera cuenta; GET, PUT y DELETE sobre su ID deben devolver 404.
10. Desactivar una pieza utilizada: el ensamble histórico debe seguir siendo consultable y advertir el cambio al cargarlo.

## Límites de esta entrega

El flujo central es manual. Se conserva el recomendador REST; los modos automático y mixto aún no tienen integración visual completa. Quedan pendientes Google OAuth, compartir/duplicar, IA, recuperación de cuenta y segundo factor, auditoría ampliada e integración con comercios. Los favoritos y la selección aún no guardada son temporales; las ofertas de comparación están identificadas como demo. No hay pagos, carritos, ventas ni inventario comercial.

Las dependencias instaladas mantienen vulnerabilidades reportadas por npm; no se ejecutó audit fix --force ni una migración de versiones mayores. Antes de producción deben revisarse esas dependencias, el despliegue TLS, la recuperación de cuentas, la limpieza programada de sesiones caducadas y los respaldos de SQL Server.
