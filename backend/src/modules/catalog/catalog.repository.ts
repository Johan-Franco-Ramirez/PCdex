import { Prisma, type Component as Row } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ApiError, type Component, type Category } from '../../domain.js';
import { component as validateComponent, fields } from '../../validation.js';
export const includeSpecs = {
    cpu: true, gpu: true, motherboard: true, ram: true, storage: true, psu: true, case: true, cooler: true
} as const;
type FullRow = Prisma.ComponentGetPayload<{
    include: typeof includeSpecs;
}>;
const listFields = new Set(['supportedGenerations', 'storageInterfaces', 'supportedFormFactors', 'sockets']);
export function fromRow(row: FullRow): Component {
    const detail = row[row.category as Category];
    const specs: Record<string, unknown> = {};
    if (detail)
        for (const [key, value] of Object.entries(detail))
            if (key !== 'componentId' && value !== null)
                specs[key] = listFields.has(key) ? JSON.parse(String(value)) : value;
    return validateComponent({
        ...row, estimatedPrice: row.estimatedPrice === null ? null : Number(row.estimatedPrice), specs
    }, row.id);
}
export function specInput(component: Component): Record<string, unknown> {
    return Object.fromEntries(Object.keys(fields[component.category]).map(k => {
        const v = (component.specs as Record<string, unknown>)[k];
        return [k, v === undefined ? null : Array.isArray(v) ? JSON.stringify(v) : v];
    }));
}
export function baseInput(item: Component) {
    const { specs: _, category, ...base } = item;
    return {
        ...base, image: item.image ?? null, estimatedPrice: item.estimatedPrice === null ? null : new Prisma.Decimal(item.estimatedPrice.toFixed(2)), categoryRecord: {
            connect: {
                id: category
            }
        }
    };
}
export async function listComponents() {
    return (await prisma.component.findMany({
        include: includeSpecs, orderBy: {
            id: 'asc'
        }
    })).map(fromRow);
}
export async function getComponent(id: string) {
    const row = await prisma.component.findUnique({
        where: {
            id
        }, include: includeSpecs
    });
    if (!row)
        throw new ApiError(404, 'Componente no encontrado.');
    return fromRow(row);
}
export async function createComponent(item: Component) {
    try {
        return fromRow(await prisma.component.create({
            data: {
                ...baseInput(item), [item.category]: {
                    create: specInput(item)
                }
            } as Prisma.ComponentCreateInput, include: includeSpecs
        }));
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            throw new ApiError(409, 'El ID ya existe.');
        throw error;
    }
}
export async function updateComponent(item: Component) {
    return prisma.$transaction(async (tx) => {
        const old = await tx.component.findUnique({
            where: {
                id: item.id
            }
        });
        if (!old)
            throw new ApiError(404, 'Componente no encontrado.');
        if (old.category !== item.category)
            throw new ApiError(400, 'No se puede cambiar la categoría de un componente existente.');
        return fromRow(await tx.component.update({
            where: {
                id: item.id
            }, data: {
                ...baseInput(item), revision: {
                    increment: 1
                }, [item.category]: {
                    upsert: {
                        create: specInput(item), update: specInput(item)
                    }
                }
            } as Prisma.ComponentUpdateInput, include: includeSpecs
        }));
    });
}
export async function deactivateComponent(id: string) {
    await getComponent(id);
    await prisma.component.update({
        where: {
            id
        }, data: {
            active: false, revision: {
                increment: 1
            }
        }
    });
    return {
        id, active: false
    };
}
export function publicPrice(row: Row) {
    return row.estimatedPrice === null ? null : Number(row.estimatedPrice);
}
