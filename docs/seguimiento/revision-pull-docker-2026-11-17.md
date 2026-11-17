# Revisión de actualización de PCdex y Docker

**Fecha:** 17 de noviembre de 2026. **Estado:** revisión de diferencias; pull, integración y actualización Docker pendientes.

## Resultado posterior aportado por Johan

Johan ejecutó `git pull` en `feature/backend-api`: Git descargó las referencias de otras ramas y respondió `Already up to date` para la rama activa. Luego ejecutó `git fetch origin`; la referencia local `origin/main` quedó en `545663e7a61285d194ad97568678e88c1aa2ca68`. Esto **no integró `main` en `feature/backend-api`**. La versión local y sus cambios sin confirmar se conservaron.

Su terminal también confirmó que Docker Desktop tiene el servidor activo y mostró los volúmenes `pcdex-mysql_pcdex-mysql-data`, `pcdex_pcdex-functional-sql-data` y `pcdex_pcdex-sql-data`. La existencia de estos volúmenes no demuestra qué datos contienen. El asistente continúa recibiendo permiso denegado al conectarse al daemon desde su sesión y no ha inspeccionado el contenido de las bases.

### Diferencias de esquema confirmadas estáticamente

| Modelo local actual | Modelo en `origin/main` | Aspectos por resolver |
|---|---|---|
| `User`, `Role`, `UserRole` | `Usuario` con `RolUsuario` | IDs locales UUID pueden exceder el límite de 30 caracteres remoto; revisar correos, hashes, roles y relaciones. No copiar sin un mapeo ensayado. |
| `Session` | `Sesion` | Estructuras diferentes; definir el cierre de sesiones durante la transición. |
| `Component` y especificaciones | `Componente` y tablas de especificaciones | Cambian nombres, campos y restricciones; valorar qué datos conservan fidelidad. |
| `PcBuild`, `BuildItem` | `Ensamble`, `PiezaEnsamble` | Revisar IDs, propietarios, presupuesto, visibilidad, snapshots y campos que no tienen equivalente directo. |

La estructura local contiene `totpSecret`, `totpEnabled` y `lastTotpStep`; el modelo remoto `Usuario` inspeccionado no contiene esos mismos campos. Esto requiere revisar el flujo de segundo factor y el alcance de seguridad antes de dar por equivalente la funcionalidad. El nombre del proveedor MySQL por sí solo no hace compatibles los esquemas.

### Siguiente comprobación sin modificar datos

Con el entorno MySQL local en marcha, desde PowerShell en la raíz de PCdex:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a
npm.cmd --prefix backend run db:check:local
```

El segundo comando solo consulta el nombre de la base y la cantidad de usuarios y ensambles. No imprime correos ni contraseñas. Es un punto de partida, no una copia de seguridad ni una verificación de todos los registros. Si falla, compartir el error sin secretos; no iniciar migraciones remotas ni eliminar volúmenes.

## Qué se encontró

- La rama local activa es `feature/backend-api`, en el commit `098226dda178ceb84c84d1da8146353030346605`. Tiene cambios locales sin confirmar, incluidos archivos de backend, Prisma, Compose, documentación y archivos ignorados o no seguidos. No se deben sobrescribir.
- El último `pull` visible en el reflog local fue el 4 de noviembre en `main` (`420a7a4` → `196b2b7`). No hay evidencia de un pull posterior aplicado en esta copia. El checkout de la rama actual ocurrió después de ese pull.
- La consulta de GitHub del 17 de noviembre identificó el repositorio como `Johan-Franco-Ramirez/PCdex` (la URL local conserva el nombre anterior `PCdex-prueba`). La rama remota `feature/backend-api` coincide con el commit local. `main` tenía nueve commits adicionales respecto a ese commit; el commit consultado en su punta fue `545663e7a61285d194ad97568678e88c1aa2ca68`, correspondiente a la integración del PR #7. El remoto puede cambiar después de esta revisión.
- Esto es una comparación con `main` remoto, **no un pull aplicado**. La referencia `origin/main` guardada localmente puede estar desactualizada. Confirmar qué rama desea integrar el equipo antes de cambiar de rama o fusionar.

## Cambios remotos identificados por nombres y documentación

La comparación muestra cambios en autenticación, perfil, favoritos, catálogo, constructor, compatibilidad, interfaz y pruebas. Incluye código para Google, verificación de correo con código y dependencia de correo; contiene nuevas migraciones MySQL y una organización distinta de módulos. La documentación remota describe algunos ensambles y administración como demostraciones locales; no dar por terminadas esas funciones sin pruebas.

El archivo remoto `backend/compose.yaml` usa servicios `mysql`, `migrate`, `api` y `frontend`, con un volumen lógico `mysql-data`. El Compose local `docker-compose.mysql.yml` utiliza `pcdex-db`, `backend` y `frontend`, con un volumen lógico `pcdex-mysql-data`. No se debe asumir que ambos volúmenes sean la misma base.

El esquema y los historiales de migración son distintos: localmente hay `202611120001_mysql_initial`, mientras que el remoto contiene otras migraciones iniciales y nuevas tablas. Se requiere comparar ambas estructuras, hacer una copia recuperable y ensayar una estrategia de migración en una base aislada antes de utilizar el volumen actual con el código nuevo.

El Compose remoto del backend exige además `EMAIL_CODE_SECRET` y contempla configuración SMTP y Google. El registro de la versión remota requiere verificación por correo; sin el servicio de correo configurado, ese recorrido puede quedar bloqueado. No agregar ni registrar credenciales en Jira o documentación.

El `docker-compose.yml` y `DOCKER.md` remotos describen una configuración diferente con SQL Server, mientras que Johan ha decidido usar MySQL. Hay que elegir y adaptar explícitamente el Compose MySQL, no iniciar el archivo raíz remoto por suponer que conserva el motor deseado.

## Trabajo realizado y bloqueos

Se consultaron Git, el árbol local y el remoto por GitHub de manera informativa. El motor Docker respondió `permission denied`; no fue posible consultar imágenes o contenedores ni construir o reiniciar servicios. No se ejecutó pull, merge, migración, seed o eliminación. No se ha verificado la aplicación remota de extremo a extremo.

## Siguiente procedimiento

1. Completado por Johan: `git status --short`, `git branch -vv` y `git fetch origin`. El fetch actualizó referencias, sin fusionar los cambios de `main`.
2. Comparar los cambios remotos con los locales; proteger por separado archivos locales no confirmados y secretos y preparar su integración sin perderlos. Como revisión inicial se usa `origin/main`, sin asumir que los cambios ya estén integrados.
3. Inventariar volúmenes y realizar una copia de seguridad recuperable de MySQL. Probar un volumen nuevo y aislado para el código y migraciones remotos; no realizar `down -v`, reset ni migraciones sobre el volumen actual por diagnóstico.
4. Adaptar y probar el Compose MySQL, variables requeridas, conexiones, versión y migraciones. Después construir imágenes y verificar API, catálogo, registro y persistencia; documentar resultados y la versión exacta que ejecuta Docker.

## Jira: propuesta, aún no creada

**Tipo:** tarea técnica. **Resumen:** integrar actualización de `main` y validar PCdex Docker con MySQL.

**Criterios:** cambios locales preservados; referencia exacta registrada; diferencias de esquema revisadas; copia recuperable; entorno MySQL aislado validado; imágenes reconstruidas y pruebas con resultados documentados. Dependencias: acceso al daemon, decisión de rama y revisión de datos/credenciales del entorno.
