export class ApiError extends Error {
 readonly status: number; readonly code: string
 constructor(status: number, code: string, message: string) { super(message); this.name = 'ApiError'; this.status = status; this.code = code }
}
import type { CatalogComponent, Category } from '../types/hardware'
export const categoryToApi: Record<Category, string> = {
 'Procesadores':'CPU','Tarjetas gráficas':'GPU','Motherboards':'MOTHERBOARD','Memoria RAM':'RAM',
 'Fuentes de poder':'PSU','Almacenamiento':'STORAGE','Gabinetes':'CASE','Refrigeración':'COOLER',
}
export const apiToCategory: Record<string, Category> = Object.fromEntries(Object.entries(categoryToApi).map(([k,v])=>[v,k])) as Record<string, Category>
export type ApiComponent = { id:string; nombre:string; marca:string; categoria:string; precio:string|null; [key:string]: unknown }
export type CatalogResponse = { data: ApiComponent[]; meta: { page:number; limit:number; total:number; pages:number } }
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
 let response: Response
 try { response = await fetch(`${base}${path}`, { ...init, credentials: 'include' }) } catch { throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con la API.') }
 const data: unknown = await response.json().catch(() => null)
 if (!response.ok) {
  const error = (data as {error?: {codigo?: string; mensaje?: string}} | null)?.error
  throw new ApiError(response.status, error?.codigo ?? 'ERROR_HTTP', error?.mensaje ?? `Error HTTP ${response.status}`)
 }
 if (data === null) throw new ApiError(response.status, 'RESPUESTA_VACIA', 'La API devolvió una respuesta vacía.')
 return data as T
}
export function toCatalogComponent(item: ApiComponent): CatalogComponent {
 const detail = item.procesador ?? item.tarjetaGrafica ?? item.placaMadre ?? item.memoriaRAM ?? item.fuentePoder ?? item.almacenamiento ?? item.gabinete ?? item.refrigeracion
 const d = (detail && typeof detail === 'object') ? detail as Record<string, unknown> : {}
 const price = item.precio === null ? 0 : Number(item.precio)
 return { id:item.id, name:item.nombre, brand:item.marca, category:apiToCategory[item.categoria] ?? 'Procesadores', price, priceKnown:item.precio!==null, summary:'Componente importado desde la API.', badge:item.categoria, specs:Object.entries(d).filter(([k])=>k!=='componente_id').map(([k,v])=>[k,String(v)] as [string,string]), socket:typeof d.socket==='string'?d.socket:undefined, memory:typeof d.tipo==='string'?d.tipo:typeof d.tipo_ram==='string'?d.tipo_ram:undefined, watts:typeof d.vatios==='number'?d.vatios:typeof d.tdp==='number'?d.tdp:undefined, capacity:typeof d.capacidad==='number'?d.capacidad:undefined, formFactor:typeof d.formato==='string'?d.formato:undefined }
}
export const listComponents = (query='') => request<CatalogResponse>(`/api/componentes${query ? `?${query}` : ''}`)
export const validateBuild = (ids:string[]) => request<{compatible:boolean; errores:string[]; advertencias:string[]}>('/api/builds/validar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({componente_ids:ids})})
export async function listAllComponents(): Promise<ApiComponent[]> {
 const first = await listComponents('page=1&limit=100')
 const remaining = await Promise.all(Array.from({length: Math.max(0, first.meta.pages - 1)}, (_, i) => listComponents(`page=${i + 2}&limit=100`)))
 return [...first.data, ...remaining.flatMap(page => page.data)]
}

