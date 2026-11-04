# PCdex

Primera entrega manual verificada con React/Vite, Express/TypeScript y Prisma/SQL Server.

La aplicación local en Docker está disponible en **http://localhost:8080**. El catálogo contiene 40 componentes demo, cinco por categoría. Se verificaron autenticación, TOTP administrativo, edición del catálogo, compatibilidad, ensambles privados y su recuperación después de reiniciar el backend.

Para iniciar los contenedores ya construidos:

```powershell
docker compose --env-file backend/.env.functional -f docker-compose.functional.yml --profile app up -d --wait
```

No hay credenciales administrativas predeterminadas. Consulta [instalación, creación del administrador y guion de aceptación](backend/README.md) y [resultados de verificación](backend/VERIFICATION.md).
