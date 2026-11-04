import { Prisma } from '@prisma/client';
import { esCategoria, type Categoria } from '../src/modules/catalog/catalog.types.js';
type RecordData = Record<string, unknown>;
export interface EntradaOpenDB { categoria?: string; data: RecordData }
export interface DatosImportados { base: {id:string;nombre:string;marca:string;categoria:Categoria;precio?:Prisma.Decimal}; tecnico: Prisma.ComponenteCreateInput }
function object(value:unknown):RecordData {return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as RecordData:{};}
const aliases:Record<string,Categoria>={CPU:'CPU',PROCESADOR:'CPU',PROCESADORES:'CPU',GPU:'GPU',TARJETAGRAFICA:'GPU',TARJETASGRAFICAS:'GPU',MOTHERBOARD:'MOTHERBOARD',PLACAMADRE:'MOTHERBOARD',MOTHERBOARDS:'MOTHERBOARD',RAM:'RAM',MEMORIARAM:'RAM',PSU:'PSU',FUENTE:'PSU',FUENTEPODER:'PSU',FUENTESDEPODER:'PSU',STORAGE:'STORAGE',ALMACENAMIENTO:'STORAGE',PCCASE:'CASE',CASE:'CASE',GABINETE:'CASE',GABINETES:'CASE',CPUCOOLER:'COOLER',COOLER:'COOLER',REFRIGERACION:'COOLER'};
function category(value:unknown):Categoria {const key=String(value??'').normalize('NFD').replace(/[\u0300-\u036f\s_-]/g,'').toUpperCase();const result=aliases[key];if(!result||!esCategoria(result))throw Error(`Categoría no admitida: ${String(value)}`);return result;}
function text(value:unknown,label:string,max=120):string {if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw Error(`${label}: falta texto válido de hasta ${max} caracteres.`);return value.trim();}
function integer(value:unknown,label:string):number {if(typeof value!=='number'||!Number.isInteger(value)||value<=0||value>2147483647)throw Error(`${label}: se necesita un entero positivo real de la fuente.`);return value;}
function decimal(value:unknown,label:string,places:number,max:string):Prisma.Decimal {if(typeof value!=='number'&&typeof value!=='string')throw Error(`${label}: número no disponible.`);if(!/^\d+(\.\d+)?$/.test(String(value)))throw Error(`${label}: formato decimal inválido.`);const n=new Prisma.Decimal(value);if(!n.isFinite()||n.lte(0)||n.gt(max)||n.decimalPlaces()>places)throw Error(`${label}: valor fuera de rango o escala.`);return n;}
export function extraerEntradas(raw:unknown):EntradaOpenDB[]{
 if(Array.isArray(raw))return raw.map(value=>{const entry=object(value);const nested=entry.data!==undefined?object(entry.data):entry;return {categoria:typeof (entry.categoria??entry.category)==='string'?String(entry.categoria??entry.category):undefined,data:nested};});
 const root=object(raw);
 if(Array.isArray(root.components))return extraerEntradas(root.components);
 if(Array.isArray(root.data))return extraerEntradas(root.data);
 const entries:EntradaOpenDB[]=[];
 for(const [key,values] of Object.entries(root)){if(!Array.isArray(values))continue;for(const data of values)entries.push({categoria:key,data:object(data)});}
 if(!entries.length)throw Error('Se espera un arreglo de registros con category, {components: [...]}, {data: [...]} o un objeto agrupado por categoría.');
 return entries;
}
export function mapearOpenDB(entry:EntradaOpenDB,prices:Record<string,unknown>={}):DatosImportados{
 const r=entry.data,metadata=object(r.metadata);
 const cat=category(entry.categoria??r.categoria??r.category??r.component_type);
 const id=text(r.opendb_id??r.id,'opendb_id',100);
 const nombre=text(r.nombre??metadata.name??r.name,'nombre',300),marca=text(r.marca??metadata.manufacturer??r.brand,'marca',120);
 const quote=object(prices[id]);
 let precio:Prisma.Decimal|undefined;
 if(quote.precio!==undefined){if(quote.moneda!=='COP')throw Error('La cotización complementaria debe declarar moneda COP.');precio=decimal(quote.precio,'precio',2,'9999999999999999.99');}
 else if(r.precio!==undefined&&r.precio!==null){if(r.moneda!=='COP')throw Error('El precio importado debe declarar moneda COP.');precio=decimal(r.precio,'precio',2,'9999999999999999.99');}
 // OpenDB no entrega precios: no interpretar price en USD como COP ni inventar un cero.
 const base={id,nombre,marca,categoria:cat, ...(precio?{precio}:{})};
 const common:Prisma.ComponenteCreateInput={...base};
 switch(cat){
  case 'CPU':{const spec=object(r.specifications),cores=object(r.cores),normalized=object(r.procesador);common.procesador={create:{socket:text(normalized.socket??r.socket,'socket',60),nucleos:integer(normalized.nucleos??cores.total,'núcleos'),tdp:integer(normalized.tdp??spec.tdp,'TDP CPU')}};break;}
  case 'GPU':{const n=object(r.tarjetaGrafica??r.tarjeta_grafica);common.tarjetaGrafica={create:{vram:decimal(n.vram??r.memory,'VRAM (GB)',2,'99999999.99'),tdp:integer(n.tdp??r.tdp,'TDP GPU')}};break;}
  case 'MOTHERBOARD':{const n=object(r.placaMadre??r.placa_madre),memory=object(r.memory);common.placaMadre={create:{socket:text(n.socket??r.socket,'socket',60),tipo_ram:text(n.tipo_ram??memory.ram_type,'tipo RAM',40),formato:text(n.formato??r.form_factor,'formato',60)}};break;}
  case 'RAM':{const n=object(r.memoriaRAM??r.memoria_ram),modules=object(r.modules);const quantity=modules.quantity,capacity=modules.capacity_gb;
   const total=n.capacidad??r.capacity??(typeof quantity==='number'&&typeof capacity==='number'?quantity*capacity:undefined);
   common.memoriaRAM={create:{tipo:text(n.tipo??r.ram_type,'tipo RAM',40),capacidad:integer(total,'capacidad total RAM (GB)')}};break;}
  case 'PSU':{const n=object(r.fuentePoder??r.fuente_poder);common.fuentePoder={create:{vatios:integer(n.vatios??r.wattage,'vatios PSU'),certificacion:text(n.certificacion??r.efficiency_rating,'certificación',100)}};break;}
  case 'STORAGE':{const n=object(r.almacenamiento);common.almacenamiento={create:{tipo:text(n.tipo??r.storage_type??r.type,'tipo de almacenamiento',60),capacidad:integer(n.capacidad??r.capacity,'capacidad almacenamiento (GB)')}};break;}
  case 'CASE':{const n=object(r.gabinete);common.gabinete={create:{formato:text(n.formato??r.form_factor,'formato de gabinete',60)}};break;}
  case 'COOLER':{const n=object(r.refrigeracion);const tipo=n.tipo??(r.water_cooled===true?'LIQUIDA':r.water_cooled===false?'AIRE':undefined);
   common.refrigeracion={create:{tipo:text(tipo,'tipo de refrigeración',60),tdp_soportado:n.tdp_soportado===undefined||n.tdp_soportado===null?null:integer(n.tdp_soportado,'TDP soportado')}};break;}
 }
 return {base,tecnico:common};
}
