import { prisma } from '../../config/prisma.js';
import { detalleInclude } from '../catalog/catalog.types.js';
import { evaluarComponentes } from './compatibility.rules.js';
import { idsSchema } from './compatibility.schemas.js';
export async function validarBuild(componentes: string[]) {
 const ids=idsSchema.parse(componentes);
 const items=await prisma.componente.findMany({where:{activo:true,id:{in:[...new Set(ids)]}},include:detalleInclude});
 return evaluarComponentes(items,ids);
}
