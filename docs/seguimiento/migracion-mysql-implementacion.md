# Adaptación de PCdex a MySQL

> Actualización del 16 de noviembre: las entradas Compose usan el mismo proyecto MySQL; el archivo histórico local del motor anterior fue retirado a petición de Johan. El problema de persistencia reportado todavía no se ha resuelto ni probado. Ver [persistencia de cuentas](persistencia-cuentas-mysql.md). La información anterior en este documento conserva el contexto de decisiones pasadas.

## Estado

**Resultado posterior:** Johan informa que la puesta en marcha funcionó adecuadamente después de las instrucciones de migración, seed y arranque. No se recibieron salidas individuales ni evidencia de cada flujo; la persistencia tras reinicio, la prueba integral y las pruebas automatizadas contra MySQL siguen pendientes de verificación específica.

**Actualización:** Johan respondió «correcto» después de las instrucciones para aplicar la migración y ejecutar el seed, pero no compartió sus salidas; aún no se puede confirmar por separado que ambos terminaron bien. El siguiente paso es verificar `prisma migrate status` y después iniciar y probar la aplicación. La conexión a MySQL ya fue observada en el diagnóstico anterior.

El usuario solicitó cambiar a MySQL e indicó que no necesita una base SQL Server anterior. La aplicación se preparó para MySQL sin copiar datos de SQL Server. **La conexión real, migraciones en una base y el recorrido completo siguen pendientes de validación**: el motor Docker rechazó el acceso desde esta sesión. El entorno SQL Server previo no se eliminó.

## Cambios

- `backend/prisma/schema.prisma`: proveedor MySQL, `NVarChar` convertido a `VarChar` y datos extensos `LongText`; se mantuvieron modelos, claves y lógica. Hay que verificar collation, longitudes e índices en el servidor real.
- `backend/prisma/migrations/202611120001_mysql_initial/`: SQL inicial generado con Prisma 6 a partir del nuevo esquema. El esquema y migraciones previos están en `backend/prisma/sqlserver-archive/` como referencia; no se aplican a MySQL.
- `docker-compose.mysql.yml`: proyecto Docker independiente `pcdex-mysql`, MySQL 8.4, volumen propio, puerto de base local 3307, servicio backend y frontend. El usuario de aplicación tiene permisos sobre la base creada por el contenedor; root tiene contraseña independiente.
- `backend/scripts/init-mysql.mjs`: crea `backend/.env.mysql` con credenciales aleatorias solo si no existe; no muestra sus valores y no sobrescribe archivos. Se ejecutó una vez en este equipo. Conservar sus secretos: cambiar las contraseñas allí no cambia la contraseña ya inicializada en el volumen MySQL.
- `backend/scripts/prepare-db.ts`: requiere una URL MySQL y ejecuta migraciones y seed en una base ya existente. El seed añade datos de demostración; no se ejecutó durante esta intervención.
- `backend/src/app.ts`: identifica MySQL en `/health` y evita mencionar SQL Server en el error general. Se conservan las reglas de compatibilidad, catálogo, sesiones y recomendaciones.
- Scripts de uso local actualizados a `.env.mysql`. Los comandos que creaban bases temporales automáticamente para SQL Server se deshabilitaron con mensaje explícito hasta adaptarlos y probarlos; las pruebas unitarias no dependen de base.

## Validación realizada

Prisma 6.12 validó el esquema y generó el cliente MySQL y el SQL inicial con `migrate diff`. La configuración Compose pasó `config --quiet`. Pasaron compilación, comprobación de tipos y tres pruebas unitarias del backend. No se aplicaron migraciones a ninguna base ni se probaron usuarios, datos, TLS o acceso a Aiven.

## Primera ejecución local — PowerShell

**Actualización del diagnóstico:** Johan ejecutó `prisma migrate status`. Prisma identificó la base MySQL `pcdex`, encontró la migración `202611120001_mysql_initial` y la indicó como **no aplicada**. Por ello, el siguiente paso es ejecutar `npm run db:deploy` y revisar su resultado antes de volver a ejecutar el seed. No se ha comprobado aún que la aplicación de la migración termine correctamente; si falla, conservar la salida y detenerse para diagnosticar.

**Incidencia comunicada:** el seed devolvió `P2021` porque no encontró `Category` en la base consultada. El error muestra que la aplicación llegó al servidor MySQL, pero no aclara si la migración falló, no se aplicó o se utilizó otra base. El resultado de `db:deploy` todavía no se ha recibido. No volver a ejecutar seed hasta comprobar el estado.

Diagnóstico de solo lectura desde la raíz:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app run --rm --no-deps backend npx prisma migrate status
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app run --rm --no-deps backend ls -l prisma/migrations/202611120001_mysql_initial
```

Compartir la salida y la del comando anterior `npm run db:deploy`, ocultando información privada. El listado confirma si la imagen contiene el archivo de migración; `migrate status` informa el estado del historial. No usar `migrate reset` ni `migrate resolve` sin diagnosticar el estado real. Ninguno de estos dos comandos aplica migraciones ni carga datos.

Desde la carpeta raíz de PCdex, con Docker Desktop abierto. El entorno SQL Server anterior puede seguir utilizando 8081; se propone 8082 para probar MySQL sin detenerlo. Si 8082 está ocupado, escoger otro puerto y cambiar ambas variables de forma coherente.

```powershell
$env:APP_HOST_PORT = '8082'
$env:APP_ORIGIN = 'http://localhost:8082'
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml up -d --wait pcdex-db
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app build backend frontend
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app run --rm --no-deps backend npm run db:deploy
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app run --rm --no-deps backend npm run seed
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --wait
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a
```

Ejecutar uno por uno y detenerse si alguno falla. Abrir `http://localhost:8082`; comprobar catálogo, registro, acceso y guardado de ensambles. Si el catálogo usa datos demo deben estar identificados. Para ejecutar después usar las mismas variables y último `up`; `db:deploy` y `seed` son para preparación y no deben repetirse como solución a errores sin revisar el mensaje. La base MySQL tendrá datos iniciales separados; no contiene cuentas SQL Server automáticamente.

El puerto 3307 debe estar disponible. El volumen MySQL se inicializa una única vez: no cambiar claves en `.env.mysql` para una base ya creada. El puerto HTTP y origen de PowerShell duran solo la sesión. No publicar el contenido del archivo secreto ni ejecutar `down -v`.

Si falla, obtener `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a` y `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app logs --tail 80 pcdex-db backend frontend`; ocultar datos sensibles antes de compartir.

## Pendientes antes de dar por terminada la migración

1. Ejecutar los comandos anteriores y comprobar migración, seed, rutas y persistencia tras reiniciar.
2. Adaptar y probar los scripts antiguos de creación de bases aisladas y la prueba completa de navegador para MySQL; no se consideran aprobados. La prueba HTTP de seguridad requiere conexión local disponible.
3. Revisar funciones y diferencias reales de MySQL, integridad referencial, collation y búsquedas con un servidor en ejecución.
4. Configurar Aiven por separado con TLS y secretos, evaluar disponibilidad y plan, y probar la conexión antes de desplegar Render. No se crearon servicios de pago.
5. Una vez verificado el entorno y evaluadas las referencias del equipo, decidir qué configuración SQL Server histórica conservar o retirar. No borrar volúmenes como parte de esta transición.
