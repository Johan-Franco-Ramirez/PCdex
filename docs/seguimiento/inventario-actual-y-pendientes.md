# PCdex: actual y pendientes

> Actualización del 16 de noviembre: PCdex usa MySQL en el esquema y en las entradas Compose. La persistencia de usuarios está pendiente de diagnóstico; ver [persistencia de cuentas](persistencia-cuentas-mysql.md). El inventario conserva información anterior como referencia.

> Actualización del 12 de noviembre: se adaptó el esquema a MySQL y se preparó un Compose nuevo. Falta validarlo con un servidor real; las referencias a SQL Server reflejan la revisión anterior. Ver [implementación MySQL](migracion-mysql-implementacion.md).

**Fecha:** 12 de noviembre de 2026. **Alcance:** revisión de la estructura local, dependencias, esquema Prisma, rutas principales y partes del frontend. Se incluyen resultados de pruebas y registros aportados anteriormente, identificados como tales. La presencia de código no demuestra que todos los flujos estén funcionando ahora. No se revisó el contenido de todos los documentos académicos ni se verificaron servicios en la nube en esta intervención.

## 1. Objetivo y situación general

PCdex busca orientar a usuarios en la consulta y selección de hardware para computadores de escritorio, con evaluación de compatibilidad, presupuesto y explicaciones. No se plantean ventas dentro de la plataforma.

Existe código para frontend, backend, base de datos, autenticación, catálogo y constructor. Hay dos configuraciones Docker y los contenedores de la aplicación aparecen detenidos en el diagnóstico que compartió Johan. El backend actual declara SQL Server; MySQL y Aiven forman parte de la propuesta de despliegue conversada, pero no hay migración verificada en el código actual.

**Leyenda:** Implementado = se identificó código; pendiente de prueba = no se verificó de extremo a extremo en esta revisión; propuesto = se conoce como objetivo y requiere definir o comprobar alcance.

## 2. Tecnologías observadas

| Área         | Disponible o declarado                                                                                        | Pendiente o aclaración                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Frontend      | React 19, TypeScript, Vite 8, Tailwind 4, Lucide; scripts de lint y Playwright.                               | Verificar el flujo completo en navegador con backend y base correctos.                                             |
| Backend       | Express 5, TypeScript, Prisma 6, CORS, express-session, express-rate-limit y otpauth.                         | Probar la versión reconstruida en Docker.                                                                         |
| Base de datos | Prisma configurado con `provider = "sqlserver"`; migración inicial en el repositorio.                      | Confirmar qué base y volumen contienen los datos útiles. MySQL requiere migración separada.                     |
| Contenedores  | Dockerfiles para frontend y backend; Compose principal, funcional y alias.                                    | Corregir arranque y comprobar imágenes. Docker Desktop estaba instalado; esta sesión no pudo acceder a su motor. |
| Seguridad     | Sesiones SQL, scrypt, token CSRF, controles de rol, TOTP de administración, límites y cabeceras en código. | Completar pruebas HTTP pendientes, gestión de secretos y revisión para producción.                              |
| Despliegue    | Render y Aiven contemplados previamente.                                                                     | No se ha verificado un despliegue o servicio activo en esta revisión; regiones pendientes de confirmar.           |

La instalación de MySQL Server y Workbench fue detectada anteriormente en el equipo; no se comprobó aquí el estado del servicio. No debe confundirse con la base realmente usada por el backend.

## 3. Estructura y función de los archivos

| Ubicación                                    | Función observada                                                                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/pages/`                       | Páginas de inicio, catálogo, detalle, constructor, comparación, acceso, registro y administración. Su existencia no implica que cada flujo esté completo. |
| `frontend/src/routes/AppRouter.tsx`         | Gestiona navegación por hash, carga catálogo y sesión, selección y favoritos temporales; conecta pantallas y servicios.                                    |
| `frontend/src/services/api.ts`              | Centraliza solicitudes HTTP, cookies, token CSRF y conversión de componentes para la interfaz.                                                                |
| `backend/src/app.ts`                        | Construye la aplicación Express: middleware, rutas de autenticación, componentes, ensambles, compatibilidad y recomendaciones.                               |
| `backend/src/server.ts`                     | Conecta Prisma antes de iniciar el servidor y define tiempos HTTP y cierre ordenado.                                                                           |
| `backend/src/compatibility.ts`              | Evalúa reglas con los componentes recibidos y devuelve estado y comprobaciones.                                                                               |
| `backend/src/services.ts`                   | Contiene funciones de selección, totales y recomendación; la calidad de resultados depende de los datos y reglas.                                            |
| `backend/src/modules/auth/`                 | Autenticación, funciones criptográficas y sesiones.                                                                                                          |
| `backend/src/modules/catalog/`, `builds/` | Acceso al catálogo y servicios de ensambles.                                                                                                                  |
| `backend/src/modules/hardware/`             | Archivos de arquitectura hardware presentes; su integración completa requiere revisión. No se debe asumir que su router esté montado.                       |
| `backend/prisma/`                           | Esquema de SQL Server y migración inicial.                                                                                                                    |
| `docs/`                                     | Documentación de seguimiento y documentos académicos del proyecto.                                                                                           |

## 4. Funcionalidades y límites identificados

| Funcionalidad                                                 | Estado observado                                                                                                                                                           | Pendiente                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo                                                     | Hay rutas de consulta, filtros y operaciones administrativas, además de páginas y cliente frontend.                                                                      | Comprobar catálogo real, calidad y actualización de datos.                                                                                              |
| Componentes                                                   | La API tiene creación y edición para administrador; la eliminación implementada es desactivación.                                                                      | Validar permisos y resultados contra una base de pruebas.                                                                                                 |
| Autenticación                                                | Registro, inicio/cierre de sesión y TOTP implementados en rutas.                                                                                                          | Probar los flujos actuales; definir recuperación de contraseña y de segundo factor.                                                                     |
| Ensambles                                                     | Existen rutas protegidas para guardar, consultar, actualizar y eliminar ensambles privados.                                                                                | Confirmar funcionamiento y persistencia en la base que se elija.                                                                                          |
| Compatibilidad                                                | Reglas para socket, generación/chipset según datos, tipo de RAM, formato de placa, almacenamiento, anclaje, potencia estimada, longitud de GPU y altura de refrigerador. | Completar y contrastar reglas y datos: la lógica actual no verifica todos los casos, BIOS, conectores ni montaje. No garantiza compatibilidad universal. |
| Recomendaciones                                               | Existe una función y una ruta; no se ha evidenciado integración de IA en esta revisión.                                                                                 | Evaluar cobertura y resultados, y definir si se agrega IA para explicar sin sustituir reglas deterministas.                                               |
| Favoritos                                                     | En el `AppRouter` inspeccionado se mantienen como estado temporal de sesión.                                                                                            | Si se desean entre dispositivos o sesiones, diseñar persistencia y pruebas.                                                                              |
| Ofertas                                                       | La pantalla de comparación utiliza `demoOffers`.                                                                                                                        | No tratar precios, existencias o tiendas de ejemplo como información comercial verificada; definir fuentes externas.                                     |
| Administrador                                                 | Pantalla y restricciones de rol/MFA identificadas.                                                                                                                         | Probar acciones, auditoría y otros requisitos administrativos del proyecto.                                                                              |
| Builds públicos, compartir, clonación, historial, insignias | Se han mencionado como objetivos.                                                                                                                                          | Confirmar prioridad, alcance y estado mediante revisión específica; no se consideran implementados por esta inspección.                                |

La regla de potencia incluye una estimación con margen; no reemplaza las recomendaciones técnicas del fabricante. Los precios de demostración y estimados necesitan identificarse claramente.

## 5. Modelo de datos actual

El esquema Prisma contiene `User`, `Role`, `UserRole`, `Session`, `Category`, `Component`, `PcBuild`, `BuildItem` y ocho modelos de especificaciones: `CpuSpec`, `GpuSpec`, `MotherboardSpec`, `RamSpec`, `StorageSpec`, `PsuSpec`, `CaseSpec` y `CoolerSpec`.

`UserRole` relaciona usuarios y roles; `Component` pertenece a una categoría y puede tener especificaciones de su tipo; `PcBuild` pertenece a un usuario y contiene `BuildItem`. Los detalles guardan snapshots del componente y del precio. El esquema usa tipos específicos de SQL Server; pasarlo a MySQL requiere revisar tipos, relaciones, migraciones y datos, no solo cambiar la URL.

**Pendiente:** contrastar este esquema con el modelo relacional y requisitos académicos de `docs`, definir respaldos y decidir la estrategia de migración sin pérdida de datos.

## 6. Docker y ejecución

| Archivo                                              | Aplicación                                  | SQL Server         | Volumen declarado             |
| ---------------------------------------------------- | -------------------------------------------- | ------------------ | ----------------------------- |
| `docker-compose.yml`                               | `localhost:80`; backend `localhost:3000` | `localhost:1433` | `pcdex-sql-data`            |
| `docker-compose.functional.yml` con perfil `app` | `localhost:8080` por defecto               | `localhost:1434` | `pcdex-functional-sql-data` |

Los nombres físicos de volúmenes pueden llevar prefijo. No se ha determinado cuáles existen ni qué datos contienen. En el resultado aportado el 12 de noviembre solo figuran frontend y backend detenidos; no aparece un contenedor SQL Server.

El log del frontend muestra que Nginx no pudo resolver `backend` al iniciar. El backend había registrado un inicio exitoso anteriormente; su causa de detención no figura en ese registro. Falta comprobar volúmenes y luego levantar la configuración correcta, verificar salud de la base y reconstruir la versión actual. Ver [diagnóstico Docker](docker-diagnostico.md).

## 7. Pruebas y validaciones conocidas

- En una revisión anterior pasaron compilación y comprobación de tipos del backend y sus tres pruebas unitarias; el frontend compiló y pasó comprobaciones. Son resultados de ese momento, no una garantía de ejecución actual.
- La configuración funcional pasó `docker compose config --quiet` y Vite terminó de compilar en la revisión previa.
- La prueba HTTP adicional de seguridad no se pudo completar en esa sesión por bloqueo de conexiones locales. Hay que ejecutarla en una terminal normal.
- Sigue pendiente verificar Docker y el recorrido completo con la base seleccionada. Las pruebas que crean bases o modifican datos deben utilizar un entorno exclusivo de pruebas.
- La auditoría npm y la descarga de Chromium quedaron bloqueadas en una sesión anterior; comprobar su estado actual antes de actuar.

## 8. Documentación y gestión

Se observaron documentos académicos locales sobre acta, requisitos, historias, manual, modelos relacionales, casos de uso y diagramas UML. **Se inventariaron por nombre; no se revisó su contenido ni coherencia en esta intervención.** Los documentos técnicos están enlazados desde [README de documentación](../README.md).

Git muestra cambios locales y archivos previamente seguidos de `docs` marcados como eliminados. No se ha revisado el motivo. Los `.env` ya estaban bajo seguimiento; `.gitignore` no retira automáticamente archivos del índice ni del historial. Revisar exposición y rotación si hubo publicación, sin mostrar secretos.

La [propuesta Jira](jira-organizacion.md) contiene tareas para copiar. No se crearon incidencias en Jira desde esta sesión.

## 9. Prioridades propuestas

1. Identificar el volumen de datos y resolver el arranque Docker sin borrarlo; verificar aplicación y API.
2. Acordar el motor definitivo y, si corresponde, preparar respaldos y un plan de migración SQL Server a MySQL.
3. Validar el recorrido de usuario y administrador con datos de prueba, incluyendo seguridad y persistencia.
4. Revisar catálogo, reglas de compatibilidad, precios y ofertas frente a datos confiables.
5. Contrastar la implementación con requisitos, historias, modelos y diagramas; convertir diferencias acordadas en tareas Jira.
6. Planear recuperación de cuenta, gestión de secretos, observabilidad, respaldos y despliegue antes de producción.

La prioridad es una propuesta de trabajo: no supone que todas las funcionalidades conversadas estén aprobadas para el MVP.
