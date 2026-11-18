# Conectar PCdex a MySQL Workbench

Fecha: 17 de noviembre de 2026. Guía basada en `docker-compose.mysql.yml`: MySQL usa la base y usuario `pcdex` y está publicado en `127.0.0.1:3307`. Esos datos se aplican a este Compose; otras instalaciones pueden ser diferentes. La guía explica cómo conectarse a la base existente y no crea tablas ni modifica datos.

1. Abre Docker Desktop y comprueba en PowerShell, desde la carpeta PCdex, que `pcdex-db` aparezca activo:

   ```powershell
   docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a
   ```

2. Abre MySQL Workbench. En la pantalla inicial, junto a **MySQL Connections** (conexiones MySQL), pulsa **+**. Se abrirá **Setup New Connection** (configurar conexión nueva).
3. En la pestaña **Parameters** (parámetros) escribe: **Connection Name** `PCdex Docker`; **Connection Method** `Standard (TCP/IP)`; **Hostname** `127.0.0.1`; **Port** `3307`; **Username** `pcdex`; **Default Schema** `pcdex` (se puede dejar vacío y elegirlo después).
4. La contraseña del usuario es el valor existente de `MYSQL_PASSWORD` en `backend/.env.mysql`. Abre ese archivo de manera privada en VS Code; no lo compartas. No es `MYSQL_ROOT_PASSWORD`. Pulsa **Store in Vault...** (guardar en la bóveda), introduce la contraseña y pulsa **OK**. Si no la guardas, Workbench puede pedirla al conectar.
5. Pulsa **Test Connection** (probar conexión). Si sale **Successfully made the MySQL connection**, significa que se conectó. Pulsa **OK** y después **OK** para guardar. Una posible advertencia de compatibilidad de versión no prueba por sí sola que la conexión haya fallado.
6. En la pantalla inicial abre la tarjeta **PCdex Docker** con doble clic. En el panel izquierdo, en **SCHEMAS** (bases de datos), actualiza con el botón de recarga si hace falta. Despliega `pcdex` y luego **Tables** (tablas).
7. En una pestaña SQL copia ``SHOW TABLES FROM `pcdex`;`` y ejecuta la línea seleccionada con el icono del rayo. **Result Grid** es la cuadrícula de resultados. No compartas contraseñas, hashes ni registros personales.

Si aparece **Access denied** (acceso denegado), verifica el usuario y la contraseña existente sin cambiarlos. Si aparece **Can't connect** (no se puede conectar), comprueba Docker, el puerto y el estado de `pcdex-db`. Si una tabla no aparece, refresca SCHEMAS y comparte únicamente la lista de tablas. No ejecutes `CREATE DATABASE`, `DROP`, reset, migraciones ni `seed` para esta consulta.

Referencia: [MySQL Workbench: crear conexión](https://dev.mysql.com/doc/workbench/en/wb-getting-started-tutorial-create-connection.html).

La integración de Google se trata aparte en [análisis de acceso con Google](analisis-login-google-2026-11-17.md). La presente guía no habilita el inicio de sesión con Google ni cambia la configuración de OAuth.

## Ver los usuarios y sus correos

Johan confirmó que pudo conectarse desde Workbench. El esquema local define `User` con `id`, `username`, `email` y `createdAt`; el registro de la aplicación utiliza `prisma.user.create`. En una pestaña SQL de la conexión de PCdex se puede ejecutar esta consulta de lectura:

```sql
SELECT id, username, email, createdAt
FROM `pcdex`.`User`
ORDER BY createdAt DESC;
```

Seleccionar la consulta y pulsar el icono del rayo. `Result Grid` muestra el resultado. Cada vez que se registra correctamente una cuenta en la misma base, Workbench puede consultarla de nuevo; los resultados ya mostrados son una instantánea y deben actualizarse ejecutando otra vez la consulta. No se accedió a los correos durante la preparación de la guía ni se probaron registros nuevos. Evitar compartir capturas con información personal o consultar `passwordHash` y `totpSecret` innecesariamente.
