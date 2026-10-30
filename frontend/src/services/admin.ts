import { categories } from '../data/categories'
import type { CatalogComponent } from '../types/hardware'
export function parseImport(text:string):CatalogComponent[] {
 const data:unknown=JSON.parse(text)
 if(!Array.isArray(data)||!data.length||data.length>100)throw Error('Importa un arreglo de entre 1 y 100 componentes.')
 const ids=new Set<string>()
 return data.map((item:unknown)=>{
 if(!item||typeof item!=='object')throw Error('Cada componente debe ser un objeto.')
 const i=item as Record<string,unknown>
 if(typeof i.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(i.id)||ids.has(i.id))throw Error('Los IDs deben ser únicos y usar letras, números, guiones o guiones bajos.')
 ids.add(i.id)
 if(!['name','brand','summary','badge'].every(k=>typeof i[k]==='string'&&String(i[k]).trim()&&String(i[k]).length<=300)||!categories.includes(i.category as CatalogComponent['category'])||typeof i.price!=='number'||!Number.isFinite(i.price)||i.price<=0)throw Error('Revisa nombre, marca, categoría, resumen, badge y precio positivo.')
 if(!Array.isArray(i.specs)||!i.specs.every(row=>Array.isArray(row)&&row.length===2&&row.every(cell=>typeof cell==='string')))throw Error('specs debe contener pares de textos.')
 for(const k of ['generation','socket','memory','formFactor'])if(i[k]!==undefined&&typeof i[k]!=='string')throw Error(`${k} debe ser texto.`)
 for(const k of ['watts','capacity'])if(i[k]!==undefined&&(typeof i[k]!=='number'||!Number.isFinite(i[k])||Number(i[k])<0))throw Error(`${k} debe ser un número positivo.`)
 return {id:i.id,name:String(i.name).trim(),brand:String(i.brand).trim(),category:i.category as CatalogComponent['category'],price:i.price,summary:String(i.summary),badge:String(i.badge),specs:i.specs as [string,string][],generation:i.generation as string|undefined,socket:i.socket as string|undefined,memory:i.memory as string|undefined,formFactor:i.formFactor as string|undefined,watts:i.watts as number|undefined,capacity:i.capacity as number|undefined}
 })
}
