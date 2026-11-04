import {useEffect,useState} from 'react'
import {ArrowLeft,Check,LogOut,X} from 'lucide-react'
import Brand from '../components/layout/Brand'
import HomePage from '../pages/Home/HomePage'
import CatalogPage from '../pages/Catalog/CatalogPage'
import {CatalogDetail} from '../pages/ComponentDetail/CatalogDetail'
import BuilderPage from '../pages/Builder/BuilderPage'
import ComparisonPage from '../pages/Comparison/ComparisonPage'
import AdminPage from '../pages/Admin/AdminPage'
import LoginPage from '../pages/Login/LoginPage'
import RegisterPage from '../pages/Register/RegisterPage'
import {loadApiCatalog,session,logout,type AuthUser} from '../services/api'
import {demoOffers} from '../data/demoOffers'
import type {Build,CatalogComponent} from '../types/hardware'
import type {SavedAction,SavedComponent} from '../types/auth'
import {useToast} from '../hooks/useToast'
import {readRoute,type Route} from './navigation'
import '../pages/Catalog/catalog.css'
import '../pages/ComponentDetail/component-detail.css'
import '../components/layout/modules.css'
const emptySaved={favorite:false,added:false}
export default function AppRouter(){
 const [route,setRoute]=useState<Route>(readRoute),[user,setUser]=useState<AuthUser|null>(null),[ready,setReady]=useState(false)
 const [items,setItems]=useState<CatalogComponent[]>([]),[catalogError,setCatalogError]=useState(''),[catalogReady,setCatalogReady]=useState(false)
 const [selectedId,setSelectedId]=useState(()=>new URLSearchParams(location.hash.split('?')[1]).get('id')??'CPU-0042'),[category,setCategory]=useState(''),[resume,setResume]=useState<Route>('home')
 const [saved,setSaved]=useState<Record<string,SavedComponent>>({}),[selection,setSelection]=useState<Build['selection']>({}),[budget,setBudget]=useState(10000000)
 const {toast,setToast}=useToast(),selected=items.find(i=>i.id===selectedId)
 async function reloadCatalog(){setCatalogReady(false);try{setItems(await loadApiCatalog());setCatalogError('')}catch(e){setCatalogError(e instanceof Error?e.message:'No se pudo cargar el catálogo.');throw e}finally{setCatalogReady(true)}}
 useEffect(()=>{const controller=new AbortController();void loadApiCatalog(controller.signal).then(setItems).catch((e:unknown)=>{if(!controller.signal.aborted)setCatalogError(e instanceof Error?e.message:'No se pudo cargar el catálogo.')}).finally(()=>{if(!controller.signal.aborted)setCatalogReady(true)});void session().then(data=>setUser(data.user)).catch((e:unknown)=>{setToast(e instanceof Error?e.message:'No se pudo consultar la sesión.')}).finally(()=>setReady(true));return()=>controller.abort()},[setToast])
 useEffect(()=>{const listener=()=>{setRoute(readRoute());if(readRoute()==='component')setSelectedId(new URLSearchParams(location.hash.split('?')[1]).get('id')??'CPU-0042')};window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener)},[])
 useEffect(()=>{document.title=`PCdex · ${route==='component'?selected?.name??'Ficha':route}`},[route,selected?.name])
 function navigate(next:Route){setRoute(next);location.hash=next==='component'?`/component?id=${selectedId}`:`/${next}`;window.scrollTo(0,0)}
 function open(id:string){setSelectedId(id);setRoute('component');location.hash=`/component?id=${id}`;window.scrollTo(0,0)}
 function requireLogin(target:Route){setResume(target);navigate('login')}
 function save(action:SavedAction,id=selectedId){const next={...(saved[id]??emptySaved),[action]:!saved[id]?.[action]};setSaved({...saved,[id]:next});if(action==='added'){const item=items.find(i=>i.id===id);if(item)setSelection(previous=>{const value={...previous};if(next.added)value[item.category]=id;else delete value[item.category];return value})}setToast(action==='favorite'?'Favorito temporal de esta sesión.':'Selección del constructor actualizada.')}
 function login(profile:AuthUser){setUser(profile);setSaved({});navigate(resume);setToast('Sesión iniciada.');setResume('home')}
 async function signOut(){try{await logout();setUser(null);setSaved({});setSelection({});navigate('home');setToast('Sesión cerrada e invalidada.')}catch(e){setToast(e instanceof Error?e.message:'No se pudo cerrar la sesión.')}}
 const auth=route==='login'||route==='register'
 return <>{auth?<div className="auth-shell"><aside className="auth-story"><Brand/><div className="auth-story-content"><div className="auth-step"><span/> PCDEX / ACCESO</div><h2>Conoce cada pieza.<br/>Construye <span>sin límites.</span></h2><p>Guarda y recupera tus configuraciones privadas.</p><div className="auth-core"><div className="core-ring"/><div className="core-chip"><Brand/></div></div></div></aside>{route==='login'?<LoginPage onSuccess={login} navigate={navigate}/>:<RegisterPage onSuccess={login} navigate={navigate}/>}</div>:<div className="home-shell"><div className="home-header"><button className="brand-link" onClick={()=>navigate('home')} aria-label="PCdex inicio"><Brand/></button><div>{!ready?<span>Consultando sesión…</span>:user?<><span className="home-user">{user.username}</span><button onClick={()=>void signOut()}><LogOut size={16}/> Cerrar sesión</button></>:<div className="guest-actions"><button onClick={()=>requireLogin(route)}>Iniciar sesión</button><button onClick={()=>{setResume(route);navigate('register')}}>Registrarse</button></div>}</div></div><nav className="module-nav" aria-label="Navegación principal">{([['home','Inicio'],['catalog','Catálogo'],['builder','Constructor'],['comparison','Ofertas'],['admin','Administración']] as [Route,string][]).filter(([r])=>r!=='admin'||user?.roles.includes('ADMIN')).map(([value,label])=><a key={value} href={`#/${value}`} aria-current={route===value?'page':undefined} onClick={e=>{e.preventDefault();navigate(value)}}>{label}</a>)}</nav>{!catalogReady&&!catalogError&&<p className="catalog-main" role="status">Cargando catálogo…</p>}{catalogError&&<div className="catalog-main"><p role="alert" className="field-error">{catalogError} El catálogo no está disponible; no se muestran datos simulados como si procedieran del servidor.</p><button className="module-button" onClick={()=>void reloadCatalog().catch(()=>undefined)}>Reintentar</button></div>}
 {route==='home'&&<HomePage items={items} saved={saved} onOpen={open} onSave={save} onCatalog={value=>{setCategory(value??'');navigate('catalog')}} onBuilder={()=>navigate('builder')}/>}
 {route==='catalog'&&<CatalogPage key={category} items={items} initialCategory={category} saved={saved} onOpen={open} onSave={save}/>}
 {route==='component'&&<><div className="catalog-main detail-back"><button className="module-button" onClick={()=>navigate('catalog')}><ArrowLeft size={15}/> Volver al catálogo</button></div>{selected?<CatalogDetail item={selected} saved={saved[selectedId]??emptySaved} onSave={save}/>:<main className="catalog-main"><h1>Componente no encontrado</h1></main>}</>}
 {route==='builder'&&<BuilderPage key={user?.id??'guest'} items={items} selection={selection} setSelection={setSelection} budget={budget} setBudget={setBudget} user={user} onLogin={()=>requireLogin('builder')}/>}
 {route==='comparison'&&<ComparisonPage items={items} offers={demoOffers}/>}
 {route==='admin'&&(user?.roles.includes('ADMIN')&&user.mfa?<AdminPage onChanged={reloadCatalog}/>:<main className="catalog-main"><h1>Acceso administrativo</h1><p>Se requiere una cuenta administrativa y el segundo factor verificado.</p><button className="module-button" onClick={()=>requireLogin('admin')}>Iniciar sesión</button></main>)}
 </div>}{toast&&<div className="hud auth-hud" role="status"><Check size={18}/><div><strong>PCDEX / SISTEMA</strong><p>{toast}</p></div><button aria-label="Cerrar notificación" onClick={()=>setToast('')}><X size={17}/></button></div>}</>
}
