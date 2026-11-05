import {useState,type FormEvent} from 'react'
import {ArrowLeft,ArrowRight,ShieldCheck} from 'lucide-react'
import Brand from '../../components/layout/Brand'
import type {Route} from '../../routes/navigation'
import {api,type AuthUser} from '../../services/api'
export default function AuthForm({mode,onSuccess,navigate}:{mode:'login'|'register';onSuccess:(user:AuthUser)=>void;navigate:(route:Route)=>void}){
 const register=mode==='register'
 const [username,setUsername]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('')
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState(false),[secret,setSecret]=useState(''),[uri,setUri]=useState(''),[code,setCode]=useState('')
 async function submit(event:FormEvent){event.preventDefault();setError('');setBusy(true);try{
 if(pending){const result=await api<{user:AuthUser}>('/api/auth/totp/verify','POST',{code});onSuccess(result.user);return}
 if(register&&password!==confirmation)throw new Error('Las contraseñas no coinciden.')
 const result=await api<{user?:AuthUser;requiresTotp?:boolean;needsSetup?:boolean}>(`/api/auth/${register?'register':'login'}`,'POST',{email,password,...(register?{username}:{})})
 setPassword('');setConfirmation('')
 if(result.requiresTotp){setPending(true);if(result.needsSetup){const enrollment=await api<{secret:string;uri:string}>('/api/auth/totp/setup','POST',{});setSecret(enrollment.secret);setUri(enrollment.uri)}}else if(result.user)onSuccess(result.user)
 }catch(e){setError(e instanceof Error?e.message:'Error de acceso.')}finally{setBusy(false)}}
 return <section className="auth-form-side"><a className="auth-back" href="#/home" onClick={e=>{e.preventDefault();navigate('home')}}><ArrowLeft size={15}/> Seguir explorando</a><div className="auth-mobile-brand"><Brand/></div><div className="auth-form-container"><div className="auth-step"><span/> PCDEX / ACCESO SEGURO</div><h1>{pending?'Verifica tu acceso':register?'Crea tu cuenta':'Bienvenido de nuevo'}<span>.</span></h1><p className="auth-intro">{pending?'Introduce el código de seis dígitos de Google Authenticator.':'Tus configuraciones se guardan en tu cuenta.'}</p>{secret&&<div className="panel p-6"><h3>Configurar Google Authenticator</h3><p>Añade una cuenta mediante clave de configuración. Guarda esta clave de forma privada; no se mostrará después de confirmar.</p><code style={{overflowWrap:'anywhere'}}>{secret}</code><p><a href={uri}>Abrir aplicación compatible</a></p></div>}<form onSubmit={submit}>
 {pending?<label className="module-field">Código de autenticación<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label>:<>
 {register&&<label className="module-field">Nombre de usuario<input required maxLength={80} autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)}/></label>}
 <label className="module-field">Correo electrónico<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label className="module-field">Contraseña<input required type="password" autoComplete={register?'new-password':'current-password'} minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label><p className="muted">Entre 12 y 128 caracteres.</p>
 {register&&<label className="module-field">Confirmar contraseña<input required type="password" autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}</>}
 {error&&<p className="field-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy?'Procesando…':pending?'Verificar código':register?'Crear cuenta':'Iniciar sesión'}<ArrowRight size={18}/></button></form>{pending?<button className="module-button" onClick={()=>{setPending(false);setSecret('');setUri('');setCode('')}}>Volver al acceso</button>:<div className="auth-switch"><button className="module-button" onClick={()=>navigate(register?'login':'register')}>{register?'Ya tengo una cuenta':'Crear una cuenta'}</button></div>}<div className="auth-session-note"><ShieldCheck size={14}/> Sesión protegida mediante cookie HttpOnly</div></div></section>
}
