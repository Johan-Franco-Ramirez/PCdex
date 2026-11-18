# PCdex

PCdex es una aplicación educativa para consultar componentes y evaluar compatibilidad. Utiliza React, Express, Prisma y MySQL.

El entorno local se inicia desde la raíz del proyecto con Docker Desktop:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --wait
```

Abre el puerto configurado en `APP_HOST_PORT` (por defecto, http://localhost:8081). La primera preparación de una base nueva requiere migraciones y datos de demostración; consulta la [guía MySQL](docs/seguimiento/migracion-mysql-implementacion.md). Los archivos Compose alternativos apuntan a la misma configuración. No cambies las claves de `backend/.env.mysql` ni elimines el volumen MySQL para reiniciar.

`backend/.env.mysql` es la configuración privada local. La plantilla compartible sin credenciales es `backend/.env.example`; `frontend/.env.example` describe la configuración opcional de Vite. No subas el archivo privado ni los respaldos a Git. Si cambias el puerto de la aplicación y usas Google, revisa también el origen y la URL de retorno autorizada.

La [guía de persistencia](docs/seguimiento/persistencia-cuentas-mysql.md) explica cómo comprobar que una cuenta se conserva. El [índice de documentación](docs/README.md) reúne el resto del proyecto.
