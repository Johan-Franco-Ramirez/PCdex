# Guía de rotación de credenciales

## 18 de noviembre de 2026

El equipo reportó que un compañero compartió credenciales con otra conversación de IA. No se conocen los nombres exactos de las credenciales compartidas ni se ha confirmado un uso indebido. Este documento es un plan preventivo, no un registro de rotaciones realizadas. No escribir valores, correos, códigos ni contraseñas aquí.

1. Identificar los nombres de las credenciales expuestas y los entornos afectados. Coordinar con los responsables y verificar un respaldo recuperable. El archivo local es `backend/.env.mysql`; sus copias anteriores también son sensibles. No cambiar credenciales hasta conocer su impacto.
2. Si se expuso el secreto de Google OAuth, el administrador del proyecto en Google Cloud debe crear un secreto nuevo para el cliente web, actualizarlo en los entornos autorizados, probar el acceso y revocar el anterior según la consola. Mantener la URL de retorno exacta autorizada. La contraseña de la aplicación Gmail es independiente.
3. Si se expuso una contraseña de aplicación Gmail, revocarla en la cuenta Google, crear otra y actualizar `SMTP_PASSWORD` en cada entorno autorizado. Si se compartió la contraseña normal, cambiarla en Google y revisar la seguridad de la cuenta. No compartir la nueva contraseña.
4. Si se expuso `SESSION_SECRET`, generar una nueva clave aleatoria y actualizarla de forma coordinada; las cookies anteriores dejarán de ser válidas. Si se expuso `EMAIL_CODE_SECRET`, actualizarlo con una clave distinta; los códigos pendientes dejarán de ser válidos.
5. No cambiar `TOTP_ENCRYPTION_KEY` por sustitución directa. Primero identificar administradores con TOTP y ensayar, en una copia aislada, una migración que descifre con la clave antigua y cifre con la nueva, o definir un restablecimiento supervisado. Verificar acceso y conservar un respaldo seguro hasta validar la recuperación. La clave anterior expuesta no es segura a largo plazo.
6. Para contraseñas MySQL, revisar la instancia, usuario, destino y privilegios; respaldar y ensayar un cambio coordinado en MySQL y en `MYSQL_PASSWORD`, `DATABASE_URL`, `DOCKER_DATABASE_URL` o `MYSQL_ROOT_PASSWORD` según corresponda. Modificar solo el archivo de entorno no cambia la contraseña en MySQL. No imprimir contraseñas ni conexiones.
7. Tras actualizar el archivo local, recrear el backend con `docker compose --env-file backend/.env.mysql -f docker-compose.mysql.yml --profile app up -d --no-deps --force-recreate backend`; verificar estado, acceso y envío de prueba. Si hay entornos adicionales, el responsable debe actualizarlos también. No utilizar `down -v`.
8. Eliminar la conversación donde se compartieron los secretos siguiendo la política de la cuenta. La eliminación de la conversación no revoca credenciales. Consultar la política de retención correspondiente.

En Windows con Node instalado se puede generar una clave aleatoria en la terminal local con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. No pegar el resultado en conversaciones, capturas o repositorios. Generar una distinta para cada propósito y aplicar solo las que se vayan a rotar.

Referencias oficiales: [Google Cloud: credenciales comprometidas](https://docs.cloud.google.com/docs/security/compromised-credentials?hl=en), [contraseñas de aplicación Google](https://support.google.com/accounts/answer/185833?hl=es), [Docker Compose restart](https://docs.docker.com/reference/cli/docker/compose/restart/) y [retención de chats de OpenAI](https://help.openai.com/en/articles/8983778-chat-and-file-retention-in-chatgpt).
