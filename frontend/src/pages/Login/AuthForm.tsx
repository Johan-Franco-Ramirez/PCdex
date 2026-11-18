import {useEffect,useState,type FormEvent} from 'react'
import {ArrowLeft,ArrowRight,ShieldCheck} from 'lucide-react'
import Brand from '../../components/layout/Brand'
import type {Route} from '../../routes/navigation'
import {api,session,type AuthUser} from '../../services/api'
export default function AuthForm({mode,onSuccess,navigate}:{mode:'login'|'register';onSuccess:(user:AuthUser)=>void;navigate:(route:Route)=>void}){
 const register=mode==='register'
 const [username,setUsername]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('')
 const [error,setError]=useState(()=>{
  const code=new URLSearchParams(window.location.hash.split('?')[1]??'').get('google_error')
  const messages:Record<string,string>={
   no_configurado:'El acceso con Google aún no está configurado.',
   solicitud_invalida:'La solicitud de Google venció o no es válida. Inténtalo de nuevo.',
   cancelado:'No se completó el acceso con Google.',
   cuenta_existente:'Ya existe una cuenta con este correo. Inicia sesión con su contraseña; la vinculación con Google aún no está disponible.',
   admin_requiere_acceso:'Para mantener el segundo factor, la administración debe iniciar sesión con contraseña y su código.',
   fallo:'No se pudo completar el acceso con Google. Inténtalo de nuevo.'
  }
  return code ? messages[code]??messages.fallo : ''
 }),[busy,setBusy]=useState(false),[pending,setPending]=useState(false),[secret,setSecret]=useState(''),[uri,setUri]=useState(''),[code,setCode]=useState('')
 const [emailCode,setEmailCode]=useState(''),[codeNotice,setCodeNotice]=useState(''),[sendingCode,setSendingCode]=useState(false)
 const [emailRequired,setEmailRequired]=useState(false)
 useEffect(()=>{let active=true;void session().then(data=>{if(active)setEmailRequired(data.emailVerificationRequired===true)}).catch(()=>{if(active)setError('No se pudo comprobar la configuración del registro.')});return()=>{active=false}},[])
 async function sendCode(){
  setError('');setCodeNotice('');setSendingCode(true)
  try{await api('/api/auth/verification/email','POST',{email});setCodeNotice('Si el correo puede registrarse, recibirás un código. Revisa tu bandeja y correo no deseado.')}
  catch(e){setError(e instanceof Error?e.message:'No se pudo enviar el código.')}
  finally{setSendingCode(false)}
 }
 async function submit(event:FormEvent){event.preventDefault();setError('');setBusy(true);try{
 if(pending){const result=await api<{user:AuthUser}>('/api/auth/totp/verify','POST',{code});onSuccess(result.user);return}
 if(register&&password!==confirmation)throw new Error('Las contraseñas no coinciden.')
 const result=await api<{user?:AuthUser;requiresTotp?:boolean;needsSetup?:boolean}>(`/api/auth/${register?'register':'login'}`,'POST',{email,password,...(register?{username,...(emailRequired?{codigo:emailCode}:{})}:{})})
 setPassword('');setConfirmation('')
 if(result.requiresTotp){setPending(true);if(result.needsSetup){const enrollment=await api<{secret:string;uri:string}>('/api/auth/totp/setup','POST',{});setSecret(enrollment.secret);setUri(enrollment.uri)}}else if(result.user)onSuccess(result.user)
 }catch(e){setError(e instanceof Error?e.message:'Error de acceso.')}finally{setBusy(false)}}
 return <section className="auth-form-side"><a className="auth-back" href="#/home" onClick={e=>{e.preventDefault();navigate('home')}}><ArrowLeft size={15}/> Seguir explorando</a><div className="auth-mobile-brand"><Brand/></div><div className="auth-form-container"><div className="auth-step"><span/> PCDEX / ACCESO SEGURO</div><h1>{pending?'Verifica tu acceso':register?'Crea tu cuenta':'Bienvenido de nuevo'}<span>.</span></h1><p className="auth-intro">{pending?'Introduce el código de seis dígitos de Google Authenticator.':'Tus configuraciones se guardan en tu cuenta.'}</p>{secret&&<div className="panel p-6"><h3>Configurar Google Authenticator</h3><p>Añade una cuenta mediante clave de configuración. Guarda esta clave de forma privada; no se mostrará después de confirmar.</p><code style={{overflowWrap:'anywhere'}}>{secret}</code><p><a href={uri}>Abrir aplicación compatible</a></p></div>}<form onSubmit={submit}>
 {pending?<label className="module-field">Código de autenticación<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label>:<>
 {register&&<label className="module-field">Nombre de usuario<input required maxLength={80} autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)}/></label>}
 <label className="module-field">Correo electrónico<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
{register&&emailRequired&&<><button type="button" className="module-button" disabled={sendingCode||!email.trim()} onClick={()=>void sendCode()}>{sendingCode?'Enviando código…':'Enviar código al correo'}</button>{codeNotice&&<p role="status" className="muted">{codeNotice}</p>}<label className="module-field">Código de verificación<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={emailCode} onChange={e=>setEmailCode(e.target.value)}/></label></>}
<label className="module-field">Contraseña<input required type="password" autoComplete={register?'new-password':'current-password'} minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label><p className="muted">Entre 12 y 128 caracteres.</p>
 {register&&<label className="module-field">Confirmar contraseña<input required type="password" autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}</>}
 {error&&<p className="field-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy?'Procesando…':pending?'Verificar código':register?'Crear cuenta':'Iniciar sesión'}<ArrowRight size={18}/></button></form>{!pending&&<a className="module-button mt-4 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-400/40 px-4 text-cyan-300" href={`${(import.meta.env.VITE_API_URL??'').replace(/\/$/,'')}/api/auth/google`}>Continuar con Google</a>}{pending?<button className="module-button" onClick={()=>{setPending(false);setSecret('');setUri('');setCode('')}}>Volver al acceso</button>:<div className="auth-switch"><button className="module-button" onClick={()=>navigate(register?'login':'register')}>{register?'Ya tengo una cuenta':'Crear una cuenta'}</button></div>}<div className="auth-session-note"><ShieldCheck size={14}/> Sesión protegida mediante cookie HttpOnly</div></div></section>
}
