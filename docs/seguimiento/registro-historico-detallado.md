# Bitácora de trabajo

## 17 de noviembre de 2026 - Consultar usuarios desde Workbench

Johan informó que la conexión de Workbench funcionó. Se revisaron el esquema Prisma local y la ruta de registro para documentar una consulta de solo lectura que muestra ID, nombre, correo y fecha de creación, y explicar que Workbench debe volver a ejecutar la consulta para ver registros posteriores. No se consultaron datos personales ni se hizo una prueba de registro. Ver [guía](guia-workbench-paso-a-paso.md).

## 17 de noviembre de 2026 - Guía de MySQL Workbench en español

Se confirmó en el Compose local que la base y el usuario son `pcdex` y el puerto publicado de MySQL es 3307. Se escribió una guía que traduce las opciones de conexión de Workbench y explica cómo listar tablas sin modificarlas. Se verificó únicamente que existe el archivo de entorno; no se expusieron credenciales, no se probó la conexión de Workbench y no se modificaron datos. Ver [guía](guia-workbench-paso-a-paso.md).

## 17 de noviembre de 2026 - Análisis de Google y rama remota

Se comparó `feature/backend-api` con `actualizacion-proyecto` y `main` de GitHub; los dos commits remotos consultados contienen el mismo árbol. La rama remota tiene OAuth Google, verificación de correo y modelos distintos de usuario y sesión. La aplicación local devolvió 404 para `/api/auth/google` y los nombres de variables OAuth se encontraron ausentes o vacíos en el archivo de entorno local, sin mostrar valores. Se revisó la documentación del trabajo aislado `codex/integracion-api-en-curso`, que registra un backend aún no compilado en una verificación anterior. No se hizo pull, merge, instalación ni migración, y no se cambiaron datos o contenedores. Ver [análisis](analisis-login-google-2026-11-17.md) para diferencias, pendientes y propuesta Jira.

## 17 de noviembre de 2026 - PCdex responde y MySQL saludable

Johan confirmó que la web abre y compartió `ps -a`: backend y frontend activos y MySQL activo y saludable, con los puertos esperados. La API devolvió 40 componentes, todos con los dos enlaces de búsqueda y uno con URL de imagen. No se determinó con certeza la causa del error anterior; queda pendiente verificar un próximo arranque. No se reiniciaron ni borraron servicios o volúmenes en esta comprobación. Ver [diagnóstico](docker-diagnostico.md).

## 17 de noviembre de 2026 - Volumen MySQL y respuesta del catálogo

Johan confirmó que el contenedor `pcdex-mysql-pcdex-db-1` monta el volumen `pcdex-mysql_pcdex-mysql-data`. El asistente consultó la API local y obtuvo 40 componentes y la imagen MSI registrada previamente. No se ha demostrado que la respuesta proceda del mismo contenedor ni establecido el estado actual de Compose, ya que el daemon rechazó el acceso; queda pendiente el resultado de `ps -a` desde la terminal del usuario. No se cambió ningún dato. Ver [diagnóstico](docker-diagnostico.md).

## 17 de noviembre de 2026 - Resultado de validación Compose

Johan informó que la validación de Compose finalizó con código 0. El comando propuesto para inspeccionar el volumen falló al interpretar comillas internas en la plantilla. Se cambió en el diagnóstico por un formato sin comillas internas; falta recibir el volumen montado y el estado de los contenedores. No se modificaron contenedores ni datos.

## 17 de noviembre de 2026 - Diagnóstico de arranque MySQL

Johan informó que Docker Desktop detuvo el arranque de PCdex porque `pcdex-db` no alcanzó el estado saludable y aportó registros que indican un directorio sin inicializar y ausencia de contraseña root. Se revisaron Compose y el archivo de ejemplo sin mostrar credenciales; el Compose actual exige dicha variable. El daemon rechazó el acceso al asistente. La causa concreta, el volumen montado y la relación temporal entre los mensajes aún deben verificarse desde la terminal de Johan. No se cambiaron datos ni contraseñas. Comandos de diagnóstico en [Docker](docker-diagnostico.md).

## 17 de noviembre de 2026 - API con búsquedas en tiendas y visualización de imágenes

Se añadió un presentador de catálogo que devuelve enlaces de búsqueda para Amazon y Mercado Libre y expone la imagen existente o `null`. Se conectaron las rutas antiguas y v1. En el frontend se muestra la imagen en tarjetas y detalle, con ilustración genérica ante ausencia o fallo, y se agregó su URL al formulario de Administración. No se alteró el esquema. Se guardó una URL oficial MSI en `motherboard-1`, únicamente al confirmar el nombre y que no tenía imagen; se verificó su presencia mediante la API.

Se realizaron pruebas automáticas de backend y frontend, y se arrancó temporalmente el backend para consultar la base real: ambos listados devolvieron enlaces para 40 componentes; inicialmente ninguno tenía imagen. Después de añadir la imagen MSI hay 1 con URL y 39 sin ella. Los enlaces representan búsquedas y no ofertas verificadas. Quedan pendientes la recopilación de 39 fotografías comprobadas, la reconstrucción Docker y la comprobación visual. Detalles en [API y catálogo](api-v1-catalogo-compatibilidad-generacion.md).

## 17 de noviembre de 2026 - Enlaces a tiendas en la ficha

Se agregó en el frontend una sección responsive de enlaces opcionales a Amazon y Mercado Libre, con apertura segura y validación básica de URL. Se conservó el campo en el mapeo del catálogo y se añadió una prueba automatizada con datos simulados. Pasaron compilación, lint, pruebas existentes y pruebas de los enlaces. No se modificó el backend: el código local revisado no expone `links_tiendas` en `/api/components`; queda pendiente confirmar la integración real y la presentación en navegador. Detalles y tarea Jira propuesta en [API v1](api-v1-catalogo-compatibilidad-generacion.md).

## 17 de noviembre de 2026 - Diagnóstico de acceso al puerto 3307

La captura de Johan muestra un navegador intentando acceder al puerto MySQL. Se revisaron la asignación de puertos de Compose y el proxy de Nginx: el frontend usa 8081 por defecto y 3307 corresponde a MySQL. Se documentó cómo obtener el puerto efectivo y aclarar que el error no demuestra el estado de la base de datos. La consulta directa a Docker desde esta sesión devolvió permiso denegado; pendiente verificación desde la terminal del usuario. Ver [diagnóstico](docker-diagnostico.md).

## 17 de noviembre de 2026 - API v1 de componentes y builds

Se añadieron endpoints versionados para catálogo, compatibilidad y generación, usando las relaciones reales del esquema local y conservando rutas y medidas de seguridad existentes. La nueva validación aplica el margen solicitado y las reglas previas de PCdex. La generación es una búsqueda limitada con precios del catálogo, no garantiza optimización ni guarda la propuesta. No se cambió el esquema, no se ejecutaron migraciones ni se escribieron datos de MySQL.

Pasaron typecheck, las tres pruebas unitarias anteriores y dos pruebas nuevas con Prisma simulado y HTTP local. El daemon Docker rechazó el acceso desde esta sesión; quedan pendientes reconstrucción y prueba con MySQL real. Archivos, contrato, comandos, límites y tareas Jira: [API v1](api-v1-catalogo-compatibilidad-generacion.md).

## 17 de noviembre de 2026 — Resultado de Git y Docker aportado por Johan

Johan ejecutó `git pull` en `feature/backend-api` y obtuvo `Already up to date`; ese comando actualizó referencias remotas, pero no integró `main`. Luego ejecutó `git fetch origin`. Se verificó que `origin/main` apunta a `545663e` y la rama actual sigue en `098226d` con cambios locales. Docker funciona en su terminal y hay tres volúmenes PCdex listados; sus datos aún no se inspeccionaron.

Se compararon los esquemas locales y remotos de forma estática: modelos de usuario, sesión, componentes y ensambles tienen estructuras diferentes; el límite remoto de ID de usuario es 30 caracteres frente a UUID locales de 36, y los campos TOTP locales no aparecen en el modelo remoto inspeccionado. La comparación y la consulta de conteos sugerida se documentan en [revisión de actualización](revision-pull-docker-2026-11-17.md).

No se integró `main`, no se reconstruyeron imágenes ni se ejecutaron migraciones: desde la sesión del asistente el daemon sigue rechazando el acceso y debe preservarse la información existente. Pendiente: consultar conteos sin datos personales, respaldar y ensayar integración en una base aislada.

## 17 de noviembre de 2026 — Revisión de cambios remotos y Docker

Johan solicitó actualizar Docker con la última versión y documentar el pull. Se comprobó que esta copia está en `feature/backend-api` commit `098226d`, con cambios locales sin confirmar; el último pull registrado localmente ocurrió el 4 de noviembre. En GitHub, `main` estaba en `545663e`, nueve commits por delante del commit local, y `feature/backend-api` coincidía con él. La revisión identificó cambios de Compose, esquema, migraciones y verificación por correo que requieren integración cuidadosa.

No se ejecutó pull ni merge: las modificaciones locales se superponen con cambios remotos y necesitan conservarse y revisarse. El acceso al daemon Docker devolvió permiso denegado; no se reconstruyeron ni iniciaron contenedores. No se ejecutaron migraciones ni se tocaron bases o volúmenes. Ver [revisión detallada](revision-pull-docker-2026-11-17.md) para las diferencias, procedimiento y propuesta de Jira. La funcionalidad de la versión remota no se ha probado en este equipo.

## 17 de noviembre de 2026 — Archivo de ejemplo para el catálogo

Se preparó `backend/api/ejemplos/catalogo-verificado.json` con un ejemplo por cada una de las ocho categorías actuales, sin precios ni existencias inventados, y un validador que reutiliza los controles de la API. Se añadieron fuentes y limitaciones en `catalogo-ejemplo-api.md` y se documentó por qué `dist` contiene JavaScript generado por TypeScript para Node.js. El validador confirmó ocho registros, IDs únicos, cobertura de categorías y ausencia de precios; también pasaron typecheck y build. No se importaron datos ni se modificaron los existentes. La importación en MySQL sigue pendiente de prueba aislada.

## 17 de noviembre de 2026 — Reglas Git centralizadas para backend

**Solicitud:** retirar el `.gitignore` del backend y mantener sus reglas en la raíz del proyecto.

**Cambios:** se trasladó la exclusión específica `backend/data/` y se conservaron las reglas existentes para dependencias, compilaciones y variables de entorno; se añadieron patrones para algunos archivos generados y temporales. Se eliminó `backend/.gitignore`. El `.gitignore` propio del frontend permanece. No se cambió `.dockerignore`, que controla el contexto de compilación de Docker.

**Alcance:** las reglas no dejan de seguir archivos que ya están en el índice. Al revisar el repositorio se observó que `.env`, `backend/.env` y archivos de `backend/node_modules` ya estaban bajo seguimiento; su retirada del índice y la posible rotación de secretos compartidos requieren una intervención separada. Las reglas de `.github/` y `.vscode/` se conservaron como estaban.

## 16 de noviembre de 2026 — Organización de imágenes

Se trasladaron las tres imágenes que estaban sueltas en `docs` a la carpeta existente `docs/image`: el diagrama de despliegue, el diagrama de actividades y la imagen de WhatsApp. Se comprobó que no hubiera archivos con el mismo nombre en el destino y no se encontraron referencias a estos nombres en los Markdown de `docs`. Se actualizó el índice. No se alteraron los documentos ni el código de la aplicación.

## 16 de noviembre de 2026 — Organización de la documentación

**Objetivo:** mantener visibles los documentos oficiales y reunir los registros del proyecto en un lugar fácil de consultar.

**Cambios:** se trasladaron diez archivos Markdown de seguimiento a `docs/seguimiento/`, se creó un índice para esa carpeta y se actualizaron enlaces en los índices y documentos que apuntaban a las rutas anteriores. Los documentos oficiales y sus imágenes permanecieron en su ubicación. No se cambiaron aplicación, base de datos ni contenedores.

**Verificación:** comprobar los enlaces Markdown locales y la existencia de los archivos trasladados; no se requieren pruebas de aplicación para este cambio documental.

## 16 de noviembre de 2026 — Persistencia de cuentas y configuración MySQL

Johan aclaró que la cuenta registrada no queda disponible después de cerrar el entorno y solicitó usar solamente MySQL y retirar el documento de sesión. La revisión de código muestra `prisma.user.create` en registro y un volumen nombrado en Compose; la causa real no se ha confirmado.

Se convirtieron las tres entradas Compose antiguas en alias de `docker-compose.mysql.yml` bajo el mismo proyecto, se retiraron los scripts y archivo histórico del proveedor anterior y el documento de sesión solicitado, se añadió `backend/scripts/check-mysql.ts` para informar base y conteos sin mostrar datos personales, y se creó `docs/persistencia-cuentas-mysql.md`. Se actualizaron README y package.json. No se eliminó ninguna base ni volumen. Los documentos académicos y registros históricos todavía pueden mencionar el motor anterior y no se revisaron ni alteraron en masa.

Validación: las cuatro configuraciones Compose declararon el mismo volumen lógico; typecheck y tres pruebas unitarias correctas. El motor Docker rechazó la conexión y la consulta local no alcanzó MySQL: falta ejecutar la guía en PowerShell y confirmar la persistencia con datos reales.

## 15 de noviembre de 2026 — Diagnóstico de sesión tras cerrar Docker

**Reporte:** Johan indica que debe iniciar sesión nuevamente después de cerrar Docker y volver a entrar. No se ha confirmado pérdida de cuentas o ensambles ni el intervalo transcurrido.

**Revisión:** se inspeccionaron el almacenamiento de sesiones, autenticación, cliente frontend y Compose. Se identificaron cookie de ocho horas, almacenamiento de sesiones en base de datos, eliminación deliberada al cerrar sesión y posible conflicto entre instancias en `localhost` por utilizar el mismo nombre de cookie. No se ha identificado la causa en este caso.

**Cambios:** se creó `docs/sesion-persistencia-diagnostico.md` y se añadió al índice. No se cambió el código de autenticación ni se reiniciaron servicios. **Pruebas:** revisión estática; la sesión no pudo acceder al motor Docker. Pendiente una prueba breve en la misma URL y navegador, sin pulsar cerrar sesión.

## 12 de noviembre de 2026 — Entorno MySQL en funcionamiento

Johan comunicó que funcionó adecuadamente tras los pasos de migración, seed e inicio. Se registra como resultado informado por el usuario; no se recibieron salidas individuales ni se verificó independientemente cada funcionalidad. Pendiente comprobar persistencia tras reiniciar, recorridos completos y adaptar las pruebas automatizadas de base de datos a MySQL. Se actualizaron estos documentos; no se modificaron recursos de Docker ni bases de datos en esta intervención.

## 12 de noviembre de 2026 — Continuación del arranque MySQL

Johan respondió «correcto» tras recibir los comandos de migración y seed, pero no compartió sus resultados individuales. Se preparó la siguiente etapa: comprobar el estado de migraciones y luego iniciar los servicios y verificar el catálogo. No se ejecutaron operaciones sobre Docker o la base desde esta sesión; los resultados siguen pendientes de confirmación.

## 12 de noviembre de 2026 — Migración MySQL pendiente identificada

**Resultado comunicado por Johan:** `prisma migrate status` identificó la base `pcdex` en `pcdex-db:3306` y mostró `202611120001_mysql_initial` pendiente. Esto explica que el seed no encuentre las tablas si no se han creado por otra vía.

**Siguiente paso:** ejecutar `npm run db:deploy` dentro del servicio backend y comprobar su resultado antes del seed. No se ha ejecutado ni validado la migración desde esta sesión. Se actualizó la guía de MySQL y esta bitácora; no se modificaron el código ni los datos.

## 12 de noviembre de 2026 — Error P2021 durante seed MySQL

**Evidencia:** Johan ejecutó el seed en Docker y Prisma informó que no existe la tabla `Category` en la base consultada. Esto demuestra acceso suficiente para obtener ese error, pero no demuestra que se haya aplicado correctamente la migración. Falta la salida de `db:deploy`.

**Revisión:** la migración SQL y su archivo de bloqueo están en el proyecto; el Dockerfile copia el directorio y `.dockerignore` no excluye `prisma`. No se ha inspeccionado el contenido real de la imagen ni la base porque esta sesión no tiene permiso para acceder al motor Docker.

**Acción:** se documentaron comandos de diagnóstico de solo lectura para estado de migraciones y contenido de la imagen. No se cambió código, no se repitió seed ni se ejecutaron operaciones en la base. **Pendiente:** resultados para identificar la causa y decidir una corrección segura.

## 12 de noviembre de 2026 — Adaptación inicial a MySQL

**Solicitud:** adaptar PCdex a MySQL conservando su lógica; Johan indicó que no necesita una base SQL Server anterior.

**Cambios:** esquema Prisma MySQL, migración inicial generada, archivo Compose y volumen nuevos, configuración local con secretos aleatorios y scripts de arranque; archivo SQL Server histórico preservado en `backend/prisma/sqlserver-archive/`. Ajustes de mensajes de la API y documentación. Las pruebas antiguas que creaban bases SQL Server automáticamente quedaron deshabilitadas explícitamente hasta su adaptación.

**Verificación:** Prisma validate y generate, migración SQL generada con diff, Compose config, compilación, typecheck y tres pruebas unitarias exitosas. Docker rechazó acceso desde la sesión; no se aplicaron migraciones ni se comprobó MySQL real. Instrucciones y pendientes en [migración MySQL](migracion-mysql-implementacion.md).

## 12 de noviembre de 2026 — Revisión de MySQL y Docker

**Evidencia:** Johan informa que el entorno funciona y se conectó tras cambiar el puerto. No se comprobó de forma independiente ni se confirmó que las imágenes hayan sido reconstruidas.

**Trabajo:** inspección de Compose, esquema, migración y referencias SQL Server; consulta de documentación oficial de Prisma y Aiven. Se creó `docs/analisis-migracion-mysql.md` y se enlazó en el índice. Se identificaron dos configuraciones con volúmenes diferentes y un alias; no se puede determinar si ambos volúmenes físicos existen o qué datos contienen.

**Pruebas:** revisión estática; los comandos de listado del motor respondieron permiso denegado desde esta sesión. No se cambió el proveedor, no se migraron datos ni se eliminaron recursos. **Pendiente:** confirmar motor definitivo, preservación de datos, inventario Docker y pruebas del plan de migración.

## 12 de noviembre de 2026 — Puerto Docker 8080

**Evidencia compartida:** al iniciar Compose, SQL Server apareció saludable y el backend iniciado; el frontend no pudo publicar `127.0.0.1:8080` por un error de acceso al puerto en Windows. No se ha identificado el proceso o reserva responsable.

**Trabajo:** revisión de `docker-compose.functional.yml`, `.gitignore` y nombres de variables de entorno sin mostrar valores secretos. Se documentó el uso temporal del puerto 8081 y su origen correspondiente en `docker-diagnostico.md`. Se recomendó versionar documentación compartible y excluir datos sensibles o generados de forma selectiva.

**Archivos modificados:** `docs/docker-diagnostico.md` y `docs/bitacora.md`. **Pruebas:** no fue posible verificar el nuevo puerto ni levantar Docker desde esta sesión. La solución queda pendiente de ejecución y validación por Johan.

## 12 de noviembre de 2026 — Inventario y análisis de registros

**Objetivo:** documentar lo existente y pendiente y continuar el diagnóstico Docker.

**Evidencia:** Johan compartió registros: backend había iniciado, pero está detenido por causa aún desconocida; frontend falló porque Nginx no resolvió `backend`. El listado general no muestra contenedor SQL Server. No se ha comprobado la existencia ni contenido de los volúmenes.

**Trabajo:** inspección parcial de archivos frontend, backend, rutas, esquema Prisma, Compose y nombres de documentos. Se creó `inventario-actual-y-pendientes.md`, se enlazó en el índice y se actualizó el diagnóstico. La sesión sigue sin permisos para consultar volúmenes Docker.

**Pruebas:** no se ejecutaron pruebas de aplicación; se trató de revisión y documentación. No se cambiaron archivos de aplicación ni contenedores. **Pendiente:** recibir listado de volúmenes e identificar los datos necesarios antes de iniciar el entorno.

## 12 de noviembre de 2026 — Organización documental y diagnóstico Docker

**Objetivo:** establecer una forma de documentar el trabajo y entender por qué se muestra o falla una versión anterior de PCdex en Docker.

**Estado comunicado por Johan:** en la configuración funcional, `pcdex-backend-1` aparece detenido con código 255 y `pcdex-frontend-1` con código 1. En ese resultado no aparece un contenedor de base de datos. El resultado no demuestra que la base o el volumen hayan sido eliminados, ni identifica la causa de los errores.

**Trabajo realizado:** se revisaron `AGENTS.md`, el estado Git, scripts y estructura del backend y frontend. Se consultaron los registros Docker desde esta sesión; el motor respondió permiso denegado. Se crearon el índice, estado, diagnóstico, propuesta para Jira y plantilla de registro. Se agregaron instrucciones de documentación a `AGENTS.md` para futuras intervenciones.

**Motivo:** separar hechos de hipótesis, facilitar el aprendizaje y mantener trazabilidad de cambios y pull. No se intentó acceder a Jira ni se crearon incidencias allí.

**Archivos agregados:** `docs/README.md`, `docs/estado-proyecto.md`, `docs/bitacora.md`, `docs/docker-diagnostico.md`, `docs/jira-organizacion.md` y `docs/plantilla-cambios-pull.md`. **Modificado:** `AGENTS.md`.

**Verificación:** se constató el bloqueo de acceso al motor. No se iniciaron ni reconstruyeron contenedores, no se modificaron migraciones ni se aplicaron cambios a las bases. No se ejecutaron pruebas de aplicación porque la intervención solo documenta.

**Pendiente:** recibir registros del backend y frontend y listado general de contenedores; establecer si el contenedor de SQL Server existe y qué volumen usa. La carpeta `docs` tenía archivos anteriores marcados como eliminados en Git antes de esta intervención; no se restauraron.

## 17 de noviembre de 2026 — Comparación con PCdex en GitHub

Se verificaron estado, remoto y HEAD locales y se compararon las tres ramas de PCdex mediante el conector GitHub. main está 9 commits por delante del HEAD local; origin apunta a PCdex-prueba. Se conservaron todos los cambios previos. Se añadió comparacion-github-2026-11-17.md y se actualizaron los índices y el estado. Verificación de Git completada; no se ejecutaron pruebas de aplicación ni pull. Pendiente conciliar cambios locales antes de sincronizar. Detalles y referencias en [el registro](comparacion-github-2026-11-17.md).

## 17 de noviembre de 2026 — Respaldo y análisis de integración

Se creó y verificó un ZIP privado con cambios locales detectados por Git y se compararon rutas y esquema contra el SHA de main. Se documentaron riesgos, pasos y propuesta Jira en [respaldo e integración](respaldo-integracion-2026-11-17.md), y se actualizaron índices y estado. Sin pull, merge, instalaciones ni migraciones; no se ejecutaron pruebas de aplicación. Pendiente conciliación en entorno aislado.

## 17 de noviembre de 2026 — Preparación de integración

Se creó una copia aislada basada en main 545663e, se incorporaron 69 archivos sin divergencia y se combinó una prueba automáticamente. Quedan 23 rutas divergentes pendientes de revisión; se conservó el proyecto original. Detalles en respaldo-integracion-2026-11-17.md y integration-report.json de la copia. Sin instalaciones, migraciones ni pruebas de aplicación.
