# Respaldo y revisión para integrar PCdex — 17 de noviembre de 2026

## Respaldo

Se creó `backups/pcdex-respaldo-20261117-092908.zip` (4.953.612 bytes), ignorado por Git. Incluye 79 archivos modificados o sin seguimiento detectados por Git, incluidos los .env modificados, un manifiesto SHA-256, el HEAD y el estado Git. Se comprobó la integridad ZIP y el hash de cada archivo guardado. Contiene información privada: no compartir ni subir. Los archivos eliminados se identifican en el estado y pueden recuperarse desde el commit base; la copia no incluye todos los archivos ignorados, dependencias completas ni bases de datos o volúmenes. Para restaurar, extraer primero en una carpeta separada y comparar antes de copiar; no sobrescribir cambios posteriores. Los archivos de `files/` conservan sus rutas relativas.

## Diferencias relevantes

HEAD local 098226dda178ceb84c84d1da8146353030346605; main PCdex consultado 545663e7a61285d194ad97568678e88c1aa2ca68. Se compararon metadatos Git y archivos de GitHub fijados al SHA. El árbol local tiene cambios sin commit y el remoto contiene nueve commits adicionales. No se hizo una simulación completa de merge, por lo que no se presenta una lista definitiva de conflictos.

- `backend/src/app.ts`: local monta `/api/v1/components`, `/api/v1/compatibility`, `/api/v1/builds`, sesiones y medidas de seguridad; remoto monta `/api/componentes`, `/api/builds`, `/api/auth` y rutas remotas. Integrar ambos contratos y protección explícitamente.
- Rutas de catálogo, ensambles y compatibilidad existen como archivos nuevos locales y también fueron agregadas en main con contenido y organización diferentes. Deben conciliarse como posibles conflictos de adición y verificarse respuestas, validación y reglas.
- Ambos esquemas Prisma observados usan MySQL, pero main añade modelos de verificación Google y correo y tiene otra secuencia de migraciones; no asumir compatibilidad de esquemas ni de datos. Revisar el historial real y respaldar la base antes de cualquier migración potencialmente riesgosa, con autorización específica.
- También coinciden cambios en dependencias, `builds.service.ts`, servidor, Docker y archivos frontend de catálogo, administración y API. Conservar la funcionalidad local y contrastar contratos y autenticación.

## Próximos pasos propuestos

1. Preparar una copia aislada con el commit remoto fijado y los archivos locales respaldados, sin exponer secretos en commits.
2. Conciliar rutas, servicios, middleware, dependencias y esquema por separado. Mantener compatibilidad de clientes y revisar autorización.
3. Ejecutar pruebas de API, seguridad, compilación de frontend y backend, y pruebas de integración con una base de prueba separada. Analizar migraciones antes de tocar datos existentes.
4. Comparar el resultado y resolver conflictos antes de incorporarlo al árbol de trabajo. No se ha hecho pull, merge, instalación, cambio de configuración ni migración. Esta revisión no demuestra que la aplicación funcione.

## Propuesta Jira

Descripción: integrar main de PCdex preservando API v1 local. Pasos: conciliar rutas, servicios y autenticación; analizar Prisma; ejecutar pruebas; documentar resultados. Aceptación: contratos locales y remotos verificados, seguridad y compilación aprobadas, estrategia de datos revisada. Dependencias: acceso a entorno de prueba aislado y decisión sobre migraciones. Tarea propuesta localmente, no creada en Jira.
## Avance de integración aislada

Se generó backups/integracion-pcdex-20261117 a partir de main 545663e y backups/base-integracion-20261117 desde 098226d. Se incorporaron 69 archivos locales sin divergencia y se combinó automáticamente la prueba SQL; 23 rutas requieren resolución manual, enumeradas en integration-report.json. Los archivos divergentes conservan la versión remota en la copia; las versiones locales permanecen en el proyecto y respaldo. Se omitieron los .env y node_modules modificado. No es una integración terminada, ni se ejecutaron pruebas o migraciones. El worktree administrado integracion-pcdex se creó desde el mismo commit y permanece intacto.
