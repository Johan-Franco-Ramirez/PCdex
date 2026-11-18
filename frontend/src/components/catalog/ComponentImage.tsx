import { useState } from 'react'
import type { CatalogComponent } from '../../types/hardware'
import { HardwareArt } from './HardwareArt'

function imageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    const input = value.trim()
    if (input.startsWith('/') && !input.startsWith('//') && !input.includes('\\')) return input
    const url = new URL(input)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined
    return url.href
  } catch {
    return undefined
  }
}

export function ComponentImage({ item }: { item: CatalogComponent }) {
  const src = imageUrl(item.image)
  const [failedSrc, setFailedSrc] = useState<string | undefined>()

  if (!src || src === failedSrc) {
    return <div role="img" aria-label={`Ilustración genérica de ${item.category}; fotografía no disponible`}>
      <HardwareArt category={item.category}/>
      <p className="component-image-note">Ilustración genérica</p>
    </div>
  }
  return <img className="component-image" src={src} alt={item.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)}/>
}
