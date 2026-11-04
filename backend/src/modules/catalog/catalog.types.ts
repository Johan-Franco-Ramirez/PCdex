import { Prisma } from '@prisma/client';
export const CATEGORIAS = ['CPU','GPU','MOTHERBOARD','RAM','PSU','STORAGE','CASE','COOLER'] as const;
export type Categoria = typeof CATEGORIAS[number];
export const detalleInclude = {
 procesador: true, tarjetaGrafica: true, placaMadre: true, memoriaRAM: true,
 fuentePoder: true, almacenamiento: true, gabinete: true, refrigeracion: true,
} satisfies Prisma.ComponenteInclude;
export type ComponenteDetallado = Prisma.ComponenteGetPayload<{ include: typeof detalleInclude }>;
export const relacionPorCategoria = {
 CPU: 'procesador', GPU: 'tarjetaGrafica', MOTHERBOARD: 'placaMadre', RAM: 'memoriaRAM',
 PSU: 'fuentePoder', STORAGE: 'almacenamiento', CASE: 'gabinete', COOLER: 'refrigeracion',
} as const satisfies Record<Categoria, keyof typeof detalleInclude>;
export function esCategoria(value: string): value is Categoria { return CATEGORIAS.some(c => c === value); }
export function serializarComponente(item: ComponenteDetallado) {
 return { ...item, precio: item.precio?.toFixed(2) ?? null, moneda: 'COP' as const,
  tarjetaGrafica: item.tarjetaGrafica ? { ...item.tarjetaGrafica, vram: item.tarjetaGrafica.vram.toNumber() } : null };
}
