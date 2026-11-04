import { Prisma } from '@prisma/client';
import type { Categoria, ComponenteDetallado } from '../src/modules/catalog/catalog.types.js';
/** Fixtures exclusivamente de pruebas. Nunca se insertan ni se sirven como catálogo. */
export function fixture(category:Categoria, id:string=category, price='10.00'):ComponenteDetallado{
 const base:ComponenteDetallado={id,nombre:id,marca:'TEST',categoria:category,precio:new Prisma.Decimal(price),procesador:null,tarjetaGrafica:null,placaMadre:null,memoriaRAM:null,fuentePoder:null,almacenamiento:null,gabinete:null,refrigeracion:null};
 switch(category){
 case 'CPU':base.procesador={componente_id:id,socket:'AM5',nucleos:8,tdp:100};break;
 case 'GPU':base.tarjetaGrafica={componente_id:id,vram:new Prisma.Decimal(8),tdp:200};break;
 case 'MOTHERBOARD':base.placaMadre={componente_id:id,socket:'AM5',tipo_ram:'DDR5',formato:'ATX'};break;
 case 'RAM':base.memoriaRAM={componente_id:id,tipo:'DDR5',capacidad:32};break;
 case 'PSU':base.fuentePoder={componente_id:id,vatios:500,certificacion:'TEST'};break;
 case 'STORAGE':base.almacenamiento={componente_id:id,tipo:'NVMe',capacidad:1000};break;
 case 'CASE':base.gabinete={componente_id:id,formato:'ATX'};break;
 case 'COOLER':base.refrigeracion={componente_id:id,tipo:'AIRE',tdp_soportado:150};break;
 }
 return base;
}
export function fullBuild(){return (['CPU','GPU','MOTHERBOARD','RAM','PSU','STORAGE','CASE','COOLER'] as const).map(c=>fixture(c));}
