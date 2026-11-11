import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Fingerprint, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import Brand from '../../components/layout/Brand'
import type { DemoUser, AuthFields, FieldErrors } from '../../types/auth'
import type { Route } from '../../routes/navigation'
import { register as registerAccount, signIn } from '../../services/auth'
const initialFields: AuthFields = { username: '', email: '', password: '', confirmation: '' }
export default function AuthForm({ mode, onSuccess, navigate }: { mode: 'login' | 'register'; onSuccess: (user: DemoUser) => void; navigate: (route: Route) => void }) {
  const register = mode === 'register'
  const [fields, setFields] = useState<AuthFields>(initialFields)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const inputRefs = useRef<Partial<Record<keyof AuthFields, HTMLInputElement | null>>>({})
  const score = [fields.password.length >= 8, /[A-Za-z]/.test(fields.password), /[0-9]/.test(fields.password)].filter(Boolean).length
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const next: FieldErrors = {}
    if (register && !/^[a-zA-Z0-9_]{3,20}$/.test(fields.username.trim())) next.username = 'Usa entre 3 y 20 letras, números o guiones bajos.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) next.email = 'Introduce un correo válido, por ejemplo: piloto@pcdex.co.'
    if (fields.password.length < 8) next.password = 'La contraseña debe tener al menos 8 caracteres.'
    else if (register && (!/[A-Za-z]/.test(fields.password) || !/[0-9]/.test(fields.password))) next.password = 'Incluye al menos una letra y un número.'
    if (register && fields.confirmation !== fields.password) next.confirmation = 'Las contraseñas no coinciden.'
    setErrors(next)
    const first = Object.keys(next)[0] as keyof AuthFields | undefined
    if (first) { inputRefs.current[first]?.focus(); return }
    setBusy(true); setFormError('')
    try {
      const result = register ? await registerAccount(fields.username.trim(), fields.email.trim(), fields.password) : await signIn(fields.email.trim(), fields.password)
      setFields(initialFields)
      onSuccess(result.user)
    } catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo completar la solicitud.') }
    finally { setBusy(false) }
  }
  function field(name: keyof AuthFields, label: string, placeholder: string, type: string, autoComplete: string) {
    const Icon = name === 'username' ? UserRound : name === 'email' ? Mail : LockKeyhole
    const password = name === 'password' || name === 'confirmation'
    return <div className="auth-field"><label htmlFor={name}>{label}</label><div className={`auth-input ${errors[name] ? 'invalid' : ''}`}><Icon size={17}/><input ref={element => { inputRefs.current[name] = element }} id={name} name={name} type={password && visible ? 'text' : type} autoComplete={autoComplete} placeholder={placeholder} value={fields[name]} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : name === 'password' ? 'password-hint' : undefined} onChange={event => { setFields({ ...fields, [name]: event.target.value }); setErrors(previous => ({ ...previous, [name]: undefined })) }} required maxLength={name === 'username' ? 20 : name === 'email' ? 191 : 128} autoCapitalize="none" spellCheck={false}/>{name === 'password' && <button type="button" aria-label={visible ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}</div>{errors[name] && <p className="field-error" id={`${name}-error`} role="alert">{errors[name]}</p>}</div>
  }
  return <section className="auth-form-side"><a className="auth-back" href="#/home" onClick={event => { event.preventDefault(); navigate('home') }}><ArrowLeft size={15}/> Seguir explorando sin iniciar sesión</a><div className="auth-mobile-brand"><Brand/></div><div className="auth-form-container"><div className="auth-step"><span/> {register ? 'NUEVO EXPLORADOR / 02' : 'ACCESO AL SISTEMA / 01'}</div><div className="auth-form-icon">{register ? <UserRound size={24}/> : <Fingerprint size={27}/>}</div><h1>{register ? 'Tu próximo build' : 'Bienvenido de nuevo'}<br/><span>{register ? 'empieza aquí.' : 'al sistema.'}</span></h1><p className="auth-intro">{register ? 'Crea tu perfil de explorador y encuentra las piezas para tu próximo gran proyecto.' : 'Entra a tu espacio y sigue explorando el universo del hardware.'}</p><form noValidate onSubmit={submit}>
    {register && field('username', 'Nombre de usuario', 'ej. explorador_pc', 'text', 'username')}
    {field('email', 'Correo electrónico', 'tu@correo.com', 'email', 'email')}
    {field('password', 'Contraseña', register ? 'Crea tu contraseña' : 'Introduce tu contraseña', 'password', register ? 'new-password' : 'current-password')}
    <p className="password-hint" id="password-hint">{register ? 'Mínimo 8 caracteres, una letra y un número.' : 'Usa la contraseña de tu cuenta.'}</p>
    {register && <><div className="password-strength" aria-label={`Requisitos cumplidos: ${score} de 3`}>{[1, 2, 3].map(n => <span key={n} className={score >= n ? 'filled' : ''}/>)}</div>{field('confirmation', 'Confirmar contraseña', 'Repite tu contraseña', 'password', 'new-password')}</>}
    {formError && <p className="field-error" role="alert">{formError}</p>}<button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Procesando…' : register ? 'Crear cuenta' : 'Iniciar sesión'}<ArrowRight size={18}/></button>
    </form><div className="auth-switch">{register ? '¿Ya tienes un perfil?' : '¿Primera vez en PCDex?'} <a href={register ? '#/login' : '#/register'} onClick={event => { event.preventDefault(); navigate(register ? 'login' : 'register') }}>{register ? 'Iniciar sesión' : 'Crear una cuenta'}<ArrowUpSmall/></a></div><div className="auth-session-note"><ShieldCheck size={14}/> Tu sesión se mantiene al recargar</div></div><div className="auth-form-footer">PCDEX CORE v1.0 <span>CO / ESPAÑOL</span></div></section>
}
function ArrowUpSmall() { return <ArrowRight size={13}/> }
