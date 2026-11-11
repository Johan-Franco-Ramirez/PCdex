import { request } from './api'
import type { DemoUser } from '../types/auth'

type AuthResponse = { user: DemoUser }
const json = (body: object): RequestInit => ({ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
export const register = (username:string, email:string, password:string) => request<AuthResponse>('/api/auth/registro',json({username,email,password}))
export const signIn = (email:string, password:string) => request<AuthResponse>('/api/auth/login',json({email,password}))
export const getSession = () => request<AuthResponse>('/api/auth/sesion')
export const signOut = () => request<{ok:boolean}>('/api/auth/logout',{method:'POST'})
