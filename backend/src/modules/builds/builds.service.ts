import { Prisma } from '@prisma/client';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors.js';
import { CATEGORIAS, detalleInclude, serializarComponente } from '../catalog/catalog.types.js';
import { seleccionarBuild } from './builds.algorithm.js';
import type { GenerarBody } from './builds.schemas.js';
export async function generarBuild(body:GenerarBody){
 const items=await prisma.$transaction(tx=>tx.componente.findMany({
  where:{categoria:{in:[...CATEGORIAS]},precio:{gt:0,lte:new Prisma.Decimal(body.presupuesto.toString())}},
  include:detalleInclude,orderBy:[{categoria:'asc'},{precio:'asc'},{id:'asc'}],take:10001,
 }),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:10000});
 if(items.length>10000)throw new AppError(503,'CATALOGO_DEMASIADO_GRANDE','La búsqueda exacta admite hasta 10000 candidatos por consulta; no se truncó el resultado.');
 const result=await seleccionarBuild(items,body,{maxNodos:env.GENERATION_MAX_NODES,timeoutMs:env.GENERATION_TIMEOUT_MS});
 return {data:{componente_ids:result.componentes.map(i=>i.id),componentes:result.componentes.map(serializarComponente),
  presupuesto:new Prisma.Decimal(body.presupuesto.toString()).toFixed(2),total:result.total.toFixed(2),restante:new Prisma.Decimal(body.presupuesto.toString()).sub(result.total).toFixed(2),moneda:'COP',uso:body.uso,
  ...result.compatibilidad},meta:{nodos_evaluados:result.nodos,criterio:body.uso==='gaming'?'VRAM, núcleos, RAM; empate por menor coste':body.uso==='trabajo'?'Núcleos, RAM, VRAM; empate por menor coste':'Menor coste compatible',nota:'Criterios de especificaciones, no benchmarks. Cotización y disponibilidad corresponden al instante de consulta; validar de nuevo antes de comprar.'}};
}
