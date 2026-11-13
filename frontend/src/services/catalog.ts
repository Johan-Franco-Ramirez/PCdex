import { catalog } from '../data/components'
import type { CatalogComponent } from '../types/hardware'
export function searchCatalog(query: string, items: CatalogComponent[] = catalog): CatalogComponent[] {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  return items.filter(item => terms.every(term => normalize(`${item.name} ${item.brand} ${item.category} ${item.summary}`).includes(term)))
}
export const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
export const formatComponentPrice = (item: CatalogComponent) => item.priceKnown === false ? 'Precio desconocido' : formatCOP(item.price)
