import { useState, type FormEvent } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { changeEmail, changePassword, createPassword, googlePasswordSetupUrl } from '../../services/auth'
import type { DemoUser } from '../../types/auth'

export default function CredentialsForms({user,onUser}:{user:DemoUser;onUser:(user:DemoUser)=>void}) {
 const [email,setEmail]=useState(user.email),[confirmEmail,setConfirmEmail]=useState(''),[emailPassword,setEmailPassword]=useState('')
 const [currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState('')
 const [busy,setBusy]=useState<'email'|'password'|'setup'|null>(null)
 const [emailMessage,setEmailMessage]=useState(''),[emailError,setEmailError]=useState(''),[passwordMessage,setPasswordMessage]=useState(''),[passwordError,setPasswordError]=useState('')
 async function submitEmail(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setEmailMessage('');setEmailError('')
  const next=email.trim().toLowerCase()
  if(next!==confirmEmail.trim().toLowerCase()){setEmailError('Los correos no coinciden.');return}
  if(next===user.email.toLowerCase()){setEmailError('El correo es igual al actual.');return}
  setBusy('email')
  try{const result=await changeEmail(next,emailPassword);onUser(result.user);setEmail(result.user.email);setConfirmEmail('');setEmailPassword('');setEmailMessage('Correo actualizado. Usa el nuevo correo para iniciar sesión.')}
  catch(error){setEmailError(error instanceof Error?error.message:'No se pudo cambiar el correo.')}
  finally{setBusy(null)}
 }
 async function submitPassword(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setPasswordMessage('');setPasswordError('')
  if(newPassword!==confirmPassword){setPasswordError('Las contraseñas nuevas no coinciden.');return}
  if(newPassword.length<8||!/[A-Za-z]/.test(newPassword)||!/[0-9]/.test(newPassword)){setPasswordError('La nueva contraseña necesita al menos 8 caracteres, una letra y un número.');return}
  if(newPassword===currentPassword){setPasswordError('La nueva contraseña debe ser distinta.');return}
  setBusy('password')
  try{await changePassword(currentPassword,newPassword);setCurrentPassword('');setNewPassword('');setConfirmPassword('');setPasswordMessage('Contraseña actualizada. Las demás sesiones se cerraron.')}
  catch(error){setPasswordError(error instanceof Error?error.message:'No se pudo cambiar la contraseña.')}
  finally{setBusy(null)}
 }
 async function submitSetup(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setPasswordError('');setPasswordMessage('')
  if(newPassword!==confirmPassword){setPasswordError('Las contraseñas no coinciden.');return}
  if(newPassword.length<8||!/[A-Za-z]/.test(newPassword)||!/[0-9]/.test(newPassword)){setPasswordError('La contraseña necesita al menos 8 caracteres, una letra y un número.');return}
  setBusy('setup')
  try{const result=await createPassword(newPassword);onUser(result.user);setNewPassword('');setConfirmPassword('');setPasswordMessage('Contraseña creada. Las demás sesiones se cerraron.')}
  catch(error){setPasswordError(error instanceof Error?error.message:'No se pudo crear la contraseña.')}
  finally{setBusy(null)}
 }
 const params=new URLSearchParams(window.location.hash.split('?')[1]??'')
 if(user.hasPassword===false)return <section className="panel p-6 profile-card"><h2><KeyRound size={20}/> Seguridad de la cuenta</h2><p className="muted">Para cambiar el correo o la contraseña, crea primero una contraseña de PCdex confirmando tu cuenta de Google.</p>{params.get('google_setup_error')&&<p className="field-error" role="alert">No se pudo confirmar la cuenta. Selecciona la misma cuenta de Google e inténtalo de nuevo.</p>}{params.get('google_setup')==='1'?<form onSubmit={submitSetup}><label className="module-field">Nueva contraseña de PCdex<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password"/></label><label className="module-field">Confirmar contraseña<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password"/></label><p className="muted">Mínimo 8 caracteres, una letra y un número. La verificación con Google dura cinco minutos.</p>{passwordError&&<p className="field-error" role="alert">{passwordError}</p>}<button className="auth-submit profile-save" disabled={!!busy} type="submit">{busy==='setup'?'Guardando…':'Crear contraseña'}</button><a className="profile-reauth" href={googlePasswordSetupUrl}>Confirmar con Google de nuevo</a></form>:<a className="profile-reauth" href={googlePasswordSetupUrl}>Confirmar con Google</a>}</section>
 return <section className="panel p-6 profile-card"><h2><KeyRound size={20}/> Seguridad de la cuenta</h2>{passwordMessage&&<p className="profile-success" role="status">{passwordMessage}</p>}<details className="profile-details"><summary><Mail size={16}/> Cambiar correo</summary><form onSubmit={submitEmail}><label className="module-field">Nuevo correo<input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={191} required autoComplete="email"/></label><label className="module-field">Confirmar nuevo correo<input type="email" value={confirmEmail} onChange={e=>setConfirmEmail(e.target.value)} maxLength={191} required autoComplete="off"/></label><label className="module-field">Contraseña actual<input type="password" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} maxLength={128} required autoComplete="current-password"/></label><p className="muted">Revisa que el correo sea correcto: todavía no enviamos un mensaje de verificación.</p>{emailError&&<p className="field-error" role="alert">{emailError}</p>}{emailMessage&&<p className="profile-success" role="status">{emailMessage}</p>}<button className="auth-submit profile-save" disabled={!!busy} type="submit">{busy==='email'?'Guardando…':'Actualizar correo'}</button></form></details><details className="profile-details"><summary><KeyRound size={16}/> Cambiar contraseña</summary><form onSubmit={submitPassword}><label className="module-field">Contraseña actual<input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} maxLength={128} required autoComplete="current-password"/></label><label className="module-field">Nueva contraseña<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password"/></label><label className="module-field">Confirmar nueva contraseña<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password"/></label><p className="muted">Mínimo 8 caracteres, una letra y un número.</p>{passwordError&&<p className="field-error" role="alert">{passwordError}</p>}<button className="auth-submit profile-save" disabled={!!busy} type="submit">{busy==='password'?'Guardando…':'Actualizar contraseña'}</button></form></details></section>
}
