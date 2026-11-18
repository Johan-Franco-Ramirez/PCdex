import { ApiError, categories, profiles, type Category, type Component, type Specs, type Profile } from './domain.js';
export function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new ApiError(400, 'Se esperaba un objeto JSON.');
    return value as Record<string, unknown>;
}
export function text(value: unknown, field: string, max = 300): string {
    if (typeof value !== 'string' || !value.trim() || value.length > max)
        throw new ApiError(400, `${field}: texto requerido (máximo ${max}).`);
    return value.trim();
}
export function id(value: unknown): string {
    const v = text(value, 'id', 100);
    if (!/^[a-zA-Z0-9_-]+$/.test(v))
        throw new ApiError(400, 'ID inválido.');
    return v;
}
// Los ID de OpenDB pueden tener hasta 100 caracteres y no comparten el
// formato restringido de los ID internos de usuarios y ensambles.
export function componentId(value: unknown): string {
    return text(value, 'id', 100);
}
export function positive(value: unknown, field: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1e12)
        throw new ApiError(400, `${field} debe ser numérico y mayor que cero.`);
    return value;
}
export function category(value: unknown): Category {
    if (!categories.includes(value as Category))
        throw new ApiError(400, 'Categoría inválida.');
    return value as Category;
}
export function profile(value: unknown): Profile {
    if (!profiles.includes(value as Profile))
        throw new ApiError(400, 'Perfil inválido.');
    return value as Profile;
}
export function ids(value: unknown): string[] {
    if (!Array.isArray(value) || value.length > 8)
        throw new ApiError(400, 'componentIds debe ser un arreglo de hasta ocho IDs.');
    const result = value.map(componentId);
    if (new Set(result).size !== result.length)
        throw new ApiError(400, 'IDs duplicados.');
    return result;
}
export const fields: Record<Category, Record<string, 'text' | 'number' | 'list'>> = {
    cpu: {
        socket: 'text', cores: 'number', threads: 'number', frequencyGHz: 'number', tdp: 'number', generation: 'text'
    }, gpu: {
        vramGB: 'number', memoryType: 'text', watts: 'number', lengthMm: 'number'
    }, motherboard: {
        socket: 'text', chipset: 'text', supportedGenerations: 'list', formFactor: 'text', memoryType: 'text', storageInterfaces: 'list'
    }, ram: {
        memoryType: 'text', capacityGB: 'number', frequencyMHz: 'number', modules: 'number'
    }, storage: {
        type: 'text', capacityGB: 'number', interface: 'text'
    }, psu: {
        watts: 'number', certification: 'text'
    }, case: {
        supportedFormFactors: 'list', maxGpuLengthMm: 'number', maxCoolerHeightMm: 'number'
    }, cooler: {
        type: 'text', sockets: 'list', heightMm: 'number'
    }
};
export function component(value: unknown, componentId: string): Component {
    const v = object(value), c = category(v.category), raw = object(v.specs), specs: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(raw)) {
        const kind = fields[c][key];
        if (!kind)
            throw new ApiError(400, `Especificación ${key} no permitida para ${c}.`);
        if (kind === 'text')
            specs[key] = text(val, key, 80);
        else if (kind === 'number') {
            specs[key] = positive(val, key);
            if (['cores', 'threads', 'modules'].includes(key) && (!Number.isInteger(val) || Number(val) > 2147483647))
                throw new ApiError(400, key + ': entero positivo requerido.');
        }
        else {
            if (!Array.isArray(val) || !val.length || val.length > 30)
                throw new ApiError(400, `${key}: lista no vacía requerida.`);
            specs[key] = val.map(x => text(x, key, 60));
        }
    }
    if (typeof v.active !== 'boolean')
        throw new ApiError(400, 'active debe ser booleano.');
    if (v.priceKind !== 'DEMO' && v.priceKind !== 'ESTIMATED')
        throw new ApiError(400, 'priceKind debe ser DEMO o ESTIMATED.');
    if (v.currency !== 'COP')
        throw new ApiError(400, 'La moneda del catálogo es COP.');
    const date = v.priceReferenceDate == null ? null : text(v.priceReferenceDate, 'priceReferenceDate');
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date))
        throw new ApiError(400, 'Fecha inválida (YYYY-MM-DD).');
    return {
        id: componentId, category: c, name: text(v.name, 'name'), brand: text(v.brand, 'brand'), model: text(v.model, 'model'), description: text(v.description, 'description', 2000), ...(v.image == null ? {} : {
            image: text(v.image, 'image', 2000)
        }), estimatedPrice: v.estimatedPrice === null ? null : money(v.estimatedPrice, 'estimatedPrice'), priceSource: v.priceSource == null ? null : text(v.priceSource, 'priceSource'), priceReferenceDate: date, priceKind: v.priceKind, currency: 'COP', active: v.active, specs: specs as Specs[Category]
    } as Component;
}
export function money(value: unknown, field: string): number {
    const amount = positive(value, field);
    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 0.001)
        throw new ApiError(400, field + ': utiliza un máximo de dos decimales.');
    return amount;
}
