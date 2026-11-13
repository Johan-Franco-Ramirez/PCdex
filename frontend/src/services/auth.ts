import { request, toCatalogComponent, type ApiComponent } from './api'
import type { DemoUser } from '../types/auth'

type AuthResponse = { user: DemoUser }
export const googleLoginUrl = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/auth/google`
export const googlePasswordSetupUrl = `${googleLoginUrl}?intent=crear_contrasena`
const json = (body: object): RequestInit => ({ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
export const register = (username:string, email:string, password:string) => request<AuthResponse>('/api/auth/registro',json({username,email,password}))
export const signIn = (email:string, password:string) => request<AuthResponse>('/api/auth/login',json({email,password}))
export const getSession = () => request<AuthResponse>('/api/auth/sesion')
export const signOut = () => request<{ok:boolean}>('/api/auth/logout',{method:'POST'})
export const updateProfile = (username:string) => request<AuthResponse>('/api/auth/perfil',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})})
export const changeEmail = (email:string, currentPassword:string) => request<AuthResponse>('/api/auth/perfil/correo',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,currentPassword})})
export const changePassword = (currentPassword:string, newPassword:string) => request<{ok:boolean}>('/api/auth/perfil/contrasena',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})})
export const createPassword = (newPassword:string) => request<AuthResponse>('/api/auth/perfil/contrasena/crear',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newPassword})})
export const listFavorites = async () => (await request<{data:ApiComponent[]}>('/api/auth/favoritos')).data.map(toCatalogComponent)
export const setFavorite = (id:string, favorite:boolean) => request<{ok:boolean}>(`/api/auth/favoritos/${encodeURIComponent(id)}`,{method:favorite?'PUT':'DELETE'})
