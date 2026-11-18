# Diagnóstico de Docker

## 17 de noviembre de 2026: servicios nuevamente activos

Johan informó que PCdex carga en el puerto 8081 y aportó `docker compose ... ps -a`: `pcdex-mysql-backend-1` y `pcdex-mysql-frontend-1` estaban `Up` desde hacía 52 minutos, y `pcdex-mysql-pcdex-db-1` estaba `Up` y `healthy`. El frontend exponía `127.0.0.1:8081` y MySQL `127.0.0.1:3307`. El asistente consultó `/api/components?limit=100`: se devolvieron 40 componentes, 40 con ambos enlaces de búsqueda y uno con imagen registrada. Se confirma el estado al momento de estas comprobaciones, no la causa exacta del error anterior ni el funcionamiento de todas las operaciones.

Para un arranque posterior desde la raíz del proyecto puede utilizarse `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --wait`. No es necesario reiniciar si ya funciona. No se cambió la contraseña ni se eliminaron volúmenes durante el diagnóstico. Falta probar en otra sesión que el arranque posterior funciona y, si el error se repite, capturar los logs y estado de ese mismo intento sin divulgar credenciales.

## 17 de noviembre de 2026: MySQL no inicializado y contraseña ausente

Johan compartió un error de Docker Desktop: `pcdex-db` no cumplió `service_healthy` y las aplicaciones dependientes no arrancaron; también compartió un registro de MySQL que indica que el directorio de datos parecía sin inicializar y no se proporcionó una opción de contraseña de root. El Compose local inspeccionado exige `MYSQL_ROOT_PASSWORD` y `MYSQL_PASSWORD` y publica la base en el volumen `pcdex-mysql-data`. Docker Desktop, los contenedores viejos y las ejecuciones con otro archivo o sin `--env-file` pueden tener una configuración diferente; por ahora no se conoce cuál produjo cada salida. `exited (0)` es un estado de salida del contenedor en ese momento y, sin contexto temporal, no explica por sí solo el error del registro. Johan confirmó código `0` al validar Compose. El primer comando de inspección falló por las comillas de la plantilla; el siguiente comando se simplificó para evitar comillas internas y aún debe ejecutarse.

No se cambió ninguna contraseña, contenedor o volumen. El daemon rechazó el acceso desde la sesión del asistente. Queda pendiente que Johan comparta el estado y el volumen efectivamente montado, sin valores de `.env`. Primero ejecutar, desde la raíz del proyecto en PowerShell:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app config -q
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a
docker volume ls
docker inspect pcdex-mysql-pcdex-db-1 --format '{{range .Mounts}}{{println .Type .Name .Destination}}{{end}}'
```

El volumen observado anteriormente se llamó `pcdex-mysql_pcdex-mysql-data`, pero debe verificarse en la ejecución actual. `config -q` valida la configuración sin imprimirla; si no muestra nada y termina con éxito es normal. No publicar el contenido de `.env`, ni usar `docker compose config` sin `-q` al compartir información, porque puede mostrar credenciales. No eliminar volúmenes, crear una nueva base, ejecutar migraciones/seed, ni reemplazar contraseñas mientras no se determine cuál volumen contiene los datos. En una base ya inicializada, editar variables de inicio no cambia automáticamente las contraseñas que MySQL ya tiene guardadas.

**Resultado posterior:** Johan confirmó que `pcdex-mysql-pcdex-db-1` tiene montado `pcdex-mysql_pcdex-mysql-data` en `/var/lib/mysql`, el mismo nombre de volumen observado anteriormente. Esto confirma el montaje, pero no inspecciona su contenido ni confirma el estado actual del servicio. El asistente consultó `http://localhost:8081/api/components?limit=100` y recibió `success: true`, 40 componentes y una URL de imagen para `motherboard-1`, coincidentes con la comprobación anterior. Aún no se puede asegurar que esa respuesta provenga del mismo contenedor inspeccionado. El daemon sigue rechazando el acceso desde la sesión del asistente; queda pendiente el resultado de `docker compose ... ps -a` desde la terminal de Johan para relacionar los servicios con el error comunicado. No se reiniciaron ni modificaron contenedores o datos durante este diagnóstico.

## 17 de noviembre de 2026: acceso al puerto de MySQL desde el navegador

La captura compartida muestra `ERR_INVALID_HTTP_RESPONSE` al abrir `127.0.0.1:3307` en Edge. Según `docker-compose.mysql.yml`, el puerto 3307 del equipo se dirige al 3306 de MySQL; este servicio usa el protocolo MySQL, no HTTP, por lo que el navegador no puede mostrarlo como página. La captura por sí sola no permite confirmar si MySQL está sano o si la aplicación está conectada.

El frontend publica `APP_HOST_PORT` o, por defecto, el puerto 8081. En `http://localhost:8081` se abre la web, y `/api/v1/components` se redirige mediante Nginx al backend. El puerto real puede ser otro si se configuró `APP_HOST_PORT`; se comprueba con `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app port frontend 80`. El backend escucha en el puerto 3000 de la red interna y no tiene puerto publicado en este Compose.

La consulta del estado de Compose desde la sesión del asistente recibió permiso denegado para el daemon de Docker. Queda pendiente que el usuario comparta `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a` y, si es necesario, el puerto efectivo del frontend; no se ejecutaron cambios en contenedores ni en datos.

## Actualización: puerto 8080 no disponible

Johan ejecutó `docker compose ... --profile app up -d --wait`: SQL Server apareció `Healthy`, el backend `Started`, y el frontend no pudo publicar `127.0.0.1:8080` porque Windows devolvió un error de acceso al puerto. Esto puede deberse a otro proceso, una reserva o una restricción; aún no se ha identificado la causa exacta. El backend iniciado no confirma por sí solo que todos los endpoints funcionen ni que la imagen sea la versión más reciente.

Solución propuesta en PowerShell, desde la raíz, sin borrar volúmenes ni cambiar archivos de variables:

```powershell
$env:APP_HOST_PORT = '8081'
$env:APP_ORIGIN = 'http://localhost:8081'
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml --profile app up -d --wait
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml --profile app ps -a
```

Abrir `http://localhost:8081`. El puerto 8081 es una alternativa que todavía no se ha comprobado libre en la terminal de Johan. Las dos variables duran solo en esa sesión de PowerShell. El backend puede recrearse para recibir el nuevo origen; no se eliminan los volúmenes. Sin `APP_ORIGIN` correspondiente, las solicitudes con comprobación de origen podrían fallar.

Si el puerto 8081 también falla, comprobar `netstat -ano | findstr :8081`, revisar `netsh interface ipv4 show excludedportrange protocol=tcp`, seleccionar otro puerto y cambiar ambas variables. Si Compose inicia, pero se ve una versión anterior, verificar primero el estado y luego reconstruir las imágenes, sin asumir que el cambio de puerto actualiza el código.

Se recomienda mantener la documentación compartible en Git y excluir solo archivos privados o generados concretos. `.gitignore` no deja de seguir automáticamente archivos ya seguidos y no borra secretos del historial. No se modificó `.gitignore` por esta recomendación.

## Estado comunicado el 12 de noviembre de 2026

| Contenedor           | Estado           | Interpretación                                                  |
| -------------------- | ---------------- | ---------------------------------------------------------------- |
| `pcdex-backend-1`  | `Exited (255)` | Está detenido; el código no revela por sí solo la causa.      |
| `pcdex-frontend-1` | `Exited (1)`   | Está detenido; necesitamos sus registros para conocer el error. |

En el listado general comunicado por Johan solo aparecen los dos contenedores PCdex detenidos y otro contenedor ajeno; no se observa un contenedor SQL Server. No es evidencia de pérdida de datos: todavía falta comprobar los volúmenes.

Los registros recibidos muestran que el backend había iniciado anteriormente con el mensaje `PCdex API lista en el puerto 3000`. No muestran por qué se detuvo. El frontend inició una vez, pero el 12 de noviembre Nginx informó `host not found in upstream "backend"`: en ese momento no pudo resolver el nombre del servicio backend en su red. El registro no permite atribuir con certeza la causa de la detención inicial del backend ni saber si las imágenes corresponden a la versión más reciente.

La última revisión del asistente no pudo consultar Docker por permisos, aunque Johan sí pudo ejecutar el comando en PowerShell. Las causas de la versión antigua y de la detención siguen sin confirmarse.

## Siguiente diagnóstico desde PowerShell

En la carpeta raíz de PCdex, con Docker Desktop iniciado:

```powershell
docker volume ls --format 'table {{.Name}}'
```

Compartir la salida y señalar si hay datos anteriores que deban conservarse. Indicar también la URL abierta. No pegar el contenido de archivos `.env` ni la salida completa de `docker inspect` o `docker compose config`.

## Qué revisaremos

1. Identificar los volúmenes y qué datos se desean conservar. Un volumen no se debe eliminar aunque no tenga contenedor.
2. Iniciar la base correcta y esperar su estado saludable, manteniendo las claves existentes.
3. Construir las imágenes actuales y levantar backend y frontend en el orden y red de Compose.
4. Verificar estado y registros; si no arranca, diagnosticar el error actual. No ejecutar seed ni migraciones sin revisar su impacto.

## Datos y seguridad

No usar `docker compose down -v`, `docker volume prune`, `prisma migrate reset` ni borrar bases para diagnosticar. No cambiar secretos existentes: pueden corresponder al volumen y a los datos de sesiones o TOTP. Antes de cualquier migración con riesgo de pérdida de datos, verificar el destino y disponer de una copia recuperable.
