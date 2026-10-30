export type Route = 'login' | 'register' | 'home' | 'catalog' | 'component' | 'builder' | 'comparison' | 'admin'
export function readRoute(): Route { const value=window.location.hash.slice(2).split('?')[0]; return ['login','register','home','catalog','component','builder','comparison','admin'].includes(value)?value as Route:'home' }
