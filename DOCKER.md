# Ejecutar PCdex con Docker

Se necesitan Docker Desktop en ejecución y Docker Compose. Desde esta carpeta:

1. Copia `.env.docker.example` a `.env.docker` y establece las tres claves. La contraseña de SQL Server debe cumplir sus requisitos de complejidad; evita llaves, punto y coma y el carácter `$`.
2. Ejecuta `docker compose --env-file .env.docker up --build -d`.
3. Abre <http://localhost:8080>.

La primera ejecución descarga imágenes y puede tardar varios minutos. El servicio `inicializar` espera SQL Server, crea `pcdex_docker` si no existe, aplica migraciones y registra categorías y roles. No importa productos inventados. El volumen `pcdex-sql-data` conserva la base; `docker compose --env-file .env.docker down` detiene los servicios sin eliminarlo. No cambies la contraseña SQL de un volumen ya inicializado sin actualizarla también en SQL Server.

Para ver el estado: `docker compose --env-file .env.docker ps`. Para ver errores: `docker compose --env-file .env.docker logs inicializar backend`.

El contenedor usa una instancia y una base distintas de cualquier SQL Server instalado previamente. Esta configuración está pensada para desarrollo local por HTTP. Si cambias `FRONTEND_PORT`, cambia también `FRONTEND_ORIGIN` para que coincida.

El frontend, la administración, los ensambles y la importación OpenDB usan `Componente`. Las tablas antiguas `Component` se conservan. Si contienen registros, la migración se detiene para evitar perder datos o mezclar identificadores; será necesario convertir y revisar esos registros antes de aplicarla.
