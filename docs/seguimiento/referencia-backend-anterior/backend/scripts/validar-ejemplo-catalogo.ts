import { readFile } from 'node:fs/promises';
import { categories } from '../src/domain.js';
import { component, id, object } from '../src/validation.js';

const document = object(JSON.parse(await readFile(new URL('../api/ejemplos/catalogo-verificado.json', import.meta.url), 'utf8')));
if (document.version !== 1 || !Array.isArray(document.components) || !Array.isArray(document.builds) || document.builds.length !== 0)
    throw new Error('El archivo debe tener versión 1, componentes y builds vacío.');
const identifiers = new Set<string>();
const counts = new Map(categories.map(category => [category, 0]));
for (const raw of document.components) {
    const value = object(raw);
    const identifier = id(value.id);
    if (identifiers.has(identifier)) throw new Error(`ID duplicado: ${identifier}`);
    identifiers.add(identifier);
    const entry = component(value, identifier);
    if (entry.estimatedPrice !== null || entry.priceKind !== 'DEMO') throw new Error(`Precio inesperado: ${identifier}`);
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
}
for (const [category, count] of counts) {
    if (count < 1) throw new Error(`Falta un ejemplo para ${category}`);
    console.log(`${category}: ${count}`);
}
console.log(`Ejemplos válidos: ${identifiers.size}. No se conectó ni escribió en la base de datos.`);
