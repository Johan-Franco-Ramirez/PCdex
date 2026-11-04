import { categories } from '../data/categories'
import type { AIContext, BuildService } from '../types/ai'
import type { Build } from '../types/hardware'
import { buildTotal, diagnose } from './builder'
export function generateBuild({items, budget}: AIContext): Build['selection'] {
 let cheapest: Build['selection'] | undefined, best: Build['selection'] | undefined
 function visit(index: number, selection: Build['selection']) {
  if (index === categories.length) {
   if (diagnose(selection, items).some(check => check.status === 'error')) return
   const total = buildTotal(selection, items)
   if (!cheapest || total < buildTotal(cheapest, items)) cheapest = {...selection}
   if ((!budget || total <= budget) && (!best || total > buildTotal(best, items))) best = {...selection}
   return
  }
  const category = categories[index]
  for (const item of items.filter(item => item.category === category)) visit(index + 1, {...selection, [category]:item.id})
 }
 visit(0, {})
 return best ?? cheapest ?? {}
}
export const buildService: BuildService = { async generate(context) { return generateBuild(context) } }
