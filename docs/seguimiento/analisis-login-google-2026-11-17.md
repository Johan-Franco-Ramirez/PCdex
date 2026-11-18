# Análisis: acceso con Google y rama remota

Fecha: 17 de noviembre de 2026. Se revisaron las referencias de Git y archivos locales, y se consultó el repositorio `Johan-Franco-Ramirez/PCdex` mediante GitHub. No se muestran valores de archivos privados ni credenciales.

## Resultado

La rama activa local `feature/backend-api` está en `098226dda178ceb84c84d1da8146353030346605`, con numerosos cambios sin confirmar. En GitHub, `actualizacion-proyecto` apunta a `9933c788a4082c9f7a42bb1b36a7759b13e4ade2`; `main` apunta a `545663e7a61285d194ad97568678e88c1aa2ca68`. Se verificó que ambos commits remotos tienen el mismo árbol de archivos en esta consulta. El HEAD local es antecesor de `actualizacion-proyecto`: esta contiene siete commits posteriores; el `git pull` anterior en `feature/backend-api` actualizó su propia rama, no integró la de su compañero.

La comparación entre los commits local y `actualizacion-proyecto` enumera 118 archivos cambiados. Hay 19 rutas seguidas que también tienen modificaciones o eliminaciones locales; además, existen archivos sin seguimiento que deben compararse antes de una integración. No se presenta ese número como lista completa de conflictos de un merge. No se realizó `pull`, `fetch`, fusión ni cambio de rama durante esta revisión; las referencias locales de esas dos ramas coincidían con las consultadas en GitHub. No se modificó el esquema, la base ni los contenedores.

## Google, correo y estado local

| Elemento | Versión remota `actualizacion-proyecto` | Copia local activa |
|---|---|---|
| Botón de Google | `frontend/src/pages/Login/AuthForm.tsx` muestra «Continuar con Google». | El formulario local no incluye ese botón. |
| Ruta | `GET /api/auth/google` inicia OAuth y `/api/auth/google/callback` recibe la respuesta. | Al consultar la aplicación en `http://localhost:8081`, la primera ruta devolvió HTTP 404. |
| Biblioteca | `google-auth-library`, usada por el backend remoto. | No se encontró la dependencia instalada con ese nombre en `backend/node_modules`. |
| Identidad | Usa `Usuario.google_sub` único; la contraseña puede ser nula. | El esquema actual tiene `User` con `passwordHash` obligatorio y no tiene `google_sub`. |
| Sesiones | Usa el modelo `Sesion` y cookies propias. | Usa `Session`, `express-session`, token CSRF y un flujo TOTP para ADMIN. |
| Correo de verificación | El registro remoto puede requerir código de seis dígitos y SMTP. | No se encontraron los módulos remotos `email.ts` y `email-code.ts` en el módulo local de autenticación. |

El código remoto contempla `state`, PKCE, `nonce`, verificación del token de Google y correo verificado. No se vincula automáticamente una cuenta local existente que tenga el mismo correo; el código remoto responde con un error y pide usar su contraseña. Es una revisión estática; no se ha completado un acceso real con Google en esta copia ni se afirma que cubra todos los casos de seguridad.

En `backend/.env.mysql` se comprobó **solo la presencia de valores no vacíos**, sin imprimirlos: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SMTP_USER`, `SMTP_PASSWORD` y `EMAIL_CODE_SECRET` estaban ausentes o vacíos. Esto no comprueba otras fuentes de configuración ni una consola externa. El Compose local tampoco pasa variables de Google al backend. Un correo Gmail y una contraseña de aplicación SMTP permiten configurar el envío de mensajes; no sustituyen el cliente OAuth necesario para «Continuar con Google».

El README remoto indica registrar un cliente web OAuth en Google Cloud y autorizar `http://localhost:8081` y `http://localhost:8081/api/auth/google/callback`; en modo de prueba pueden requerirse usuarios de prueba. Después se necesitan `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en configuración privada. No pegar el secreto en este documento, en Git, Jira ni en el chat. La configuración final debe ajustarse al flujo integrado y a los orígenes reales, no copiarse a ciegas.

## Migraciones y rama de integración existente

El remoto contiene migraciones `20261111000300_google_login` y `20261111000400_google_reauth`: modifican `Usuario` y crean `VerificacionGoogle` con referencia a `Sesion`. No se pueden aplicar directamente a la estructura local actual `User` / `Session` sin una estrategia de adaptación y ensayos. Otros modelos y migraciones de catálogo y ensambles también difieren. El esquema local se conservó sin cambios.

Ya existe el trabajo aislado `codex/integracion-api-en-curso`, commit `d13e742a10e5e87dc2c057482fe95a598049d89a`, que desciende de `main` e incluye trabajo de integración. Su documento `respaldo-integracion-2026-11-17.md` registra que el frontend pasó una compilación y sus pruebas en una revisión anterior, mientras el backend no compiló por diferencias de dependencias y modelos. La rama es un trabajo en curso: esa información histórica no confirma su estado actual ni la hace lista para mezclar. No se editó esa copia durante esta revisión.

La imagen del compañero describe una instalación de su versión, incluida configuración SMTP. Ejecutar `Copy-Item .env.example .env.mysql` dentro de tu backend podría sobrescribir tu configuración existente. Su Compose y su historial de migraciones también difieren de los tuyos; no iniciarlos sobre tu volumen actual como si fueran equivalentes. Tampoco debe utilizarse `docker compose down -v` ni reinicializar la base para esta revisión.

## Trabajo siguiente para integrar

1. Revisar y actualizar el respaldo recuperable de los cambios locales y realizar una copia recuperable y verificada de MySQL antes de cualquier migración. Un respaldo de archivos del trabajo aislado no es una copia de la base y puede estar desactualizado.
2. Continuar en una copia aislada, reconciliando las rutas de API, catálogo, frontend, login, sesiones y dependencias. Decidir cómo trasladar o adaptar de forma segura la identidad Google, los usuarios existentes y el control TOTP de ADMIN; documentar las decisiones y conflictos.
3. Diseñar una migración apropiada para la estructura elegida y ensayarla con una base de prueba aislada y datos de prueba. No ejecutar la migración sobre la base actual sin verificar destino y respaldo y obtener la autorización específica requerida por el proyecto.
4. Configurar las credenciales OAuth en el entorno privado y validar botón, callback, `state`, PKCE, nonce, sesión, rechazo de colisiones de correo y preservación de TOTP. Probar la pantalla de error sin credenciales y un acceso real con una cuenta autorizada sin compartir secretos.
5. Validar por separado la verificación por correo si el equipo desea ese flujo, y comprobar que las funciones locales (40 componentes, enlaces, generación y persistencia) sigan operando.

## Jira propuesto

**Historia:** integrar Google en PCdex sin perder cuentas ni funciones existentes.

**Dependencias:** cliente OAuth web configurado, usuarios de prueba, diseño de datos aprobado y entorno de pruebas aislado con respaldo comprobado.

**Criterios de aceptación:** iniciar con Google crea o recupera la cuenta correcta; una cuenta local del mismo correo no se vincula sin procedimiento explícito; las cuentas y ensambles existentes permanecen; ADMIN conserva TOTP; las credenciales no aparecen en Git ni logs; se registran pruebas de error, seguridad y acceso real. La verificación por correo SMTP se prueba como funcionalidad separada. Tarea propuesta en este documento, no creada en Jira.
