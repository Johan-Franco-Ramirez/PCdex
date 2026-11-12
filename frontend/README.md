# PCDex Frontend

React + TypeScript + Vite + Tailwind CSS + Lucide.

## Comandos

- `npm run dev`: iniciar el entorno de desarrollo.
- `npm run build`: verificar tipos y generar producción.
- `npm run lint`: comprobar el código.
- `npm test`: comprobar catálogo, presupuestos, compatibilidad simulada e importaciones.

## Módulos

- `#/home`: presentación, categorías, destacados y acceso al constructor.
- `#/catalog`: ocho categorías, búsqueda al enviar, filtros por marca y generación.
- `#/component?id=CPU-0042`: ficha técnica dinámica y acciones de guardado.
- `#/builder`: una pieza por categoría, presupuesto, diagnóstico simulado y varios ensambles con nombre.
- `#/comparison`: ofertas por componente y estado (nuevo, usado o reacondicionado), sin enlaces externos.
- `#/admin`: administración demo de componentes y ofertas para cuentas con rol `ADMIN`, con registro, edición, eliminación e importación JSON.
- `#/login` y `#/register`: acceso y registro de cuentas guardadas en MySQL.
- `#/profile`: edición del nombre, correo y contraseña, y consulta de favoritos. Los cambios de correo y contraseña requieren la contraseña actual de PCdex.

El botón «Continuar con Google» requiere configurar el cliente OAuth en el backend; consulta la sección «Acceso con Google» del README del backend.

## Conexión con el backend

En desarrollo, Vite redirige `/api` y `/health` a `http://localhost:3000`. En Docker, Nginx envía `/api` al servicio `api` dentro de Compose. Arranca el stack con `cd backend; docker compose --env-file .env.mysql up -d --build`; abre http://localhost:8081. El frontend consulta todas las páginas del catálogo compartido y valida en el servidor los ensambles completos. La interfaz indica si usa el backend o el catálogo local de demostración.

Si se despliega el frontend y el backend en hosts separados, define `VITE_API_URL` al construir el frontend y configura `CORS_ORIGIN` en el backend para el origen del navegador.

## Datos y sesión

El catálogo público procede del backend cuando está disponible; si no, la app muestra datos locales de demostración. El constructor valida sus ocho piezas con las reglas del backend. Registro, inicio y cierre de sesión, perfil y favoritos usan la API; la sesión y los favoritos se restauran al recargar. Ensambles y acciones administrativas aún son simulaciones locales.

Los cambios administrativos y ensambles viven en memoria y se reinician al recargar. El backend almacena un hash de la contraseña y mantiene la sesión con una cookie HttpOnly; la contraseña no se guarda en el frontend.

Las cuentas `ADMIN` entran directamente a Administración al iniciar sesión y pueden abrir todas las pestañas públicas, además de Administración. Al recargar se conserva la sección elegida. El logo vuelve a Inicio. Usuarios y visitantes conservan la navegación pública sin Administración; abrir `#/admin` directamente envía a los usuarios al inicio y a los visitantes al acceso. La interfaz espera a comprobar la sesión antes de mostrar el contenido correspondiente al rol. El rol se obtiene de la API y se asigna en el backend; el registro público no permite elegirlo.

Los precios y las ofertas son simulados. El diagnóstico comprueba datos demo de socket, memoria, anclaje del cooler y potencia estimada con margen; siempre requiere verificar BIOS, dimensiones, conectores y capacidad térmica con el fabricante.

## Estructura

- `src/components/`: elementos reutilizables de catálogo, layout y ofertas.
- `src/pages/`: Inicio, Catálogo, Ficha, Constructor, Comparador, Administración, Login y Registro.
- `src/data/`: fixtures de componentes, ocho categorías, ofertas y benchmarks.
- `src/types/`: modelos de hardware y autenticación.
- `src/services/`: búsqueda, totales, diagnóstico, validación de importaciones y utilidades.
- `src/hooks/`: lógica reutilizable de interfaz.
- `src/routes/`: navegación y estado compartido de la demo.
- `public/images/`: recursos estáticos.

## PCdex AI (solo frontend)

Abre «PCdex AI» y prueba «Arma un PC con presupuesto de 4 millones», «Cambia el procesador por Intel», «Pon RAM DDR4», «Quita la gráfica» o «Verifica compatibilidad». También puedes seleccionar o eliminar componentes manualmente. El presupuesto y las piezas se comparten con el constructor existente. El chat se conserva al cambiar de pantalla; recargar reinicia el estado. «Nuevo chat» borra la conversación y conserva la configuración.

`aiService.ts`, `componentService.ts` y `buildService.ts` implementan contratos asíncronos definidos en `src/types/ai.ts`, preparados para sustituir sus implementaciones por HTTP en el futuro. Actualmente solo consultan datos locales. No requieren backend, claves, peticiones externas, autenticación ni LocalStorage.

El asistente reconoce instrucciones locales de ejemplo; no es un modelo de lenguaje. El generador elige una combinación completa compatible con las reglas disponibles y de mayor precio dentro del presupuesto. Si ninguna cabe, muestra la alternativa compatible más económica y su exceso. Las reglas comprueban socket, RAM, anclaje del cooler, formato y potencia estimada; no simulan rendimiento ni garantizan compatibilidad real.

## Importación administrativa

Pega un arreglo JSON de hasta 100 componentes. Cada registro requiere `id`, `name`, `brand`, `category`, `price`, `summary`, `badge` y `specs` (pares de textos). Puede incluir `generation`, `socket`, `memory`, `watts`, `capacity` y `formFactor`. Usa «Cargar ejemplo» para obtener una plantilla válida. La importación añade nuevos IDs y actualiza los existentes; rechaza el lote entero si algún registro no es válido.
- `#/ai`: PCdex AI, conversación simulada y constructor sincronizado, accesibles sin sesión.
