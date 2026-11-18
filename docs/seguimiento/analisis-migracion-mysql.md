# Análisis: SQL Server, MySQL y configuraciones Docker

**Fecha:** 12 de noviembre de 2026. Revisión estática del repositorio y de la información comunicada por Johan. No se ha ejecutado una migración ni se ha verificado directamente el motor Docker desde esta sesión.

## Estado actual

Johan informa que el entorno volvió a funcionar tras utilizar el puerto 8081; queda como resultado comunicado por el usuario. No se verificó independientemente el contenido de la base ni si las imágenes se reconstruyeron con el último código.

El archivo `backend/prisma/schema.prisma` declara `provider = "sqlserver"` y tipos nativos como `@db.NVarChar`. `backend/prisma/migrations/migration_lock.toml` identifica el proveedor como `mssql`; hay una migración inicial SQL Server. La aplicación y los scripts incluyen mensajes, cadenas y operaciones propias de ese motor, por ejemplo `scripts/prepare-db.ts` usa `CREATE DATABASE` con sintaxis SQL Server. `app.ts` identifica la base como SQL Server en la respuesta de salud.

MySQL instalado en Windows no cambia el motor usado por Compose ni convierte los datos. Aiven y Render son los proveedores conversados; no se comprobó aquí la creación de sus servicios ni sus regiones.

## Archivos Docker y datos

| Archivo | Uso observado | Base y publicación | Volumen lógico |
|---|---|---|---|
| `docker-compose.functional.yml` | Entorno que el usuario acaba de iniciar, perfil `app` | SQL Server 2022 en puerto local 1434; aplicación en 8080 por defecto o 8081 con variables temporales | `pcdex-functional-sql-data` |
| `docker-compose.yml` | Otra definición de la aplicación | SQL Server 2022 en puerto local 1433; frontend en 80 | `pcdex-sql-data` |
| `docker-compose.backend.yml` | Incluye la configuración funcional | Depende de la configuración incluida | No define un tercer volumen independiente |

Los nombres físicos pueden llevar prefijo del proyecto Compose. Dos archivos que definen servicios parecidos no implican que existan dos bases activas o copias idénticas. El alias tampoco representa por sí mismo otro contenedor. La última lista facilitada antes de iniciar el entorno solo mostraba un proyecto `pcdex`; se desconoce el listado actual y el contenido de los volúmenes. No eliminar archivos, imágenes, contenedores o volúmenes hasta identificarlos. Si se retira una configuración en el futuro, conservar el historial y revisar referencias en README, scripts y equipo; eliminar un archivo Compose no elimina automáticamente su volumen.

## Trabajo necesario para MySQL

1. Acordar si MySQL es el motor definitivo y si los datos existentes (usuarios, contraseñas, TOTP, catálogo, ensambles y sesiones) deben trasladarse. Probar restauración de una copia antes de cualquier cambio que afecte datos.
2. Preparar un entorno MySQL separado para desarrollo o pruebas. No reutilizar un volumen SQL Server para MySQL; cada motor gestiona sus propios archivos. Evitar abrir su puerto a la red pública y usar credenciales de privilegios limitados.
3. Adaptar el esquema Prisma al proveedor MySQL: tipos nativos, longitudes, índices, relaciones, collation y diferencias de sensibilidad a mayúsculas. Revisar campos de texto extenso y decimales. No asumir que sustituir todos los tipos por el mismo tipo sea correcto.
4. Mantener el historial SQL Server y preparar un historial inicial propio para MySQL en una copia de trabajo, con la estrategia de migración apropiada para una base nueva o existente. Las migraciones Prisma son específicas del proveedor; no aplicar el SQL de SQL Server a MySQL. Fuente: https://www.prisma.io/docs/orm/v6/prisma-migrate/understanding-prisma-migrate/limitations-and-known-issues
5. Adaptar configuración, cadena de conexión, scripts de creación/pruebas y mensajes SQL Server; verificar consultas, transacciones, claves foráneas, importación y autenticación. Revisar compatibilidad del conector: https://www.prisma.io/docs/orm/v6/overview/databases/mysql
6. Si hay datos que conservar, definir y ensayar exportación/importación y validación de conteos, relaciones, importes y acceso. Tratar secretos TOTP y sus claves con especial cuidado. Mantener SQL Server intacto para recuperación hasta validar el resultado.
7. Ejecutar pruebas unitarias, integración y navegador contra una base MySQL aislada; comprobar registro, inicio de sesión, catálogo, compatibilidad, ensambles y persistencia tras reinicio.
8. Preparar por separado conexión TLS y secretos de Aiven/Render, comprobar límites y región de los servicios reales y documentar despliegue y reversión. Consultar la documentación de conexión del proveedor: https://aiven.io/docs/products/mysql/howto/connect-from-mysql-workbench

No se ha creado un servicio de Aiven ni ejecutado un cambio de proveedor en esta revisión. El plan es una propuesta, no un procedimiento de migración ya ensayado.

## Paso seguro de identificación

Desde PowerShell normal, con Docker abierto, listar recursos sin eliminar nada:

```powershell
docker compose ls -a
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker volume ls --format 'table {{.Name}}'
```

Para confirmar los volúmenes montados solo por los contenedores de base conocidos, si existen:

```powershell
docker inspect --format '{{range .Mounts}}{{.Name}} -> {{.Destination}}{{println}}{{end}}' pcdex-pcdex-db-1
```

La ausencia de un volumen en la lista de montajes de ese contenedor no demuestra que no contenga datos; no publicar credenciales ni la salida completa de `docker inspect`.
