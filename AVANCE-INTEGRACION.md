# Estado de la integración entre main y feature/backend-api

Esta rama recoge únicamente el avance de resolución de archivos de configuración. **No es un merge completo** de las dos ramas y no contiene todos los cambios de main posteriores a su ancestro común.

Se revisaron los archivos `.dockerignore` y `.gitignore` de backend, `.gitignore` del frontend y `backend/prisma/migrations/migration_lock.toml`.

Quedan pendientes de integrar y verificar:

- Esquemas Prisma y migraciones de ambas implementaciones.
- API, servicio de builds, autenticación y persistencia de ensambles.
- Importador OpenDB y ausencia de datos inventados en producción.
- Integración de PCdex AI y navegación del frontend.
- Dockerfile, variables de entorno, dependencias y documentación del backend.
- Validación de tipos y pruebas con SQL Server después de unificar.

No ejecutar estas migraciones sobre una base existente como si se tratara de una actualización validada. Las versiones deben reconciliarse y probarse antes de desplegar.

Referencias comparadas: `main` en `2f865c3` y `feature/backend-api` en `098226d`.
