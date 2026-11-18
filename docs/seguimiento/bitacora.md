# Bitácora consolidada de PCdex

Esta es la entrada principal por fecha y tema. Para conservar todos los detalles originales, el [registro histórico detallado](registro-historico-detallado.md) guarda las entradas anteriores completas. Las guías temáticas contienen explicaciones y procedimientos.

## 18 de noviembre de 2026

Se organizaron las reglas de exclusión en el `.gitignore` general y se retiró el duplicado de `frontend`; el de `backend` ya estaba eliminado antes de esta revisión. Se conservaron los archivos dentro de respaldos. Las reglas de Git no dejan de rastrear archivos ya versionados; entre ellos hay archivos de `backend/node_modules` y configuraciones de entorno. Se verificaron ejemplos de exclusión y de plantillas permitidas sin modificar el índice de Git.

Arranque solicitado: se constató que los contenedores existentes de frontend, backend y MySQL ya estaban activos; MySQL informó estado saludable. La página en `http://localhost:8081/` respondió HTTP 200 y `/api/components` respondió HTTP 200 con 40 elementos. No se reconstruyeron imágenes ni se ejecutaron migraciones, por lo que no se verificó que los contenedores incorporen todos los cambios actuales del código.

Se comparó la rama local `feature/backend-api` (`098226d`) con `main` del repositorio solicitado (`f3168bc`). Se detectaron cambios locales superpuestos y diferentes historias de migraciones; no se ejecutó pull ni migración. Detalles y propuesta de tarea en [revisión de actualización](revision-actualizacion-2026-11-18.md).

### Posible exposición de credenciales

Se reportó que un compañero compartió credenciales con otra conversación de IA. Se documentó un plan de rotación por tipo de secreto y sus consecuencias. Se desconoce cuáles se compartieron; no se modificaron credenciales ni configuraciones. Ver [guía de rotación](rotacion-credenciales.md).

### Limpieza de archivos de entorno

Se consolidó la plantilla del backend, se retiraron de las carpetas activas tres configuraciones antiguas y una plantilla duplicada con copias recuperables, y se quitó una entrada SMTP duplicada e idéntica. Compose generó la misma configuración antes y después; Prisma informó migraciones al día y la API respondió HTTP 200. Se probó el inicializador en una carpeta temporal. Detalles, limitaciones y tarea propuesta en [limpieza de entorno](limpieza-entorno.md).

### Actualización de Docker

Se verificó la configuración de `docker-compose.mysql.yml` con `config --quiet`: válida. La consulta a `http://localhost:8081/api/auth/google` devolvió una redirección HTTP 303 indicando que Google no está configurado; esto no demuestra qué imagen está ejecutando Docker. El servicio Docker negó acceso al asistente, de modo que no se reconstruyeron imágenes ni se verificó el estado de los contenedores. Queda pendiente ejecutar `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --build --wait` en la terminal del usuario y revisar `ps -a`. No se modificaron datos de MySQL.

## 17 de noviembre de 2026

### Google, correo y Git

En una revisión posterior se respaldó MySQL y se restauró el archivo en un servidor aislado; coincidieron las 17 tablas y sus cantidades de registros. Se aplicó la migración aditiva de Google a la base `pcdex` y Prisma confirmó que no hay migraciones pendientes. El daemon Docker rechazó el acceso desde esta sesión; falta reconstruir y comprobar la aplicación en el navegador. [Procedimiento y detalles](acceso-google-y-correo.md).

Se compararon las ramas remotas con los cambios locales y se identificaron diferencias en usuarios y sesiones. Se adaptaron Google OAuth y los códigos por Gmail sin reemplazar el proyecto local. La implementación se probó con proveedores simulados y MySQL aislado con una cuenta previa; queda pendiente configurar credenciales, respaldar la base real, aplicar la migración y probar en Docker con Google y Gmail reales. [Detalles actuales](acceso-google-y-correo.md); [análisis de la rama](analisis-login-google-2026-11-17.md).

### Docker, MySQL y Workbench

Se investigaron el puerto 3307, un fallo de arranque de MySQL y la identificación del volumen. Johan confirmó posteriormente contenedores activos, MySQL saludable y la conexión desde Workbench. El navegador debe usar el puerto de la web, no el de MySQL. [Diagnóstico](docker-diagnostico.md); [guía de Workbench](guia-workbench-paso-a-paso.md).

### API y catálogo

Se prepararon las rutas v1 de catálogo, compatibilidad y generación, junto con enlaces de búsqueda a tiendas y visualización de imágenes. Una consulta anterior encontró 40 componentes, uno con imagen; los datos pueden cambiar. [API y catálogo](api-v1-catalogo-compatibilidad-generacion.md).

### Organización y respaldos

Se revisaron Git, reglas de exclusión, archivos de ejemplo y respaldos antes de integrar trabajo. No se realizó un pull que reemplazara los cambios locales. [Revisión Git y Docker](revision-pull-docker-2026-11-17.md); [respaldo de integración](respaldo-integracion-2026-11-17.md).

## 16 de noviembre de 2026

Se organizaron imágenes y documentación y se trabajó en la persistencia de cuentas con MySQL. [Persistencia](persistencia-cuentas-mysql.md).

## 15 de noviembre de 2026

Se documentó la diferencia entre perder una sesión y perder los datos de la cuenta tras cerrar Docker. [Persistencia](persistencia-cuentas-mysql.md).

## 12 de noviembre de 2026

Se adaptó el entorno a MySQL y se investigaron la migración pendiente, el error P2021 al ejecutar seed y un conflicto del puerto 8080. [Implementación](migracion-mysql-implementacion.md); [Docker](docker-diagnostico.md).
