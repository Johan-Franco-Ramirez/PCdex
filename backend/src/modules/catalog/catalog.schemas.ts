import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { CATEGORIAS } from './catalog.types.js';
const money = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Usa un importe decimal positivo sin separadores de miles.').refine(v => new Prisma.Decimal(v).lte('9999999999999999.99'), 'Importe fuera de rango.');
export const catalogQuerySchema = z.object({
 categoria: z.enum(CATEGORIAS).optional(), marca: z.string().trim().min(1).max(120).optional(),
 q: z.string().trim().min(1).max(200).optional(), precio_min: money.optional(), precio_max: money.optional(),
 page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100000)).default(1),
 limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
}).strict().refine(v => !v.precio_min || !v.precio_max || new Prisma.Decimal(v.precio_min).lte(new Prisma.Decimal(v.precio_max)), {message: 'precio_min no puede superar precio_max.', path:['precio_min']});
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export const idSchema = z.string().trim().min(1).max(100);
