import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors.js';
import { detalleInclude, type Categoria, type ComponenteDetallado } from '../catalog/catalog.types.js';
import { evaluarComponentes } from '../compatibility/compatibility.rules.js';
const categories=['cpu','gpu','motherboard','ram','storage','psu','case','cooler'] as const;
const canonical:Record<(typeof categories)[number],Categoria>={cpu:'CPU',gpu:'GPU',motherboard:'MOTHERBOARD',ram:'RAM',storage:'STORAGE',psu:'PSU',case:'CASE',cooler:'COOLER'};
const labels={cpu:'Procesadores',gpu:'Tarjetas gráficas',motherboard:'Motherboards',ram:'Memoria RAM',storage:'Almacenamiento',psu:'Fuentes de poder',case:'Gabinetes',cooler:'Refrigeración'};
export function view(item:ComponenteDetallado){
 const category=categories.find(c=>canonical[c]===item.categoria);
 if(!category)throw new AppError(500,'CATEGORIA_INVALIDA','La categoría almacenada no es válida.');
 const specs:Record<string,number|string>={};
 if(item.procesador)Object.assign(specs,{socket:item.procesador.socket,cores:item.procesador.nucleos,tdp:item.procesador.tdp});
 if(item.tarjetaGrafica)Object.assign(specs,{vramGB:item.tarjetaGrafica.vram.toNumber(),watts:item.tarjetaGrafica.tdp});
 if(item.placaMadre)Object.assign(specs,{socket:item.placaMadre.socket,memoryType:item.placaMadre.tipo_ram,formFactor:item.placaMadre.formato});
 if(item.memoriaRAM)Object.assign(specs,{memoryType:item.memoriaRAM.tipo,capacityGB:item.memoriaRAM.capacidad});
 if(item.almacenamiento)Object.assign(specs,{type:item.almacenamiento.tipo,capacityGB:item.almacenamiento.capacidad});
 if(item.fuentePoder)Object.assign(specs,{watts:item.fuentePoder.vatios,certification:item.fuentePoder.certificacion});
 if(item.gabinete)Object.assign(specs,{formFactor:item.gabinete.formato});
 if(item.refrigeracion)Object.assign(specs,{type:item.refrigeracion.tipo,...(item.refrigeracion.tdp_soportado===null?{}:{supportedTdp:item.refrigeracion.tdp_soportado})});
 return {id:item.id,name:item.nombre,brand:item.marca,model:item.nombre,category,description:item.nombre,estimatedPrice:item.precio===null?null:item.precio.toNumber(),priceSource:null,priceReferenceDate:null,priceKind:'ESTIMATED',currency:'COP',active:true,specs};
}
export const querySchema=z.object({category:z.enum(categories).optional(),q:z.string().trim().min(1).max(150).optional(),page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(100).default(50),active:z.enum(['true','false']).optional()}).strict();
export async function list(input:unknown){
 const q=querySchema.parse(input);const where:Prisma.ComponenteWhereInput={...(q.category?{categoria:canonical[q.category]}:{}),...(q.q?{OR:[{nombre:{contains:q.q}},{marca:{contains:q.q}}]}:{})};
 if(q.active==='false')return {success:true,data:[],meta:{total:0,page:q.page,limit:q.limit}};
 const [total,items]=await prisma.$transaction([prisma.componente.count({where}),prisma.componente.findMany({where,include:detalleInclude,orderBy:{id:'asc'},skip:(q.page-1)*q.limit,take:q.limit})]);
 return {success:true,data:items.map(view),meta:{total,page:q.page,limit:q.limit}};
}
export async function detail(id:string){const item=await prisma.componente.findUnique({where:{id:z.string().min(1).max(100).parse(id)},include:detalleInclude});if(!item)throw new AppError(404,'COMPONENTE_NO_ENCONTRADO','Componente no encontrado.');return {success:true,data:view(item)};}
export const categoryView=()=>({success:true,data:categories.map(id=>({id,name:labels[id]}))});
export async function check(body:unknown){
 const input=z.object({componentIds:z.array(z.string().trim().min(1).max(100)).max(64),budget:z.number().finite().nonnegative().max(1e12)}).strict().parse(body);
 if(new Set(input.componentIds).size!==input.componentIds.length)throw new AppError(400,'IDS_DUPLICADOS','Los IDs no deben repetirse.');
 const items=await prisma.componente.findMany({where:{id:{in:input.componentIds}},include:detalleInclude});
 if(items.length!==input.componentIds.length)throw new AppError(404,'COMPONENTE_NO_ENCONTRADO','Hay componentes inexistentes.');
 const result=evaluarComponentes(items,input.componentIds);const missing=result.errores.filter(e=>e.startsWith('Falta un componente'));const conflicts=result.errores.filter(e=>!e.startsWith('Falta un componente'));
 const checks=[...conflicts.map(message=>({rule:'Validación técnica',status:'INCOMPATIBLE',componentIds:input.componentIds,message})),...missing.map(message=>({rule:'Selección completa',status:'UNVERIFIED',componentIds:input.componentIds,message})),...result.advertencias.map(message=>({rule:'Información adicional',status:'UNVERIFIED',componentIds:input.componentIds,message}))];
 const status=conflicts.length?'INCOMPATIBLE':missing.length||result.advertencias.length?'UNVERIFIED':'COMPATIBLE';
 const total=items.reduce((sum,i)=>sum.add(i.precio??0),new Prisma.Decimal(0));const warnings=[...(items.some(i=>i.precio===null)?['Faltan precios: el total es parcial.']:[]),...(total.gt(input.budget)?['El costo supera el presupuesto.']:[])];
 return {success:true,data:{compatibility:{status,checks,scope:'Reglas limitadas a datos técnicos disponibles; no verifica BIOS, dimensiones ni conectores.'},total:total.toNumber(),warnings}};
}
