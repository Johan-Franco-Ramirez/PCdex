# Datos de importación

Coloca aquí tu descarga o consolidación real de OpenDB como `buildcores.json`. No se distribuyen registros de ejemplo inventados.

Formatos admitidos:
- Arreglo de registros con `category`/`categoria` y los campos originales de OpenDB.
- Arreglo de envoltorios `{ "category": "CPU", "data": <registro original> }`.
- Objeto agrupado `{ "CPU": [...], "GPU": [...], "Motherboard": [...], "RAM": [...], "PSU": [...], "Storage": [...], "PCCase": [...], "CPUCooler": [...] }`.
- `{ "components": [...] }` o `{ "data": [...] }` con los arreglos anteriores.

OpenDB almacena archivos individuales por categoría; no todos los exports HTTP tienen el mismo envoltorio. La categoría externa debe conservarse al consolidarlos. El seed no adivina categorías por el nombre.

Precios reales opcionales: `precios-cop.json`, un objeto indexado por `opendb_id`; cada valor tiene `precio` (cadena decimal o número) y `moneda: "COP"`. Sin precio, el campo queda NULL en inserciones y se preserva en actualizaciones. Nunca se usa un precio cero ni una conversión implícita de USD.

Un registro normalizado puede incluir `precio` y `moneda: "COP"`, y sus datos técnicos en `procesador`, `tarjetaGrafica`, `placaMadre`, `memoriaRAM`, `fuentePoder`, `almacenamiento`, `gabinete` o `refrigeracion`.

Se preserva `opendb_id`; RAM, almacenamiento y VRAM usan GB; potencia usa W. En RAM se prioriza `capacity` (total del kit); si falta se calcula `modules.quantity * modules.capacity_gb`, sin adivinar desde el nombre.

Fuentes: https://github.com/buildcores/buildcores-open-db y sus esquemas oficiales. Conserva las atribuciones y condiciones de licencia aplicables al conjunto que descargues. Esta implementación mapea un subconjunto técnico y no redistribuye el catálogo.
