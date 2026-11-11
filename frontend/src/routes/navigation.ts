import type { DemoUser } from '../types/auth'

export type Route = 'ai' | 'login' | 'register' | 'home' | 'catalog' | 'component' | 'builder' | 'comparison' | 'admin'
type NavigationItem = readonly [Route, string]

const publicNavigation: readonly NavigationItem[] = [
 ['home', 'Inicio'],
 ['catalog', 'Catálogo'],
 ['builder', 'Constructor'],
 ['ai', 'PCdex AI'],
 ['comparison', 'Ofertas'],
]
const adminNavigation: readonly NavigationItem[] = [...publicNavigation, ['admin', 'Administración']]

export function isAdmin(user: DemoUser | null): boolean { return user?.role === 'ADMIN' }
export function navigationFor(user: DemoUser | null): readonly NavigationItem[] { return isAdmin(user) ? adminNavigation : publicNavigation }
export function routeForUser(route: Route, user: DemoUser | null): Route {
 if (isAdmin(user)) return route === 'login' || route === 'register' ? 'admin' : route
 if (route === 'admin') return user ? 'home' : 'login'
 return route
}
export function readRoute(): Route { const value=window.location.hash.slice(2).split('?')[0]; return ['ai','login','register','home','catalog','component','builder','comparison','admin'].includes(value)?value as Route:'home' }

