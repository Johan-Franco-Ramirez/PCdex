export type Category = 'Procesadores' | 'Tarjetas gráficas' | 'Memoria RAM' | 'Almacenamiento' | 'Fuentes de poder' | 'Motherboards' | 'Gabinetes' | 'Refrigeración'
export interface HardwareComponent { id: string; name: string; specs: [string, string][] }
export interface CatalogComponent extends HardwareComponent { brand: string; category: Category; price: number; summary: string; badge: string; generation?: string; socket?: string; memory?: string; watts?: number; capacity?: number; formFactor?: string }
export interface StoreOffer { name: string; price: number; location: string; stock: boolean }
export interface DemoOffer extends StoreOffer { id: string; componentId: string; condition: 'Nuevo' | 'Usado' | 'Reacondicionado' }
export interface Benchmark { name: string; value: number; percent: number }
export interface Build { id: string; name: string; owner: string; selection: Partial<Record<Category, string>>; budget: number }
