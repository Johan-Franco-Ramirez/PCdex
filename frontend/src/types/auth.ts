export interface DemoUser { username: string; email: string; role?: 'USUARIO' | 'ADMIN'; hasPassword?: boolean }
export interface AuthFields { username: string; email: string; password: string; confirmation: string }
export type FieldErrors = Partial<Record<keyof AuthFields, string>>
export type SavedAction = 'favorite' | 'added'
export interface SavedComponent { favorite: boolean; added: boolean }
