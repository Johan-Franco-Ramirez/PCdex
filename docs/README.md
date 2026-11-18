# Documentación de PCdex

Esta carpeta organiza el conocimiento técnico y la evolución del proyecto. Los documentos describen lo observado en los archivos y las tareas realizadas; las decisiones pendientes se identifican expresamente.

Los documentos oficiales se encuentran en esta carpeta. Los registros de trabajo, diagnósticos y guías técnicas están agrupados en [seguimiento](seguimiento/README.md).

Las imágenes de apoyo y diagramas están agrupadas en la carpeta `image`.

| Documento | Contenido |
|---|---|
| [API v1](seguimiento/api-v1-catalogo-compatibilidad-generacion.md) | Contrato, reglas, pruebas y puesta en marcha del catálogo y generador. |
| [Estado del proyecto](seguimiento/estado-proyecto.md) | Tecnologías, estructura y límites de lo verificado. |
| [Inventario actual y pendientes](seguimiento/inventario-actual-y-pendientes.md) | Funciones, estructura, datos, Docker y próximos pasos. |
| [Análisis de migración a MySQL](seguimiento/analisis-migracion-mysql.md) | Dependencias de SQL Server, opciones Docker y plan de transición. |
| [Implementación MySQL](seguimiento/migracion-mysql-implementacion.md) | Cambios, arranque, pruebas realizadas y validaciones pendientes. |
| [Persistencia de cuentas](seguimiento/persistencia-cuentas-mysql.md) | Verificación paso a paso del registro y del volumen MySQL. |
| [Bitácora](seguimiento/bitacora.md) | Cambios por fecha, motivo, comprobaciones y pendientes. |
| [Docker: diagnóstico](seguimiento/docker-diagnostico.md) | Estado comunicado, significado de los resultados y pasos de diagnóstico. |
| [Jira: organización](seguimiento/jira-organizacion.md) | Estructura propuesta y tareas para registrar manualmente. |
| [Plantilla de cambios y pull](seguimiento/plantilla-cambios-pull.md) | Formato para documentar intervenciones y resultados de un pull. |

## Forma de trabajo

Cada intervención debe actualizar la bitácora y, cuando corresponda, su documento temático. El registro debe describir el problema, la solución, el motivo, archivos afectados, pruebas con sus resultados y pasos pendientes. Explicar las funciones modificadas con entradas, comportamiento y resultados cuando ayude a aprender o mantener el código; no afirmar que algo funciona si no se ha probado.

Cuando se haga un pull, registrar las referencias y archivos efectivamente cambiados, el resultado de conflictos y las pruebas realizadas. No copiar valores de `.env`, contraseñas, tokens ni registros con información sensible.

La documentación se mantiene en el proyecto local. Git y Jira no se actualizan automáticamente: registrar una tarea o enviar cambios al repositorio remoto requiere realizar esas acciones por separado.

- [Comparación con GitHub del 17 de noviembre](seguimiento/comparacion-github-2026-11-17.md).

- [Respaldo y revisión de integración](seguimiento/respaldo-integracion-2026-11-17.md).
