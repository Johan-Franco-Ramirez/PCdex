# PCdex

PCdex es una aplicación educativa para consultar componentes y evaluar compatibilidad. Utiliza React, Express, Prisma y MySQL.

El entorno local se inicia desde la raíz del proyecto con Docker Desktop:

```powershell
$env:APP_HOST_PORT = '8082'
$env:APP_ORIGIN = 'http://localhost:8082'
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --wait
```

Abre http://localhost:8082. La primera preparación de una base nueva requiere migraciones y datos de demostración; consulta la [guía MySQL](docs/seguimiento/migracion-mysql-implementacion.md). Los archivos Compose alternativos apuntan a la misma configuración. No cambies las claves de `backend/.env.mysql` ni elimines el volumen MySQL para reiniciar.

La [guía de persistencia](docs/seguimiento/persistencia-cuentas-mysql.md) explica cómo comprobar que una cuenta se conserva. El [índice de documentación](docs/README.md) reúne el resto del proyecto.
