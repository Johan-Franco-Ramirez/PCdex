import { ArrowUpRight } from 'lucide-react'
import type { StoreLinks as StoreLinksData } from '../../types/hardware'

function externalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const url = new URL(value.trim())
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return undefined
    return url.href
  } catch {
    return undefined
  }
}

export function StoreLinks({ links }: { links?: StoreLinksData | null }) {
  const stores = [
    { label: 'Amazon', url: externalUrl(links?.amazon) },
    { label: 'Mercado Libre', url: externalUrl(links?.mercadolibre) },
  ].filter((store): store is { label: string; url: string } => Boolean(store.url))

  if (!stores.length) return null

  return (
    <section className="mt-6" aria-label="Enlaces a tiendas">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Consultar en tiendas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stores.map(({ label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-cyan-300 hover:border-cyan-300 hover:bg-cyan-950"
          >
            Ver en {label}
            <ArrowUpRight size={16} aria-hidden="true" />
            <span className="sr-only"> (se abre en una nueva pestaña)</span>
          </a>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">Son resultados de búsqueda; comprueba el modelo y su disponibilidad en la tienda.</p>
    </section>
  )
}
