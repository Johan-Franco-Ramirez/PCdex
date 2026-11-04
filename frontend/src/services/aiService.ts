import { categories } from '../data/categories'
import type { AIService } from '../types/ai'
import type { Category } from '../types/hardware'
import { buildService } from './buildService'
import { componentService } from './componentService'
import { buildTotal, diagnose } from './builder'
import { formatCOP } from './catalog'
export const normalize = (text:string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
const aliases: Record<Category, string[]> = {
 'Procesadores':['procesador','cpu','intel','ryzen'], 'Tarjetas gráficas':['grafica','gpu','rtx'], 'Memoria RAM':['ram','memoria'],
 'Almacenamiento':['ssd','almacenamiento','disco'], 'Fuentes de poder':['fuente','psu'], 'Motherboards':['motherboard','placa','b660','b650'], 'Gabinetes':['gabinete','caja'], 'Refrigeración':['refrigeracion','cooler','disipador'],
}
export function parseBudget(text:string): number | undefined {
 const match = normalize(text).match(/(\d[\d.,]*)(?:\s*)(millones?|millon|m\b|mil\b|k\b)?/)
 if (!match) return undefined
 const unit = match[2], raw = match[1]
 const value = unit ? Number(raw.replace(',','.')) * (/^m(?!il\b)/.test(unit) ? 1000000 : 1000) : Number(raw.replace(/[.,]/g,''))
 return Number.isFinite(value) && value > 0 && (unit || value >= 10000) ? Math.round(value) : undefined
}
export const aiService: AIService = { async reply(message, context) {
 const text = normalize(message), items = await componentService.list(context.items)
 const budget = /presupuesto|cop|pesos|mill[oó]n|\d\s*(m\b|k\b)/.test(text) || /(?:arma|genera|crea|configura)/.test(text) ? parseBudget(message) : undefined
 const current = {...context, items, budget:budget ?? context.budget}
 const category = categories.find(category => aliases[category].some(alias => text.includes(alias)))
 const summary = (selection=current.selection) => {
  const total = buildTotal(selection, items)
  return `Total simulado: ${formatCOP(total)}. Presupuesto: ${formatCOP(current.budget)}. ${total > current.budget && current.budget ? `Exceso: ${formatCOP(total-current.budget)}.` : current.budget ? `Disponible: ${formatCOP(current.budget-total)}.` : 'Sin límite definido.'}`
 }
 if (/compatib|verifica|diagnostico/.test(text)) return {content:diagnose(current.selection,items).map(c=>`${c.status==='error'?'Error':c.status==='pass'?'Correcto':'Aviso'} · ${c.label}: ${c.message}`).join('\n')}
 if (/elimina|quita|retira|borra/.test(text) && category) {
  const selection={...current.selection}; delete selection[category]
  return {content:`Retiré ${category}. ${summary(selection)}`,selection,budget}
 }
 if (/cambia|reemplaza|pon|mejora|barat|selecciona|agrega/.test(text) && category) {
  const options=items.filter(i=>i.category===category)
  const named=options.filter(i=>text.includes(normalize(i.name)) || text.includes(normalize(i.id)) || (['intel','ryzen','ddr4','ddr5','4080','990','b660','b650','450','850'].some(token=>text.includes(token)&&normalize(i.name+' '+i.memory+' '+i.capacity).includes(token))))
  const candidates=(named.length?named:options.filter(i=>i.id!==current.selection[category])).sort((a,b)=> /barat|ahorr/.test(text)?a.price-b.price:b.price-a.price)
  const item=candidates[0]
  if(!item)return {content:'No tengo otra alternativa de prueba en esa categoría. Puedes consultar las opciones del selector manual.'}
  const selection={...current.selection,[category]:item.id}
  const errors=diagnose(selection,items).filter(c=>c.status==='error')
  return {selection,budget,content:`Seleccioné ${item.name}. ${summary(selection)}${errors.length?'\nAtención: '+errors.map(c=>c.label+': '+c.message).join('; '):'\nSin conflictos en las reglas locales disponibles.'}`}
 }
 if (/arma|genera|crea|configura|completa|gaming|jugar|trabaj|economica/.test(text)) {
  const selection=await buildService.generate(current)
  return {selection,budget,content:Object.keys(selection).length===8?`Preparé una configuración completa con las opciones de prueba disponibles. ${summary(selection)}\nPuedes pedirme cambios o editar cada componente manualmente. Las recomendaciones son simuladas; no estiman rendimiento real.`:'El catálogo actual no permite generar una configuración completa compatible. Revisa los componentes disponibles.'}
 }
 if (/presupuesto|total|cuanto|precio|cuesta/.test(text) || budget) return {budget,content:`${budget?'Actualicé tu presupuesto. ':''}${summary()}`}
 return {content:'Soy PCdex AI en modo simulado. Prueba: «Arma un PC con presupuesto de 4 millones», «Cambia el procesador por Intel», «Pon RAM DDR4», «Quita la gráfica», «Consulta el presupuesto» o «Verifica compatibilidad». El chat y los selectores comparten tu configuración.'}
} }
