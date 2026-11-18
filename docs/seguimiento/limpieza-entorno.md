# Limpieza de archivos de entorno

## 18 de noviembre de 2026

### Objetivo y resultado

Se organizaron los archivos de entorno que utiliza el proyecto actual con MySQL. Quedan tres archivos en las carpetas activas:

| Archivo | Uso |
| --- | --- |
| `backend/.env.mysql` | Configuración privada local para MySQL, sesiones, Google y correo. No compartir ni subir a Git. |
| `backend/.env.example` | Plantilla del backend sin credenciales reales, para compartir con el equipo. |
| `frontend/.env.example` | Plantilla de la variable opcional `VITE_API_URL` de Vite. |

Se retiraron de las carpetas activas `.env` y `backend/.env`, que contenían las mismas variables antiguas, y `backend/.env.functional`, correspondiente al entorno SQL Server anterior. La plantilla `backend/.env.mysql.example` se consolidó en `backend/.env.example`. Había dos entradas idénticas de `SMTP_PASSWORD` en la configuración privada; se conservó una. No se cambiaron sus valores efectivos ni las credenciales OAuth.

Antes de retirar o modificar estos archivos se guardaron copias en `backups/limpieza-env-20261118-070049`. **Esas copias pueden contener credenciales** y están dentro de OneDrive, que puede sincronizarlas. La carpeta está ignorada por Git. Los archivos antiguos `.env` estaban rastreados por Git: su eliminación aparecerá en `git status` y debe revisarse antes de un commit. `.gitignore` no elimina archivos ni secretos ya publicados en el historial.

El inicializador `backend/scripts/init-mysql.mjs` ahora prepara también los campos de Google y Gmail y genera `EMAIL_CODE_SECRET` al crear una configuración nueva. Usa creación exclusiva: no reemplaza el archivo existente. La verificación de correo queda desactivada por defecto en configuraciones nuevas.

### Comprobaciones

- La configuración completa que produce Docker Compose fue idéntica antes y después de la limpieza. Se comparó en memoria sin imprimir sus valores privados.
- `prisma migrate status` conectado a `pcdex` en `127.0.0.1:3307` informó que la base está actualizada.
- La ruta de sesión de la aplicación respondió HTTP 200 en `localhost:8081`.
- Se probó el inicializador en un directorio temporal independiente y se verificó la presencia de las variables nuevas, sin exponer sus valores.

Estas verificaciones no equivalen a una prueba nueva de registro, correo o Google con proveedores reales. No se reconstruyeron contenedores, ni se borraron volúmenes, datos o respaldos. Las instrucciones anteriores que usaban `.env.functional` son históricas: en la configuración actual usa `--env-file backend/.env.mysql`.

### Por revisar en otra etapa

El repositorio tiene archivos de `backend/node_modules` ya rastreados por Git. La regla `.gitignore` no deja de rastrearlos automáticamente. Su retirada del índice requiere una revisión separada del alcance y del historial; esta limpieza no modificó el índice de Git. Los archivos Compose alternativos se conservaron porque actúan como entradas compatibles. Los registros históricos se conservan para no perder el contexto del equipo.

### Propuesta para Jira

**Tarea:** Revisar los archivos sensibles y generados rastreados en Git. **Pasos:** inventariar rutas rastreadas, identificar credenciales expuestas sin mostrarlas, evaluar rotación y preparar la retirada del índice sin borrar archivos locales. **Criterios:** configuraciones privadas y dependencias generadas no se incluyen en commits futuros; la plantilla permite configurar un entorno nuevo; el equipo puede instalar dependencias y arrancar MySQL. **Dependencia:** revisión del historial y coordinación del equipo. La tarea no se ha creado automáticamente.
