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
- `#/admin`: administración demo de componentes y ofertas, con registro, edición, eliminación e importación JSON.
- `#/login` y `#/register`: acceso y registro de demostración.

## Datos y sesión

El contenido público y el constructor se pueden explorar sin sesión. Guardar favoritos, componentes o ensambles requiere iniciar sesión; la acción pendiente se completa al acceder. El administrador requiere una sesión demo, sin roles reales.

Los datos y los cambios administrativos viven en memoria y se reinician al recargar. Los favoritos y ensambles se separan por correo dentro de la sesión. No se almacenan contraseñas ni se realiza autenticación real.

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
