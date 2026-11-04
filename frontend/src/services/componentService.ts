import type { ComponentService } from '../types/ai'
export const componentService: ComponentService = { async list(items) { return items.map(item => ({ ...item })) } }
