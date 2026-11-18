import { prisma } from '../../config/database.js';
import { ApiError, type Component } from '../../domain.js';
import { compatibility } from '../../compatibility.js';
import { ids } from '../../validation.js';
import { fromRow, includeSpecs } from '../catalog/catalog.repository.js';

export interface ResultadoValidacion {
    compatible: boolean;
    errores: string[];
    advertencias: string[];
}

// Evalúa los datos ya consultados; no modifica ni consulta la base de datos.
export function evaluarBuild(componentes: Component[]): ResultadoValidacion {
    const errores: string[] = [];
    const advertencias: string[] = [];
    if (new Set(componentes.map(c => c.category)).size !== componentes.length)
        errores.push('Solo se admite un componente por categoría.');
    const checks = compatibility(componentes);
    // El cálculo anterior usa otro margen. Para esta API se aplica la fórmula solicitada.
    for (const check of checks.checks.filter(c => c.rule !== 'Margen de potencia')) {
        if (check.status === 'INCOMPATIBLE') errores.push(check.message);
        if (check.status === 'UNVERIFIED') advertencias.push(check.message);
    }
    const cpu = componentes.find(c => c.category === 'cpu');
    const gpu = componentes.find(c => c.category === 'gpu');
    const psu = componentes.find(c => c.category === 'psu');
    const tdp = cpu?.specs.tdp, wattsGpu = gpu?.specs.watts, wattsPsu = psu?.specs.watts;
    if (tdp === undefined || wattsGpu === undefined || wattsPsu === undefined)
        advertencias.push('Faltan CPU, GPU o fuente, o sus datos de potencia para verificar el consumo.');
    else if (tdp + wattsGpu + 100 > wattsPsu * 0.8)
        errores.push('La potencia estimada supera el 80 % de la fuente.');
    // Una advertencia de reglas sin datos impide declarar compatibilidad comprobada.
    const compatible = errores.length === 0 && advertencias.length === 0;
    advertencias.push('La estimación no verifica BIOS, conectores ni todas las dimensiones; consulta a los fabricantes.');
    return { compatible, errores, advertencias };
}

export async function validarBuild(componenteIds: string[]): Promise<ResultadoValidacion> {
    const identificadores = ids(componenteIds);
    if (!identificadores.length) throw new ApiError(400, 'Se requiere al menos un ID de componente.');
    const rows = await prisma.component.findMany({ where: { id: { in: identificadores } }, include: includeSpecs });
    const disponibles = rows.filter(row => row.active);
    const faltantes = identificadores.filter(id => !disponibles.some(row => row.id === id));
    if (faltantes.length) throw new ApiError(400, `Componentes inexistentes o inactivos: ${faltantes.join(', ')}.`);
    return evaluarBuild(disponibles.map(fromRow));
}
