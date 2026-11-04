# Verificación de la primera entrega manual

Fecha: 2026-11-04. Rama: feature/backend-api. Publicación autorizada de esta rama, sin merge con main.

## Resultado

El bloqueo de Docker se resolvió y la primera entrega manual pasó las verificaciones de SQL Server y del navegador. La aplicación completa quedó en ejecución local en http://localhost:8080.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Compilación backend | Correcta |
| TypeScript, incluyendo scripts y pruebas | Correcto |
| Pruebas unitarias backend | 3 aprobadas |
| Compilación frontend | Correcta |
| Lint frontend | Correcto |
| Comprobaciones de dominio frontend | Correctas |
| Esquema Prisma y migración SQL Server | Aplicación correcta |
| Seed en pcdex_functional | 40 componentes; repetición added: 0, total: 40 |
| test:sql:local | 1 prueba de integración aprobada; ninguna omitida |
| test:browser:local | 2 pruebas Chromium aprobadas; ninguna omitida |
| Construcción Docker backend y frontend | Correcta |
| db:prepare desde imagen Linux | Sin migraciones pendientes; seed sin duplicados |
| Compose app up --wait | SQL Server, backend y frontend en ejecución |
| test:docker | Nginx/API, catálogo, cookie HttpOnly y bloqueo administrativo comprobados |

La integración HTTP comprueba registro, login/logout, CSRF, rechazo de roles enviados por el cliente, acceso administrativo solo después de TOTP, códigos inválidos/reutilizados, CRUD del catálogo, los tres estados de compatibilidad, presupuestos, propiedad de ensambles, precios históricos, conservación de componentes desactivados y recuperación al reabrir el servidor HTTP.

El recorrido Chromium usa el comando real de creación del administrador, configura TOTP desde la interfaz y modifica una ficha. Un usuario nuevo ve el cambio, selecciona componentes incompatibles, corrige la selección, guarda, recarga, recupera la sesión y el ensamble después de reiniciar el proceso backend, cierra sesión, vuelve a entrar y edita el ensamble. Una segunda cuenta no puede leer, actualizar ni eliminar la configuración ajena por API y tampoco puede escribir en el catálogo.

Durante el reinicio deliberado puede aparecer ECONNRESET en una petición de compatibilidad que estaba en curso; el test espera la recuperación y comprueba las operaciones posteriores. Las pruebas usan puertos libres y bases nuevas pcdex_test_*, conservadas para inspección, sin alterar datos de desarrollo.

## Correcciones realizadas al verificar

- El motor Prisma instalado exige `mssql` en migration_lock.toml; se corrigió el identificador sin cambiar el proveedor SQL Server del esquema ni borrar la migración.
- El inicializador local reintenta durante un tiempo limitado cuando SQL Server aún está arrancando.
- Se impide editar los campos del constructor mientras se carga o guarda una configuración, evitando que una respuesta pendiente sobrescriba lo que se acaba de escribir.
- Las pruebas esperan la restauración efectiva de la sesión y de la configuración después de reiniciar, en lugar de asumir que la interfaz ya terminó de cargar.
- El runner del navegador crea su administrador mediante el comando documentado, mantiene credenciales temporales en memoria y cierra sus procesos al finalizar.

## Datos, credenciales y pendientes

Se conservaron el JSON anterior y los volúmenes originales. La base de desarrollo usa el volumen pcdex-functional-sql-data. backend/.env.functional mantiene secretos aleatorios locales y está ignorado por Git. No se publicaron ni se imprimieron credenciales. No hay un administrador predeterminado en la base de desarrollo: el usuario debe crearlo con su correo y contraseña mediante el comando del README.

La aprobación corresponde al recorrido manual de esta entrega, no a todo el alcance del acta. Siguen pendientes Google OAuth, integración visual completa automática/mixta, compartición, IA, recuperación de cuentas/2FA e integración real con comercios. No se ha desplegado públicamente. Las vulnerabilidades de dependencias reportadas anteriormente (6 en backend y 16 en frontend) siguen pendientes de revisión; no se aplicaron actualizaciones mayores automáticas.
