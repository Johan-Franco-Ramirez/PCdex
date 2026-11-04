import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ApiError, type Component, type Compatibility } from '../../domain.js';
import { object, ids, text, money, profile } from '../../validation.js';
import { compatibility } from '../../compatibility.js';
import { totals } from '../../services.js';
import { includeSpecs, fromRow } from '../catalog/catalog.repository.js';
const includeItems = {
    items: {
        include: {
            component: {
                include: includeSpecs
            }
        }
    }
} as const;
type Row = Prisma.PcBuildGetPayload<{
    include: typeof includeItems;
}>;
export function buildView(row: Row) {
    const snapshots = row.items.map(x => JSON.parse(x.componentSnapshot) as Component);
    const changes = row.items.flatMap(item => {
        const old = JSON.parse(item.componentSnapshot) as Component, current = fromRow(item.component);
        return [...(!current.active ? [`${current.name}: componente desactivado; puedes conservarlo en este borrador o sustituirlo.`] : []), ...(JSON.stringify({
                ...old, active: true
            }) !== JSON.stringify({
                ...current, active: true
            }) ? [`${current.name}: su precio o ficha han cambiado desde el último guardado.`] : [])];
    });
    return {
        id: row.id, ownerId: row.ownerId, name: row.name, mode: row.mode, budget: Number(row.budget), profile: row.profile, total: Number(row.total), visibility: row.visibility, componentIds: row.items.map(x => x.componentId), components: snapshots, priceSnapshots: row.items.map(x => ({
            componentId: x.componentId, estimatedPrice: x.priceSnapshot === null ? null : Number(x.priceSnapshot)
        })), compatibility: JSON.parse(row.compatibility) as Compatibility, warnings: JSON.parse(row.warnings) as string[], changes, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), draft: (JSON.parse(row.compatibility) as Compatibility).status !== 'COMPATIBLE'
    };
}
export async function listBuilds(ownerId: string) {
    return (await prisma.pcBuild.findMany({
        where: {
            ownerId
        }, include: includeItems, orderBy: {
            updatedAt: 'desc'
        }
    })).map(buildView);
}
export async function getBuild(id: string, ownerId: string) {
    const row = await prisma.pcBuild.findFirst({
        where: {
            id, ownerId
        }, include: includeItems
    });
    if (!row)
        throw new ApiError(404, 'Configuración no encontrada.');
    return buildView(row);
}
export async function saveBuild(value: unknown, ownerId: string, id?: string, importId?: string) {
    const v = object(value);
    if ('ownerId' in v || 'owner' in v || 'visibility' in v)
        throw new ApiError(400, 'El propietario y la privacidad los determina el servidor.');
    const componentIds = ids(v.componentIds), budget = money(v.budget, 'budget'), usage = profile(v.profile), name = text(v.name, 'name', 100);
    if (!['manual', 'automatic', 'mixed'].includes(String(v.mode)))
        throw new ApiError(400, 'Modalidad inválida.');
    return prisma.$transaction(async (tx) => {
        const previous = id ? await tx.pcBuild.findFirst({
            where: {
                id, ownerId
            }, include: {
                items: true
            }
        }) : null;
        if (id && !previous)
            throw new ApiError(404, 'Configuración no encontrada.');
        const rows = await tx.component.findMany({
            where: {
                id: {
                    in: componentIds
                }
            }, include: includeSpecs
        });
        const items = componentIds.map(componentId => {
            const row = rows.find(x => x.id === componentId);
            if (!row || (!row.active && !importId && !previous?.items.some(x => x.componentId === componentId)))
                throw new ApiError(400, `Componente no disponible: ${componentId}`);
            return fromRow(row);
        });
        if (new Set(items.map(x => x.category)).size !== items.length)
            throw new ApiError(400, 'Solo se admite una pieza por categoría.');
        const money = totals(items, budget), checks = compatibility(items);
        if (items.some(x => !x.active))
            checks.checks.push({
                rule: 'Disponibilidad', status: 'UNVERIFIED', componentIds: items.filter(x => !x.active).map(x => x.id), message: 'El borrador conserva piezas desactivadas. Sustitúyelas para una selección actual.'
            });
        if (items.some(x => !x.active) && checks.status === 'COMPATIBLE')
            checks.status = 'UNVERIFIED';
        const data = {
            name, mode: String(v.mode), budget: new Prisma.Decimal(budget.toFixed(2)), profile: usage, total: new Prisma.Decimal(money.total.toFixed(2)), compatibility: JSON.stringify(checks), warnings: JSON.stringify(money.warnings)
        };
        const detail = items.map(x => ({
            componentId: x.id, category: x.category, priceSnapshot: x.estimatedPrice === null ? null : new Prisma.Decimal(x.estimatedPrice.toFixed(2)), componentSnapshot: JSON.stringify(x)
        }));
        if (previous) {
            await tx.buildItem.deleteMany({
                where: {
                    buildId: previous.id
                }
            });
            return buildView(await tx.pcBuild.update({
                where: {
                    id: previous.id
                }, data: {
                    ...data, items: {
                        create: detail
                    }
                }, include: includeItems
            }));
        }
        return buildView(await tx.pcBuild.create({
            data: {
                ...data, id: importId, ownerId, items: {
                    create: detail
                }
            }, include: includeItems
        }));
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 20000
    });
}
export async function deleteBuild(id: string, ownerId: string) {
    const result = await prisma.pcBuild.deleteMany({
        where: {
            id, ownerId
        }
    });
    if (!result.count)
        throw new ApiError(404, 'Configuración no encontrada.');
    return {
        id, deleted: true
    };
}
