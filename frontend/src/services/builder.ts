import type { Build, CatalogComponent } from '../types/hardware'
export interface Diagnostic { label: string; status: 'pass' | 'error' | 'warning'; message: string }
export function diagnose(selection: Build['selection'], items: CatalogComponent[]): Diagnostic[] {
 const get = (category: CatalogComponent['category']) => items.find(i => i.id === selection[category])
 const cpu=get('Procesadores'), board=get('Motherboards'), ram=get('Memoria RAM'), psu=get('Fuentes de poder'), cooler=get('Refrigeración'), chassis=get('Gabinetes')
 const checks: Diagnostic[]=[]
 if(board && chassis) checks.push({label:'Formato de motherboard / gabinete',status:!board.formFactor || !chassis.formFactor?'warning':board.formFactor===chassis.formFactor?'pass':'error',message:`${board.formFactor ?? 'Sin datos'} / ${chassis.formFactor ?? 'Sin datos'}`})
 if(Object.values(selection).filter(Boolean).length<8) checks.push({label:'Configuración incompleta',status:'warning',message:'Selecciona las ocho categorías para evaluar una configuración completa.'})
 if(cpu && board) checks.push({label:'Socket CPU / motherboard',status:!cpu.socket || !board.socket ? 'warning' : cpu.socket===board.socket ? 'pass':'error',message:!cpu.socket || !board.socket ? 'Faltan datos de socket.' : `${cpu.socket} / ${board.socket}`})
 if(board && ram) checks.push({label:'Memoria RAM',status:!board.memory || !ram.memory ? 'warning':board.memory===ram.memory?'pass':'error',message:`${board.memory ?? 'Sin datos'} / ${ram.memory ?? 'Sin datos'}`})
 if(cpu && cooler) checks.push({label:'Anclaje del cooler',status:!cpu.socket || !cooler.socket?'warning':cooler.socket.split(',').includes(cpu.socket)?'pass':'error',message:`CPU ${cpu.socket ?? '?'} · Cooler ${cooler.socket ?? '?'}`})
 const selected=items.filter(i=>Object.values(selection).includes(i.id))
 const estimated=Math.ceil((selected.reduce((sum,i)=>sum+(i.watts??0),0)+80)*1.25)
 if(psu) checks.push({label:'Margen de fuente',status:!psu.capacity?'warning':psu.capacity>=estimated?'pass':'error',message:`Estimación ${estimated} W / fuente ${psu.capacity ?? '?'} W`})
 checks.push({label:'Revisión física y BIOS',status:'warning',message:'Verifica BIOS, dimensiones, conectores y capacidad térmica con el fabricante.'})
 return checks
}
export function buildTotal(selection: Build['selection'], items: CatalogComponent[]) { return items.filter(i=>Object.values(selection).includes(i.id)).reduce((sum,i)=>sum+i.price,0) }
