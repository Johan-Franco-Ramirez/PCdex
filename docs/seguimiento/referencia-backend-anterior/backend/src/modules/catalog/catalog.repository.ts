import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ApiError, type Component, type Category } from '../../domain.js';
import { detalleInclude } from './catalog.types.js';

export const includeSpecs = detalleInclude;
type FullRow = Prisma.ComponenteGetPayload<{ include: typeof includeSpecs }>;
const categoryToDb: Record<Category, string> = { cpu:'CPU', gpu:'GPU', motherboard:'MOTHERBOARD', ram:'RAM', storage:'STORAGE', psu:'PSU', case:'CASE', cooler:'COOLER' };
const dbToCategory = Object.fromEntries(Object.entries(categoryToDb).map(([key,value]) => [value,key])) as Record<string, Category>;
const relation: Record<Category,string> = { cpu:'procesador', gpu:'tarjetaGrafica', motherboard:'placaMadre', ram:'memoriaRAM', storage:'almacenamiento', psu:'fuentePoder', case:'gabinete', cooler:'refrigeracion' };

export function fromRow(row: FullRow): Component {
    const category = dbToCategory[row.categoria];
    if (!category) throw new ApiError(500, 'Categoría desconocida en el catálogo.');
    let extra: Record<string, unknown> = {};
    if (row.specsExtra) {
        try { extra = JSON.parse(row.specsExtra) as Record<string, unknown>; }
        catch { throw new ApiError(500, 'Especificaciones adicionales inválidas en el catálogo.'); }
    }
    const specs: Record<string, unknown> = { ...extra };
    switch (category) {
        case 'cpu': if(row.procesador) Object.assign(specs,{socket:row.procesador.socket,cores:row.procesador.nucleos,tdp:row.procesador.tdp}); break;
        case 'gpu': if(row.tarjetaGrafica) Object.assign(specs,{vramGB:Number(row.tarjetaGrafica.vram),watts:row.tarjetaGrafica.tdp}); break;
        case 'motherboard': if(row.placaMadre) Object.assign(specs,{socket:row.placaMadre.socket,memoryType:row.placaMadre.tipo_ram,formFactor:row.placaMadre.formato}); break;
        case 'ram': if(row.memoriaRAM) Object.assign(specs,{memoryType:row.memoriaRAM.tipo,capacityGB:row.memoriaRAM.capacidad}); break;
        case 'storage': if(row.almacenamiento) Object.assign(specs,{type:row.almacenamiento.tipo,capacityGB:row.almacenamiento.capacidad}); break;
        case 'psu': if(row.fuentePoder) Object.assign(specs,{watts:row.fuentePoder.vatios,certification:row.fuentePoder.certificacion}); break;
        case 'case': if(row.gabinete) { const others=Array.isArray(specs.supportedFormFactors) ? specs.supportedFormFactors.filter(x => x !== row.gabinete!.formato) : []; specs.supportedFormFactors=[row.gabinete.formato,...others]; } break;
        case 'cooler': if(row.refrigeracion) specs.type=row.refrigeracion.tipo; break;
    }
    return {id:row.id,name:row.nombre,brand:row.marca,category,model:row.modelo ?? row.nombre,description:row.descripcion ?? row.nombre,...(row.imagen ? {image:row.imagen}:{}),estimatedPrice:row.precio === null ? null : Number(row.precio),priceSource:row.priceSource,priceReferenceDate:row.priceReferenceDate,priceKind:row.priceKind === 'DEMO' ? 'DEMO' : 'ESTIMATED',currency:'COP',active:row.activo,specs} as Component;
}
function requiredText(specs: Record<string,unknown>, key: string): string {
    const value=specs[key]; if(typeof value !== 'string' || !value.trim()) throw new ApiError(400, `La especificación ${key} es obligatoria.`); return value;
}
function requiredInt(specs: Record<string,unknown>, key: string): number {
    const value=specs[key]; if(typeof value !== 'number' || !Number.isSafeInteger(value) || value<=0 || value>2147483647) throw new ApiError(400, `${key} debe ser un entero positivo.`); return value;
}
function detailInput(item: Component): Record<string,unknown> {
    const s=item.specs as Record<string,unknown>;
    switch(item.category) {
        case 'cpu': return {socket:requiredText(s,'socket'),nucleos:requiredInt(s,'cores'),tdp:requiredInt(s,'tdp')};
        case 'gpu': { const n=s.vramGB; if(typeof n!=='number' || !Number.isFinite(n) || n<=0 || n>99999999.99) throw new ApiError(400,'vramGB debe ser un número positivo.'); return {vram:new Prisma.Decimal(n),tdp:requiredInt(s,'watts')}; }
        case 'motherboard': return {socket:requiredText(s,'socket'),tipo_ram:requiredText(s,'memoryType'),formato:requiredText(s,'formFactor')};
        case 'ram': return {tipo:requiredText(s,'memoryType'),capacidad:requiredInt(s,'capacityGB')};
        case 'storage': return {tipo:requiredText(s,'type'),capacidad:requiredInt(s,'capacityGB')};
        case 'psu': return {vatios:requiredInt(s,'watts'),certificacion:requiredText(s,'certification')};
        case 'case': { const formats=s.supportedFormFactors; if(!Array.isArray(formats)||typeof formats[0]!=='string'||!formats[0]) throw new ApiError(400,'supportedFormFactors es obligatorio.'); return {formato:formats[0]}; }
        case 'cooler': return {tipo:requiredText(s,'type')};
    }
}
function baseInput(item: Component) {
    return { nombre:item.name, marca:item.brand, categoria:categoryToDb[item.category], precio:item.estimatedPrice === null ? null : new Prisma.Decimal(item.estimatedPrice.toFixed(2)), modelo:item.model, descripcion:item.description, imagen:item.image ?? null, priceSource:item.priceSource, priceReferenceDate:item.priceReferenceDate, priceKind:item.priceKind, activo:item.active, specsExtra:JSON.stringify(item.specs) };
}
export async function listComponents() { return (await prisma.componente.findMany({include:includeSpecs,orderBy:{id:'asc'}})).map(fromRow); }
export async function getComponent(id:string) {
    const row=await prisma.componente.findUnique({where:{id},include:includeSpecs});
    if(!row) throw new ApiError(404,'Componente no encontrado.'); return fromRow(row);
}
export async function createComponent(item:Component) {
    try { return fromRow(await prisma.componente.create({data:{id:item.id,...baseInput(item),[relation[item.category]]:{create:detailInput(item)}} as Prisma.ComponenteCreateInput,include:includeSpecs})); }
    catch(error) { if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') throw new ApiError(409,'El ID ya existe.'); throw error; }
}
export async function updateComponent(item:Component) {
    return prisma.$transaction(async tx=>{
        const old=await tx.componente.findUnique({where:{id:item.id}});
        if(!old) throw new ApiError(404,'Componente no encontrado.');
        if(old.categoria!==categoryToDb[item.category]) throw new ApiError(400,'No se puede cambiar la categoría de un componente existente.');
        const detail=detailInput(item);
        return fromRow(await tx.componente.update({where:{id:item.id},data:{...baseInput(item),revision:{increment:1},[relation[item.category]]:{upsert:{create:detail,update:detail}}} as Prisma.ComponenteUpdateInput,include:includeSpecs}));
    });
}
export async function deactivateComponent(id:string) {
    await getComponent(id); await prisma.componente.update({where:{id},data:{activo:false,revision:{increment:1}}}); return {id,active:false};
}
export async function buscarComponentes(options:{category?:Category;q?:string;active:boolean;page:number;limit:number}) {
    const where:Prisma.ComponenteWhereInput={activo:options.active,...(options.category?{categoria:categoryToDb[options.category]}:{}),...(options.q?{OR:[{nombre:{contains:options.q}},{marca:{contains:options.q}},{modelo:{contains:options.q}}]}:{})};
    const [total,rows]=await prisma.$transaction([prisma.componente.count({where}),prisma.componente.findMany({where,include:includeSpecs,orderBy:{id:'asc'},skip:(options.page-1)*options.limit,take:options.limit})],{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return {data:rows.map(fromRow),meta:{total,page:options.page,limit:options.limit}};
}
