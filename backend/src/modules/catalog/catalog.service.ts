import { prisma } from '../../config/database.js';
import { ApiError, type Category } from '../../domain.js';
import { fromRow, includeSpecs } from './catalog.repository.js';

export async function listarComponentes(category?: Category, nombre?: string) {
    const rows = await prisma.component.findMany({
        where: { active: true, ...(category ? { category } : {}), ...(nombre ? { name: { contains: nombre } } : {}) },
        include: includeSpecs,
        orderBy: { name: 'asc' }
    });
    return rows.map(fromRow);
}

export async function obtenerComponente(id: string) {
    const row = await prisma.component.findFirst({ where: { id, active: true }, include: includeSpecs });
    if (!row) throw new ApiError(404, 'Componente no encontrado o inactivo.');
    return fromRow(row);
}
