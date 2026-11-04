import type { Build, CatalogComponent } from './hardware'
export interface ChatMessage { id: string; role: 'assistant' | 'user'; content: string }
export interface AIContext { selection: Build['selection']; budget: number; items: CatalogComponent[] }
export interface AIReply { content: string; selection?: Build['selection']; budget?: number }
export interface AIService { reply(message: string, context: AIContext): Promise<AIReply> }
export interface ComponentService { list(items: CatalogComponent[]): Promise<CatalogComponent[]> }
export interface BuildService { generate(context: AIContext): Promise<Build['selection']> }
