# PCdex Backend

## 1. Descripción

El backend de PCdex es la API encargada de gestionar los datos y las funcionalidades de la plataforma PCdex, un proyecto educativo que ayuda a los usuarios a configurar computadores de escritorio según su presupuesto y necesidades.

PCdex no es una tienda. La plataforma ofrece información de componentes, validaciones técnicas, recomendaciones y enlaces externos a proveedores.

## 2. Tecnologías

- Node.js
- TypeScript
- Express
- Prisma ORM
- SQL Server Express
- Docker

**Entorno local registrado:** Node.js v26.3.0 y npm 11.16.0.

Las versiones definitivas y su compatibilidad se validarán antes de establecer el entorno de ejecución del proyecto.

## 3. Arquitectura

El backend utiliza una organización modular por responsabilidades.

- `src/config/`: configuración de la aplicación y servicios compartidos.
- `src/middlewares/`: procesamiento común de solicitudes, errores y controles de seguridad.
- `src/modules/`: módulos funcionales independientes.
- `src/app.ts`: configuración de Express y registro de rutas y middlewares.
- `src/server.ts`: inicialización del servidor.
- `prisma/`: esquema de datos y migraciones de la base de datos.

### Módulos previstos

**Hardware:** gestión y consulta del catálogo de componentes.

**Compatibility:** validación determinista de compatibilidad entre componentes.

Los módulos de autenticación, usuarios, configuraciones de PC, precios, recomendaciones y administración se incorporarán progresivamente cuando se definan sus requisitos.

## 4. Principios de diseño

- Mantener una arquitectura sencilla, modular y mantenible.
- Separar rutas, controladores, servicios y acceso a datos cuando aporte claridad.
- Validar los datos de entrada.
- Centralizar el manejo de errores.
- Mantener las credenciales fuera del control de versiones.
- Separar las especificaciones de los componentes de los precios de los proveedores.
- Utilizar reglas técnicas deterministas para comprobar compatibilidad.
- Evitar dependencias innecesarias y funcionalidades fuera del alcance del proyecto.

## 5. Estado actual

La estructura inicial de carpetas está creada y el módulo `hardware` cuenta con archivos para rutas, controlador, servicio, repositorio y esquemas.

La existencia de estos archivos no implica que su funcionamiento esté validado.

Pendiente de verificar:

- Scripts y dependencias de `package.json`.
- Configuración de TypeScript.
- Configuración de Express y arranque del servidor.
- Esquema y configuración de Prisma.
- Conexión con SQL Server Express.
- Variables de entorno y archivo `.env.example`.
- Configuración de Docker.
- Pruebas automatizadas y documentación de endpoints.

## 6. Próximas etapas

1. Revisar y validar la arquitectura existente.
2. Confirmar la configuración de Node.js, TypeScript y Express.
3. Configurar y probar Prisma con SQL Server Express.
4. Implementar y probar un endpoint de salud.
5. Definir el modelo de datos del catálogo.
6. Implementar las consultas de hardware y sus validaciones.
7. Incorporar las reglas de compatibilidad.
8. Añadir pruebas, seguridad y documentación de la API.

Cada etapa debe validarse antes de avanzar a la siguiente.

## 7. Seguridad

- No publicar el archivo `.env`.
- No incluir contraseñas, tokens ni cadenas de conexión con credenciales en el repositorio.
- Mantener `.env.example` con nombres de variables y valores de ejemplo no sensibles.
- Proteger las operaciones administrativas cuando se implemente la autenticación y autorización.

## 8. Alcance

La API proporciona datos y funcionalidades para PCdex. No procesa ventas ni pagos. Los precios y enlaces comerciales corresponden a proveedores externos y deberán mantenerse separados de las especificaciones técnicas de los componentes.

## 9. Instalación y ejecución

Los comandos definitivos se documentarán después de revisar los scripts de `package.json`, la configuración de Prisma y los servicios de Docker.

No se deben ejecutar migraciones destructivas ni eliminar volúmenes de la base de datos sin comprobar previamente qué información contienen. 