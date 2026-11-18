# PCdex

Plataforma para explorar componentes de computador, armar ensambles y revisar su compatibilidad. Utiliza React y TypeScript en el frontend, y Node.js, Express, Prisma y MySQL en el backend.

Para iniciar la aplicación con Docker, desde la carpeta `backend` ejecuta:

```powershell
docker compose --env-file .env.mysql up -d --build
```

La aplicación está disponible en http://localhost:8081. Consulta [la guía del backend](backend/README.md) para configurar MySQL, las credenciales locales y el correo de verificación.
