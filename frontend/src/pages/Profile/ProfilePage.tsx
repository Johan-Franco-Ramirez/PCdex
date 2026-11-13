import { useState, type FormEvent } from 'react'
import { Heart, Save, UserRound } from 'lucide-react'
import ComponentCard from '../../components/catalog/ComponentCard'
import CredentialsForms from './CredentialsForms'
import { updateProfile } from '../../services/auth'
import type { DemoUser, SavedAction, SavedComponent } from '../../types/auth'
import type { CatalogComponent } from '../../types/hardware'
import './profile.css'

type Props = { user:DemoUser; favorites:CatalogComponent[]; saved:Record<string,SavedComponent>; loading:boolean; error:string; onRetry:()=>void; onUser:(user:DemoUser)=>void; onOpen:(id:string)=>void; onSave:(action:SavedAction,id:string)=>void }
export default function ProfilePage({user,favorites,saved,loading,error,onRetry,onUser,onOpen,onSave}:Props) {
 const [name,setName]=useState(user.username),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[errorMessage,setErrorMessage]=useState('')
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault(); const next=name.trim()
  if(next.length<2||next.length>120){setErrorMessage('Escribe un nombre de entre 2 y 120 caracteres.');return}
  setBusy(true);setMessage('');setErrorMessage('')
  try { const result=await updateProfile(next);onUser(result.user);setName(result.user.username);setMessage('Perfil actualizado.') }
  catch(error){setErrorMessage(error instanceof Error?error.message:'No se pudo actualizar el perfil.')}
  finally{setBusy(false)}
 }
 return <main className="catalog-main profile-main"><div className="auth-step"><span/> TU CUENTA / PCDEX</div><h1>Mi perfil<span>.</span></h1><p className="muted">Administra tu cuenta y encuentra tus componentes favoritos.</p><section className="panel p-6 profile-card"><h2><UserRound size={20}/> Información personal</h2><form onSubmit={submit}><label className="module-field">Nombre<input value={name} maxLength={120} required onChange={e=>setName(e.target.value)} autoComplete="name"/></label><label className="module-field">Correo electrónico<input value={user.email} readOnly type="email"/></label><p className="muted">El correo identifica tu cuenta.</p>{errorMessage&&<p className="field-error" role="alert">{errorMessage}</p>}{message&&<p className="profile-success" role="status">{message}</p>}<button className="auth-submit profile-save" disabled={busy||name.trim()===user.username} type="submit"><Save size={16}/>{busy?'Guardando…':'Guardar cambios'}</button></form></section><CredentialsForms user={user} onUser={onUser}/><section className="profile-favorites"><div className="catalog-results-heading"><h2><Heart size={20}/> Mis favoritos <span>{favorites.length}</span></h2></div>{loading?<p className="muted" role="status">Cargando favoritos…</p>:error?<div className="catalog-empty"><p role="alert">{error}</p><button type="button" onClick={onRetry}>Volver a intentar</button></div>:favorites.length?<div className="catalog-grid">{favorites.map(item=><ComponentCard key={item.id} item={item} saved={saved[item.id]} onOpen={onOpen} onSave={onSave}/>)}</div>:<div className="catalog-empty"><Heart size={36}/><h3>Aún no tienes favoritos</h3><p>Guarda componentes desde el catálogo para encontrarlos aquí.</p></div>}</section></main>
}
