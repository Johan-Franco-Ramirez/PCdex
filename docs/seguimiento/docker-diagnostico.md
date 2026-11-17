# Diagnóstico de Docker

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
