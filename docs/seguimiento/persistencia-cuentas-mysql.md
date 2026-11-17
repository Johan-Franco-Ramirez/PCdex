# Comprobación de cuentas en MySQL

## Problema comunicado

Johan informó que, tras cerrar y volver a iniciar, debe registrar de nuevo la cuenta para entrar. Esto afecta el registro persistente, no solamente la duración de la sesión. La causa no está confirmada: pueden influir diferentes instancias, volúmenes, errores de registro o una base distinta.

## Cambios aplicados

Los archivos `docker-compose.yml`, `docker-compose.functional.yml` y `docker-compose.backend.yml` incluyen `docker-compose.mysql.yml` y declaran el mismo proyecto `pcdex-mysql`. Las cuatro entradas usan la configuración MySQL y el volumen lógico `pcdex-mysql-data`. Todas requieren `--env-file backend/.env.mysql`; las variables antiguas no deben usarse para arrancarlas. Esto reduce la posibilidad de crear entornos distintos por elegir otro archivo, pero no demuestra por sí solo la causa del problema anterior ni recupera registros de otra base.

Se eliminó el documento de diagnóstico de sesión solicitado, así como archivos locales de preparación y pruebas del motor anterior y la copia archivada del esquema anterior. No se eliminó ningún contenedor, imagen, volumen ni base. Los scripts automatizados de prueba que dependían del motor anterior siguen deshabilitados hasta adaptarlos a MySQL.

## Comprobar paso a paso

1. Abre Docker Desktop y, en PowerShell desde la raíz de PCdex, usa siempre este entorno:

```powershell
$env:APP_HOST_PORT = '8082'
$env:APP_ORIGIN = 'http://localhost:8082'
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --wait
```

2. Abre http://localhost:8082. Registra una cuenta de prueba y comprueba que la interfaz confirma el registro. Después, desde otra terminal en PCdex, consulta el número de usuarios y ensambles sin imprimir sus datos:

```powershell
npm.cmd --prefix backend run db:check:local
```

El resultado muestra la base y los conteos. La conexión usa el puerto MySQL 3307 de `backend/.env.mysql`. No compartas contraseñas ni el archivo de configuración.

3. Tras anotar el conteo, detén y reinicia el proyecto conservando el volumen:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app stop
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --wait
npm.cmd --prefix backend run db:check:local
```

Los conteos deberían coincidir si no hubo otros cambios. Abre la misma URL e inicia sesión con la cuenta de prueba. Tener que iniciar sesión de nuevo puede ser normal; tener que registrar otra vez la misma cuenta indica que aún hay algo que investigar.

Si la cuenta no funciona, compartir ambos conteos, el mensaje exacto de la interfaz y la salida de:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a
docker volume ls
```

No se debe ejecutar `down -v`, eliminar volúmenes ni cambiar claves para resolverlo.

## Verificación realizada

Se validó sintácticamente la configuración de las cuatro entradas Compose y todas declaran el mismo volumen lógico. El typecheck y las tres pruebas unitarias pasaron. El asistente no pudo acceder al daemon de Docker y la consulta local a MySQL no pudo conectar a `127.0.0.1:3307`, de modo que no se verificaron los conteos, el registro real ni la persistencia tras reinicio. La salida del usuario determinará el siguiente paso.
