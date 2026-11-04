import { Prisma } from '@prisma/client';
import { setImmediate } from 'node:timers/promises';
import { AppError } from '../../shared/errors.js';
import { CATEGORIAS, type Categoria, type ComponenteDetallado } from '../catalog/catalog.types.js';
import { evaluarComponentes, normalizar } from '../compatibility/compatibility.rules.js';
import type { GenerarBody } from './builds.schemas.js';
const orden:Categoria[]=['CPU','MOTHERBOARD','RAM','GPU','PSU','COOLER','STORAGE','CASE'];
export interface LimitesBusqueda { maxNodos:number; timeoutMs:number }
/** Búsqueda exacta con poda por presupuesto y reglas; nunca devuelve una solución no validada. */
export async function seleccionarBuild(items:ComponenteDetallado[], request:GenerarBody, limits:LimitesBusqueda){
 const presupuesto=new Prisma.Decimal(request.presupuesto.toString());
 const buckets=orden.map(category=>items.filter(i=>i.categoria===category&&i.precio!==null&&i.precio.gt(0)).sort((a,b)=>a.precio!.cmp(b.precio!)||a.id.localeCompare(b.id)));
 const missing=orden.filter((_,index)=>!buckets[index]?.length);
 if(missing.length)throw new AppError(422,'CATALOGO_INSUFICIENTE','Faltan componentes con precio para completar la build.',{categorias:missing});
 const minimum:Prisma.Decimal[]=Array.from({length:orden.length+1},()=>new Prisma.Decimal(0));
 for(let i=orden.length-1;i>=0;i--)minimum[i]=minimum[i+1]!.add(buckets[i]![0]!.precio!);
 if(minimum[0]!.gt(presupuesto))throw new AppError(422,'PRESUPUESTO_INSUFICIENTE','Ni la suma mínima por categoría entra en el presupuesto.');
 let best:ComponenteDetallado[]|undefined,bestTotal=new Prisma.Decimal(0),bestScore:number[]=[];
 let nodos=0;const deadline=Date.now()+limits.timeoutMs;
 const score=(selected:ComponenteDetallado[])=>{const cpu=selected.find(i=>i.categoria==='CPU')!.procesador!,gpu=selected.find(i=>i.categoria==='GPU')!.tarjetaGrafica!,ram=selected.find(i=>i.categoria==='RAM')!.memoriaRAM!;return request.uso==='gaming'?[gpu.vram.toNumber(),cpu.nucleos,ram.capacidad]:request.uso==='trabajo'?[cpu.nucleos,ram.capacidad,gpu.vram.toNumber()]:[];};
 const better=(next:number[],total:Prisma.Decimal)=>{if(!best)return true;for(let i=0;i<next.length;i++){if(next[i]!==bestScore[i])return next[i]!>bestScore[i]!;}return total.lt(bestTotal);};
 async function visit(index:number,selected:ComponenteDetallado[],total:Prisma.Decimal):Promise<void>{
  if(++nodos>limits.maxNodos||Date.now()>deadline)throw new AppError(503,'BUSQUEDA_LIMITADA','La búsqueda superó el límite de trabajo; no se afirma que no existan combinaciones. Reduce el catálogo o ajusta los límites del servidor.');
  if(nodos%512===0)await setImmediate();
  if(total.add(minimum[index]!).gt(presupuesto))return;
  if(index===orden.length){
   const result=evaluarComponentes(selected,selected.map(i=>i.id));if(!result.compatible)return;
   const nextScore=score(selected);if(better(nextScore,total)){best=[...selected];bestTotal=total;bestScore=nextScore;}return;
  }
  for(const candidate of buckets[index]!){
   if(Date.now()>deadline)throw new AppError(503,'BUSQUEDA_LIMITADA','La búsqueda superó su tiempo máximo; no se afirma ausencia de combinaciones.');
   const sum=total.add(candidate.precio!);if(sum.add(minimum[index+1]!).gt(presupuesto))break;
   const cpu=selected.find(i=>i.categoria==='CPU')?.procesador,mb=selected.find(i=>i.categoria==='MOTHERBOARD')?.placaMadre,gpu=selected.find(i=>i.categoria==='GPU')?.tarjetaGrafica;
   if(candidate.placaMadre&&cpu&&normalizar(candidate.placaMadre.socket)!==normalizar(cpu.socket))continue;
   if(candidate.memoriaRAM&&mb&&normalizar(candidate.memoriaRAM.tipo)!==normalizar(mb.tipo_ram))continue;
   if(candidate.fuentePoder&&cpu&&gpu&&(cpu.tdp+gpu.tdp+100)*5>candidate.fuentePoder.vatios*4)continue;
   if(candidate.refrigeracion?.tdp_soportado!==null&&candidate.refrigeracion&&cpu&&candidate.refrigeracion.tdp_soportado<cpu.tdp)continue;
   await visit(index+1,[...selected,candidate],sum);
  }
 }
 await visit(0,[],new Prisma.Decimal(0));
 if(!best)throw new AppError(422,'SIN_COMBINACION_COMPATIBLE','No hay una build completa compatible dentro del presupuesto en el catálogo consultado.');
 const compatibilidad=evaluarComponentes(best,best.map(i=>i.id));
 return {componentes:best,total:bestTotal,compatibilidad,nodos,categorias:CATEGORIAS};
}
