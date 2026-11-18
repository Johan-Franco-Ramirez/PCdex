# Estado de PCdex

> Actualización posterior del 17 de noviembre de 2026: el backend local ya genera enlaces de búsqueda para los dos catálogos y el frontend admite imágenes guardadas. Una consulta real encontró 40 componentes: uno tiene URL de imagen oficial MSI y 39 siguen sin imagen. Falta reconstruir Docker y recopilar las imágenes restantes. Ver [API y catálogo](api-v1-catalogo-compatibilidad-generacion.md).

> Actualización del 17 de noviembre de 2026: la ficha del frontend admite enlaces opcionales a tiendas. El backend local revisado aún no los expone en la ruta consumida, de modo que su integración real sigue pendiente. Ver [API y enlaces a tiendas](api-v1-catalogo-compatibilidad-generacion.md).

> Actualización del 17 de noviembre de 2026: se añadieron rutas v1 para catálogo, compatibilidad y generación. Las pruebas con Prisma simulado pasaron; queda pendiente comprobarlas con Docker y MySQL reales. Ver [API v1](api-v1-catalogo-compatibilidad-generacion.md).

> Actualización del 16 de noviembre: la configuración actual de PCdex usa MySQL y las entradas Compose apuntan al mismo proyecto. La persistencia de registros reportada por Johan está pendiente de prueba; los apartados siguientes reflejan revisiones anteriores. Ver [persistencia de cuentas](persistencia-cuentas-mysql.md).

> Estado comunicado posteriormente: Johan indicó que la puesta en marcha con MySQL funcionó. La persistencia tras reinicio y las pruebas integrales aún requieren verificación específica.

> Actualización del 12 de noviembre: el esquema y un Compose se adaptaron a MySQL; la conexión y pruebas integrales siguen pendientes. Las referencias a SQL Server describen la revisión anterior. Ver [implementación MySQL](migracion-mysql-implementacion.md).

Revisión de archivos: 12 de noviembre de 2026. Esta es una fotografía parcial del proyecto, no una certificación integral de su funcionamiento.

## Propósito

PCdex orienta la consulta y selección de componentes de computador. La compatibilidad se evalúa mediante reglas implementadas en el backend. El proyecto no realiza ventas internas.

## Tecnologías observadas

- Frontend: React, TypeScript, Vite, Tailwind y Playwright para pruebas de navegador.
- Backend: Node.js, Express y TypeScript. Prisma 6 se utiliza para acceder a la base de datos.
- Base actual del código: SQL Server. El uso de MySQL/Aiven se ha planteado como destino, pero no se ha migrado ni confirmado en esta revisión.
- Ejecución local: Docker Compose y Dockerfiles independientes de frontend y backend.
- Acceso: sesiones, protección CSRF, scrypt y segundo factor TOTP para administración, según el código y la documentación existente.

## Organización observada

`frontend/` contiene la interfaz y su configuración de Vite. `backend/src/app.ts` configura la API y sus rutas; `backend/src/server.ts` conecta Prisma e inicia el servidor. `backend/src/modules/` agrupa módulos como autenticación, catálogo y ensambles; existen directorios adicionales de hardware y compatibilidad cuya implementación no se ha auditado en esta revisión.

En `backend/src/config/database.ts`, `requiredSecret` comprueba que un secreto esté definido y tenga al menos 32 caracteres. Esa longitud no demuestra por sí sola que el valor sea aleatorio. `backend/prisma/` contiene el esquema y las migraciones. Los archivos Compose de la raíz describen dos entornos con puertos y volúmenes diferentes.

## Pendientes

- Identificar la causa de los contenedores detenidos y comprobar qué datos contiene cada volumen antes de actualizarlos.
- Confirmar la decisión y plan de migración de SQL Server a MySQL antes de cambiar el proveedor.
- Completar una revisión por módulos y agregar documentación de funciones según se inspeccionen o modifiquen.
- La revisión de Git del 12 de noviembre muestra archivos previamente seguidos de `docs/` como eliminados. Su causa no está confirmada; se respetaron esas modificaciones existentes y no se restauraron ni sobrescribieron archivos anteriores.

## Verificación Git — 17 de noviembre de 2026

La rama local feature/backend-api (098226d) coincide con esa rama de PCdex, pero main de PCdex (545663e) contiene 9 commits posteriores. origin apunta a PCdex-prueba. Existen modificaciones locales sin commit y archivos remotos ausentes. No se sincronizó ni cambió configuración. Véase [comparación completa](comparacion-github-2026-11-17.md).

La revisión de integración identificó rutas y esquemas divergentes; hay un respaldo local verificado de cambios detectados por Git. Detalles y límites en [respaldo e integración](respaldo-integracion-2026-11-17.md).

Verificación de integración: frontend compila y pasa prueba de dominio; backend no compila y API v1 no está integrada. Se requieren conciliación de modelos, dependencias, autenticación y migraciones antes de preparar la rama.

Consulta de main de PCdex: el worktree aislado ya está en 545663e, el mismo SHA del remoto al consultarlo. Incluye código OAuth Google, aún sin validación funcional; los contenedores en ejecución no se reconstruyeron y la integración sigue incompleta.
