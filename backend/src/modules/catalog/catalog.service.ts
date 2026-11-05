import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors.js';
import { detalleInclude, serializarComponente } from './catalog.types.js';
import type { CatalogQuery } from './catalog.schemas.js';
export async function listarComponentes(query: CatalogQuery) {
 const where: Prisma.ComponenteWhereInput = {
  activo: true,
  ...(query.categoria ? { categoria: query.categoria } : {}), ...(query.marca ? { marca: query.marca } : {}),
  ...(query.q ? { OR: [{nombre:{contains:query.q}},{marca:{contains:query.q}}] } : {}),
  ...(query.precio_min !== undefined || query.precio_max !== undefined ? { precio: { ...(query.precio_min !== undefined ? {gte:new Prisma.Decimal(query.precio_min)}:{}), ...(query.precio_max !== undefined ? {lte:new Prisma.Decimal(query.precio_max)}:{}) } } : {}),
 };
 const [total, items] = await prisma.$transaction([
  prisma.componente.count({ where }),
  prisma.componente.findMany({where, include:detalleInclude, orderBy:{id:'asc'}, skip:(query.page-1)*query.limit, take:query.limit}),
 ], {isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 return {data:items.map(serializarComponente),meta:{page:query.page,limit:query.limit,total,pages:Math.ceil(total/query.limit)}};
}
export async function obtenerComponente(id: string) {
 const item = await prisma.componente.findFirst({where:{id,activo:true},include:detalleInclude});
 if(!item)throw new AppError(404,'COMPONENTE_NO_ENCONTRADO','No existe el componente solicitado.');
 return serializarComponente(item);
}
