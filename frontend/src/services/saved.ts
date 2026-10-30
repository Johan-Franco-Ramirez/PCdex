import type { SavedAction, SavedComponent } from '../types/auth'
const empty = (): SavedComponent => ({ favorite: false, added: false })
const key = (email: string) => `pcdex:saved:${email.trim().toLowerCase()}`
export function loadSaved(email: string, storage: Pick<Storage, 'getItem'>): SavedComponent {
  try {
    const value: unknown = JSON.parse(storage.getItem(key(email)) ?? 'null')
    if (value && typeof value === 'object' && 'favorite' in value && 'added' in value && typeof value.favorite === 'boolean' && typeof value.added === 'boolean') return { favorite: value.favorite, added: value.added }
  } catch { /* El almacenamiento puede estar bloqueado o contener datos antiguos. */ }
  return empty()
}
export function persistSaved(email: string, value: SavedComponent, storage: Pick<Storage, 'setItem'>): boolean {
  try { storage.setItem(key(email), JSON.stringify(value)); return true } catch { return false }
}
export function afterLogin(saved: SavedComponent, pending: SavedAction | null): SavedComponent {
  return pending ? { ...saved, [pending]: true } : saved
}
