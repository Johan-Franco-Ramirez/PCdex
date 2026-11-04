import 'dotenv/config';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/config/prisma.js';
import { extraerEntradas, mapearOpenDB } from './buildcores.mapper.js';

async function readJson(file:string):Promise<unknown>{const info=await stat(file);if(info.size>100*1024*1024)throw Error('El archivo supera 100 MB. Divídelo en lotes.');return JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,'')) as unknown;}
function asPrices(value:unknown):Record<string,unknown>{if(value===null||typeof value!=='object'||Array.isArray(value))throw Error('precios-cop.json debe ser un objeto por opendb_id.');return value as Record<string,unknown>;}
async function main(){
 const file=resolve(process.env.BUILDCORES_FILE??'data/buildcores.json');
 const raw=await readJson(file);
 let prices:Record<string,unknown>={};
 if(process.env.PRICES_FILE){try{prices=asPrices(await readJson(resolve(process.env.PRICES_FILE)));}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;console.warn('No hay archivo complementario de cotizaciones. Se preservarán precios existentes; nuevas piezas quedarán sin precio.');}}
 const entries=extraerEntradas(raw);if(!entries.length)throw Error('El archivo no contiene componentes.');
 const imported:ReturnType<typeof mapearOpenDB>[]=[],rejected:{indice:number;motivo:string}[]=[];
 const ids=new Set<string>();
 entries.forEach((entry,index)=>{try{const mapped=mapearOpenDB(entry,prices);const key=mapped.base.id.toLowerCase();if(ids.has(key))throw Error('ID duplicado en el archivo.');ids.add(key);imported.push(mapped);}catch(error){rejected.push({indice:index,motivo:error instanceof Error?error.message:'Registro inválido'});}});
 // Rechazar el lote completo antes de escribir evita importaciones parciales silenciosas.
 if(rejected.length){console.error(JSON.stringify({importados:0,rechazados:rejected},null,2));throw Error('Corrige los registros rechazados o separa las categorías no soportadas antes de importar.');}
 if(process.argv.includes('--dry-run')){console.log(JSON.stringify({validos:imported.length,sin_precio:imported.filter(i=>!i.base.precio).length,escrituras:0}));return;}
 const batchSize=100;let committed=0;
 for(let start=0;start<imported.length;start+=batchSize){
  const batch=imported.slice(start,start+batchSize);
  try{await prisma.$transaction(async tx=>{
   for(const {base,tecnico} of batch){
    const existing=await tx.componente.findUnique({where:{id:base.id},select:{categoria:true}});
    if(existing&&existing.categoria!==base.categoria)throw Error(`La categoría de ${base.id} ya existe y no se puede cambiar con el seed.`);
    const update:Prisma.ComponenteUpdateInput={nombre:base.nombre,marca:base.marca,...(base.precio?{precio:base.precio}:{})};
    if(tecnico.procesador?.create)update.procesador={upsert:{create:tecnico.procesador.create,update:tecnico.procesador.create}};
    if(tecnico.tarjetaGrafica?.create)update.tarjetaGrafica={upsert:{create:tecnico.tarjetaGrafica.create,update:tecnico.tarjetaGrafica.create}};
    if(tecnico.placaMadre?.create)update.placaMadre={upsert:{create:tecnico.placaMadre.create,update:tecnico.placaMadre.create}};
    if(tecnico.memoriaRAM?.create)update.memoriaRAM={upsert:{create:tecnico.memoriaRAM.create,update:tecnico.memoriaRAM.create}};
    if(tecnico.fuentePoder?.create)update.fuentePoder={upsert:{create:tecnico.fuentePoder.create,update:tecnico.fuentePoder.create}};
    if(tecnico.almacenamiento?.create)update.almacenamiento={upsert:{create:tecnico.almacenamiento.create,update:tecnico.almacenamiento.create}};
    if(tecnico.gabinete?.create)update.gabinete={upsert:{create:tecnico.gabinete.create,update:tecnico.gabinete.create}};
    if(tecnico.refrigeracion?.create)update.refrigeracion={upsert:{create:tecnico.refrigeracion.create,update:tecnico.refrigeracion.create}};
    await tx.componente.upsert({where:{id:base.id},create:tecnico,update});
   }
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60000});committed+=batch.length;
  }catch(error){console.error(JSON.stringify({confirmados:committed,lote_fallido_desde:start,nota:'Los lotes anteriores permanecen; el lote fallido se revierte. El seed es idempotente y puede reanudarse.'}));throw error;}
 }
 console.log(JSON.stringify({importados:committed,sin_cotizacion_nueva:imported.filter(i=>!i.base.precio).length}));
}
/**
 * Punto de integración FUTURO: actualizarPreciosDesdeMercadoLibre().
 * Implementar con una fuente/API autorizada y correspondencia por opendb_id/MPN,
 * moneda COP, fecha y disponibilidad; actualizar Componente.precio con Prisma.
 * No se ejecuta scraping ni se inventan precios durante este seed.
 */
main().catch(error=>{console.error(error instanceof Error?error.message:'Error de importación');process.exitCode=1;}).finally(async()=>{await prisma.$disconnect();});
