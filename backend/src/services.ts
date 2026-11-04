import { randomUUID } from 'node:crypto';
import { ApiError, categories, type Component, type Database, type Build, type Category } from './domain.js';
import { compatibility } from './compatibility.js';
import { object, ids, text, money as validateMoney, profile } from './validation.js';
export function select(data: Database, selected: string[]): Component[] {
    const items = selected.map(id => {
        const item = data.components.find(x => x.id === id && x.active);
        if (!item)
            throw new ApiError(404, `Componente activo no encontrado: ${id}`);
        return item;
    });
    if (new Set(items.map(x => x.category)).size !== items.length)
        throw new ApiError(400, 'Selecciona solo un componente por categoría.');
    return items;
}
export function totals(items: Component[], budget: number) {
    const total = items.reduce((sum, x) => sum + Math.round((x.estimatedPrice ?? 0) * 100), 0) / 100;
    return {
        total, warnings: [...(total > budget ? ['El costo estimado supera el presupuesto.'] : []), ...(items.some(x => x.estimatedPrice === null) ? ['Faltan precios: el total es parcial.'] : []), 'Precios de prueba o estimados en COP; no son cotizaciones actuales.']
    };
}
export function makeBuild(value: unknown, data: Database, previous?: Build): Build {
    const v = object(value);
    if (!['automatic', 'manual', 'mixed'].includes(String(v.mode)))
        throw new ApiError(400, 'Modalidad inválida.');
    const selected = ids(v.componentIds), items = select(data, selected), budget = validateMoney(v.budget, 'budget');
    return {
        id: previous?.id ?? randomUUID(), name: text(v.name, 'name', 100), mode: v.mode as Build['mode'], budget, profile: profile(v.profile), componentIds: selected, ...totals(items, budget), compatibility: compatibility(items), ownerId: null, visibility: 'private', createdAt: previous?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString()
    };
}
export function recommend(value: unknown, data: Database) {
    const v = object(value), budget = validateMoney(v.budget, 'budget'), usage = profile(v.profile), preferences = v.preferences === undefined ? {} : object(v.preferences);
    const preferred = preferences.cpuBrand === undefined ? undefined : text(preferences.cpuBrand, 'cpuBrand');
    if (preferred && !['AMD', 'Intel'].includes(preferred))
        throw new ApiError(400, 'cpuBrand debe ser AMD o Intel.');
    const locked = select(data, v.componentIds === undefined ? [] : ids(v.componentIds));
    const pools = new Map<Category, Component[]>();
    for (const c of categories) {
        const fixed = locked.find(x => x.category === c);
        pools.set(c, fixed ? [fixed] : data.components.filter(x => x.active && x.category === c && x.estimatedPrice !== null && (!(c === 'cpu' && preferred) || x.brand === preferred)).sort((a, b) => (a.estimatedPrice ?? 0) - (b.estimatedPrice ?? 0)));
    }
    if (categories.some(c => !pools.get(c)?.length))
        return {
            componentIds: locked.map(x => x.id), ...totals(locked, budget), compatibility: compatibility(locked), withinBudget: false, warnings: ['No hay suficientes componentes activos con precio para completar la recomendación.'], explanations: []
        };
    // Enumerate platform combinations, then fill independently constrained slots at lowest cost.
    let best: Component[] | undefined;
    let bestCost = Infinity;
    for (const cpu of pools.get('cpu')!)
        for (const board of pools.get('motherboard')!)
            for (const ram of pools.get('ram')!)
                for (const box of pools.get('case')!) {
                    const base = [cpu, board, ram, box];
                    if (compatibility(base).status === 'INCOMPATIBLE')
                        continue;
                    const chosen = [...base];
                    let failed = false;
                    for (const c of ['storage', 'gpu', 'cooler', 'psu'] as Category[]) {
                        const next = pools.get(c)!.find(x => compatibility([...chosen, x]).status !== 'INCOMPATIBLE');
                        if (!next) {
                            failed = true;
                            break;
                        }
                        chosen.push(next);
                    }
                    if (failed || compatibility(chosen).status !== 'COMPATIBLE')
                        continue;
                    const cost = totals(chosen, budget).total;
                    if (cost < bestCost) {
                        best = chosen;
                        bestCost = cost;
                    }
                }
    if (!best)
        return {
            componentIds: locked.map(x => x.id), ...totals(locked, budget), compatibility: compatibility(locked), withinBudget: false, warnings: ['No se encontró una combinación verificable que conserve tus componentes y preferencias.'], explanations: []
        };
    // Spend remaining budget on the profile's priority without invalidating deterministic rules.
    let result: Component[] = best;
    const priority: Category[] = usage === 'gaming' ? ['gpu', 'cpu'] : usage === 'diseño' ? ['ram', 'gpu'] : usage === 'trabajo' ? ['cpu', 'ram'] : ['storage', 'ram'];
    for (const c of priority) {
        if (locked.some(x => x.category === c))
            continue;
        for (const candidate of [...pools.get(c)!].reverse()) {
            const next: Component[] = result.map(x => x.category === c ? candidate : x);
            if (totals(next, budget).total <= budget && compatibility(next).status === 'COMPATIBLE') {
                result = next;
                break;
            }
        }
    }
    const money = totals(result, budget);
    return {
        componentIds: result.map(x => x.id), ...money, compatibility: compatibility(result), withinBudget: money.total <= budget, profile: usage, explanations: [`Perfil ${usage}: se prioriza ${priority.join(', ')} dentro del presupuesto.`, preferred ? `Preferencia de CPU: ${preferred}.` : 'Se compararon plataformas disponibles.', `Se conservaron ${locked.length} componentes indicados.`, ...result.map(x => `${x.name}: seleccionado por precio demostrativo y reglas de compatibilidad.`), 'Heurística inicial; el precio no mide el rendimiento y no se garantiza una selección óptima.']
    };
}
