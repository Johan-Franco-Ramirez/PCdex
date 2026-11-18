import { prisma } from '../../config/database.js';
import { ApiError, categories, type Category, type Component } from '../../domain.js';
import { money, profile } from '../../validation.js';
import { includeSpecs, fromRow } from '../catalog/catalog.repository.js';
import { evaluarBuild } from '../compatibility/compatibility.service.js';

// El límite evita que una búsqueda combinatoria bloquee indefinidamente la API.
const MAX_CANDIDATOS = 10000;
const MAX_INTENTOS = 100000;

export async function generarBuild(presupuesto: number, uso: string) {
    const presupuestoValido = money(presupuesto, 'presupuesto');
    const perfil = profile(uso);
    const limite = Math.round(presupuestoValido * 100);
    const rows = await prisma.component.findMany({
        where: { active: true, estimatedPrice: { not: null, lte: presupuestoValido } },
        include: includeSpecs,
        orderBy: [{ category: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        take: MAX_CANDIDATOS + 1
    });
    if (rows.length > MAX_CANDIDATOS)
        throw new ApiError(503, 'Hay demasiados candidatos para completar la búsqueda; reduce el presupuesto o pagina el catálogo.');
    const items = rows.map(fromRow).filter(item => item.estimatedPrice !== null);
    const orden: Category[] = ['cpu', 'motherboard', 'ram', 'gpu', 'psu', 'case', 'storage', 'cooler'];
    const prioridad: Category[] = perfil === 'gaming' ? ['gpu', 'cpu'] : perfil === 'diseño' ? ['ram', 'gpu'] : perfil === 'trabajo' ? ['cpu', 'ram'] : ['storage', 'ram'];
    const pools = new Map(orden.map(c => [c, items.filter(x => x.category === c).sort((a, b) => {
        const diferencia = Math.round(a.estimatedPrice! * 100) - Math.round(b.estimatedPrice! * 100);
        return (prioridad.includes(c) ? -diferencia : diferencia) || a.id.localeCompare(b.id);
    })]));
    if (categories.some(c => !pools.get(c)?.length))
        throw new ApiError(422, 'No hay componentes activos con precio dentro del presupuesto para todas las categorías.');
    const minimos = orden.map(c => Math.min(...pools.get(c)!.map(x => Math.round(x.estimatedPrice! * 100))));
    if (minimos.reduce((a, b) => a + b, 0) > limite)
        throw new ApiError(422, 'El presupuesto es insuficiente para cubrir el precio mínimo de todas las categorías.');
    const restantes = Array(orden.length + 1).fill(0) as number[];
    for (let i = orden.length - 1; i >= 0; i--) restantes[i] = restantes[i + 1] + minimos[i];
    let intentos = 0;
    let agotado = false;
    const buscar = (indice: number, elegidos: Component[], costo: number): Component[] | undefined => {
        if (indice === orden.length) return evaluarBuild(elegidos).compatible ? elegidos : undefined;
        for (const candidato of pools.get(orden[indice])!) {
            if (++intentos > MAX_INTENTOS) { agotado = true; return undefined; }
            const nuevoCosto = costo + Math.round(candidato.estimatedPrice! * 100);
            if (nuevoCosto + restantes[indice + 1] > limite) continue;
            const seleccion = [...elegidos, candidato];
            // Las reglas con datos incompletos permanecen pendientes hasta el final.
            if (evaluarBuild(seleccion).errores.length) continue;
            const resultado = buscar(indice + 1, seleccion, nuevoCosto);
            if (resultado || agotado) return resultado;
        }
        return undefined;
    };
    const componentes = buscar(0, [], 0);
    if (agotado) throw new ApiError(503, 'La búsqueda alcanzó su límite; no se puede concluir si existe una combinación compatible.');
    if (!componentes) throw new ApiError(422, 'No se encontró una combinación completa verificable dentro del presupuesto con los datos disponibles.');
    const resultado = evaluarBuild(componentes);
    return {
        perfil, presupuesto: presupuestoValido,
        total: componentes.reduce((suma, c) => suma + Math.round(c.estimatedPrice! * 100), 0) / 100,
        moneda: 'COP', componente_ids: componentes.map(c => c.id), componentes,
        compatibilidad: resultado,
        advertencias: ['La selección es una heurística por precio; un precio mayor no garantiza mayor rendimiento. Los precios son estimaciones del catálogo.']
    };
}
