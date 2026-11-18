# Acceso con Google y verificación de correo

> Actualización posterior del 17 de noviembre de 2026: se creó un respaldo SQL de la base local, se restauró en un MySQL aislado y se compararon sus 17 tablas y cantidades de registros. Se aplicó la migración `202611180001_google_identity` a `pcdex` en `127.0.0.1:3307`; Prisma informó que el esquema está actualizado. Quedan pendientes la reconstrucción de Docker, configurar credenciales y la prueba real. Los apartados que describen la migración como pendiente registran la situación anterior.

## Reconstruir Docker después de la migración

Con Docker Desktop abierto, desde PowerShell en la carpeta raíz de PCdex:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --build --wait
```

El comando construye las imágenes actuales y levanta los servicios; no elimina el volumen de MySQL. A continuación, revisar:

```powershell
docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app ps -a
```

Abrir `http://localhost:8081`. El botón de Google requiere las credenciales OAuth reales; la verificación por correo permanece desactivada hasta configurar Gmail y cambiar `REQUIRE_EMAIL_VERIFICATION` a `true`. Tras modificar el archivo de entorno hay que recrear el backend con el mismo comando `up`.

El respaldo está en `backups/mysql/`, que Git ignora. Contiene información privada y la carpeta se encuentra dentro de OneDrive, por lo que puede sincronizarse con esa cuenta. La prueba de restauración comparó las tablas y cantidades de registros; no constituye una comparación de cada campo. La copia aislada de prueba quedó en una carpeta temporal local.

## 17 de noviembre de 2026: implementación preparada

Se revisó la implementación de la rama remota `actualizacion-proyecto` y se adaptaron sus funciones al esquema y las sesiones existentes en esta copia de PCdex. No se integró la rama completa: sus modelos de usuario y sesión difieren de los locales. Se conservaron la API, el catálogo, los cambios existentes y los datos. Los archivos anteriores que fue necesario modificar están respaldados en `backups/antes-google-20261117`, carpeta ignorada por Git.

### Qué se agregó y por qué

- Acceso web con Google en `/api/auth/google` y `/api/auth/google/callback`. El backend verifica el token e identifica a la persona mediante el identificador estable de Google. Se usan estado, nonce y PKCE para proteger el intercambio.
- Nuevos modelos `GoogleIdentity` y `EmailVerification`, mediante una migración que únicamente crea estas dos tablas. No se han cambiado ni eliminado las tablas de usuarios existentes. La migración está preparada, pero **todavía no se ha aplicado a la base real**.
- Envío de un código de seis dígitos mediante Gmail para registrar una cuenta con contraseña. El código vence en 15 minutos, tiene un máximo de cinco intentos y hay una espera de 60 segundos entre solicitudes. Se guarda una huella protegida, no el código en texto plano.
- Un botón de Google y, cuando se habilite la verificación, los controles para solicitar e ingresar el código en el formulario de registro.
- Se añadieron `google-auth-library` y `nodemailer` y los tipos necesarios. No se actualizó Prisma a una versión principal diferente.

Por seguridad, Google no vincula automáticamente una cuenta existente con el mismo correo: se debe iniciar sesión con la contraseña existente; la vinculación segura queda pendiente. El acceso de administradores mantiene el segundo factor y no se habilita por Google con esta implementación.

### Configuración local

El archivo privado `backend/.env.mysql` contiene los campos siguientes. Se añadieron solo los que no existían, sin cambiar las configuraciones anteriores. `EMAIL_CODE_SECRET` se generó localmente al agregarlo; no se debe mostrar ni reemplazar sin necesidad.

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8081/api/auth/google/callback
SMTP_USER=
SMTP_PASSWORD=
REQUIRE_EMAIL_VERIFICATION=false
```

El ID y secreto pertenecen al cliente web OAuth del proyecto en Google Cloud. La dirección de retorno debe coincidir exactamente con la autorizada para ese cliente. `SMTP_USER` es la dirección Gmail que envía los mensajes y `SMTP_PASSWORD` debe ser una contraseña de aplicación, no la contraseña habitual. Google exige tener activada la verificación en dos pasos para crearla. Los valores se escriben directamente en el archivo privado, sin enviarlos al chat ni subirlos a Git.

La verificación por correo queda desactivada inicialmente para que el registro antiguo siga funcionando hasta que el correo esté listo. Después de configurar SMTP y aplicar la migración, cambiar `REQUIRE_EMAIL_VERIFICATION` a `true` y recrear el backend. Mientras esté en `false`, no se envían ni se solicitan códigos de registro.

### Pruebas efectuadas

- Compilación TypeScript del backend y compilación y lint del frontend: aprobados en la copia de preparación.
- Pruebas HTTP con proveedores y base simulados: registro con código, límite de intentos, falta de configuración y flujo Google con controles de seguridad.
- En un MySQL **aislado** en `127.0.0.1:33317`, se aplicó primero la migración antigua, se creó un usuario ficticio, se aplicó la nueva migración y se comprobó que la cuenta anterior iniciaba sesión. También se verificaron registro y Google usando proveedores simulados. No se enviaron correos ni se contactó con Google real.
- Consulta de estado de migración en `pcdex` de `127.0.0.1:3307`: la migración `202611180001_google_identity` figura pendiente. Esa consulta no modificó la base.

### Pendientes para ponerlo en marcha

1. El responsable de Google Cloud debe compartir de forma segura el ID y secreto del cliente web y autorizar exactamente `http://localhost:8081/api/auth/google/callback`; si la aplicación está en pruebas, debe autorizar también las cuentas de prueba necesarias.
2. Configurar Gmail y la contraseña de aplicación en el archivo privado. No compartir claves o códigos en conversaciones.
3. Antes de tocar la base real, preparar y verificar un respaldo recuperable. Después aplicar la migración pendiente al destino correcto y reconstruir backend y frontend. El Docker de esta sesión rechazó el acceso, por lo que no se han realizado estas acciones.
4. Comprobar inicio con usuario anterior, registro por código y acceso Google real en el navegador. Registrar resultados sin datos personales.

### Propuesta para Jira

**Historia:** Permitir el ingreso con Google y verificar el correo en registros locales. **Criterios:** Google autentica con cliente autorizado; códigos válidos se envían y consumen una vez; un usuario anterior conserva su acceso; los errores de configuración son comprensibles; no se registran secretos. **Dependencias:** credenciales OAuth y SMTP, respaldo verificado, migración, reconstrucción y prueba de extremo a extremo. Esta tarea se propone; no se ha creado en Jira.

Referencias: [Google OAuth para aplicaciones web](https://developers.google.com/identity/protocols/oauth2/web-server?hl=es) y [contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833?hl=es).
