import { useEffect, useState } from 'react'
import { ArrowLeft, Check, LogOut, X } from 'lucide-react'
import Brand from '../components/layout/Brand'
import HomePage from '../pages/Home/HomePage'
import CatalogPage from '../pages/Catalog/CatalogPage'
import { CatalogDetail } from '../pages/ComponentDetail/CatalogDetail'
import BuilderPage from '../pages/Builder/BuilderPage'
import ComparisonPage from '../pages/Comparison/ComparisonPage'
import AdminPage from '../pages/Admin/AdminPage'
import LoginPage from '../pages/Login/LoginPage'
import RegisterPage from '../pages/Register/RegisterPage'
import { catalog } from '../data/components'
import { demoOffers } from '../data/demoOffers'
import type { Build, CatalogComponent, DemoOffer } from '../types/hardware'
import type { DemoUser, SavedAction, SavedComponent } from '../types/auth'
import { useToast } from '../hooks/useToast'
import { readRoute, type Route } from './navigation'
import '../pages/Catalog/catalog.css'
import '../pages/ComponentDetail/component-detail.css'
import '../components/layout/modules.css'
const emptySaved={favorite:false,added:false}
export default function AppRouter(){
 const [route,setRoute]=useState<Route>(readRoute),[user,setUser]=useState<DemoUser|null>(null)
 const [items,setItems]=useState<CatalogComponent[]>(catalog),[offers,setOffers]=useState<DemoOffer[]>(demoOffers)
 const [selectedId,setSelectedId]=useState(()=>new URLSearchParams(location.hash.split('?')[1]).get('id')??'CPU-0042')
 const [category,setCategory]=useState('')
 const [accounts,setAccounts]=useState<Record<string,Record<string,SavedComponent>>>({})
 const [pending,setPending]=useState<{action:SavedAction;id:string}|null>(null)
 const [resume,setResume]=useState<Route>('home'),[pendingBuild,setPendingBuild]=useState('')
 const [selection,setSelection]=useState<Build['selection']>({}),[budget,setBudget]=useState(10000000),[builds,setBuilds]=useState<Build[]>([])
 const {toast,setToast}=useToast()
 const owner=user?.email.toLowerCase()??'',saved=accounts[owner]??{},selected=items.find(i=>i.id===selectedId)
 useEffect(()=>{const listener=()=>{setRoute(readRoute());if(readRoute()==='component')setSelectedId(new URLSearchParams(location.hash.split('?')[1]).get('id')??'CPU-0042')};window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener)},[])
 useEffect(()=>{document.title=`PCDex · ${{home:'Inicio',catalog:'Catálogo',component:selected?.name??'Ficha',builder:'Constructor',comparison:'Ofertas',admin:'Administración',login:'Iniciar sesión',register:'Registro'}[route]}`},[route,selected?.name])
 function navigate(next:Route){setRoute(next);location.hash=next==='component'?`/component?id=${selectedId}`:`/${next}`;window.scrollTo(0,0)}
 function open(id:string){setSelectedId(id);setRoute('component');location.hash=`/component?id=${id}`;window.scrollTo(0,0)}
 function requireLogin(target:Route){setResume(target);navigate('login');setToast('Inicia sesión o regístrate para continuar.')}
 function updateSelection(id:string,add:boolean){const item=items.find(i=>i.id===id);if(item)setSelection(previous=>{const next={...previous};if(add)next[item.category]=id;else if(next[item.category]===id)delete next[item.category];return next})}
 function save(action:SavedAction,id=selectedId){if(!user){setPending({action,id});setSelectedId(id);requireLogin('component');return}const next={...(saved[id]??emptySaved),[action]:!saved[id]?.[action]};setAccounts({...accounts,[owner]:{...saved,[id]:next}});if(action==='added')updateSelection(id,next.added);setToast(next[action]?'Componente guardado durante esta sesión.':'Componente retirado.')}
 function saveBuild(name:string){if(!user){setPendingBuild(name);requireLogin('builder');return}setBuilds([...builds,{id:crypto.randomUUID(),name,owner,selection:{...selection},budget}]);setToast('Nuevo ensamble guardado durante esta sesión.')}
 function login(profile:DemoUser){const key=profile.email.toLowerCase();setUser(profile);if(pending){const previous=accounts[key]??{};setAccounts({...accounts,[key]:{...previous,[pending.id]:{...(previous[pending.id]??emptySaved),[pending.action]:true}}});if(pending.action==='added')updateSelection(pending.id,true);open(pending.id);setToast('Sesión iniciada. Componente guardado.');setPending(null)}else{if(pendingBuild){setBuilds([...builds,{id:crypto.randomUUID(),name:pendingBuild,owner:key,selection:{...selection},budget}]);setPendingBuild('');setToast('Sesión iniciada. Ensamble guardado.')}else setToast(`Bienvenido, ${profile.username}.`);navigate(resume)}setResume('home')}
 function changeItems(next:CatalogComponent[]){setItems(next);const valid=new Set(next.map(i=>i.id));setSelection(previous=>Object.fromEntries(Object.entries(previous).filter(([,id])=>valid.has(id))));setBuilds(previous=>previous.map(b=>({...b,selection:Object.fromEntries(Object.entries(b.selection).filter(([,id])=>valid.has(id)))})))}
 function catalogAt(value=''){setCategory(value);navigate('catalog')}
 const auth=route==='login'||route==='register'
 return <>{auth?<div className="auth-shell"><aside className="auth-story"><Brand/><div className="auth-story-content"><div className="auth-step"><span/> PCDEX / ACCESO</div><h2>Conoce cada pieza.<br/>Construye <span>sin límites.</span></h2><p>Guarda tus favoritos y crea varios ensambles en tu sesión de demostración.</p><div className="auth-core"><div className="core-ring"/><div className="core-chip"><Brand/></div></div></div></aside>{route==='login'?<LoginPage onSuccess={login} navigate={next=>{if(next==='home'){setPending(null);setPendingBuild('');setResume('home')}navigate(next)}}/>:<RegisterPage onSuccess={login} navigate={next=>{if(next==='home'){setPending(null);setPendingBuild('');setResume('home')}navigate(next)}}/>}</div>:<div className="home-shell"><div className="home-header"><button className="brand-link" onClick={()=>navigate('home')} aria-label="PCDex inicio"><Brand/></button><div>{user?<><span className="home-user">{user.username}</span><button onClick={()=>{setUser(null);setSelection({});setPending(null);setPendingBuild('');navigate('home');setToast('Sesión cerrada.')}}><LogOut size={16}/> Cerrar sesión</button></>:<div className="guest-actions"><button onClick={()=>{setResume(route);navigate('login')}}>Iniciar sesión</button><button onClick={()=>{setResume(route);navigate('register')}}>Registrarse</button></div>}</div></div><nav className="module-nav" aria-label="Navegación principal">{([['home','Inicio'],['catalog','Catálogo'],['builder','Constructor'],['comparison','Ofertas'],['admin','Administración']] as [Route,string][]).map(([value,label])=><a key={value} href={`#/${value}`} aria-current={route===value?'page':undefined} onClick={e=>{e.preventDefault();navigate(value)}}>{label}</a>)}</nav>
 {route==='home'&&<HomePage items={items} saved={saved} onOpen={open} onSave={save} onCatalog={catalogAt} onBuilder={()=>navigate('builder')}/>}
 {route==='catalog'&&<CatalogPage key={category} items={items} initialCategory={category} saved={saved} onOpen={open} onSave={save}/>}
 {route==='component'&&<><div className="catalog-main detail-back"><button className="module-button" onClick={()=>navigate('catalog')}><ArrowLeft size={15}/> Volver al catálogo</button></div>{selected?<CatalogDetail item={selected} saved={saved[selectedId]??emptySaved} onSave={save}/>:<main className="catalog-main"><h1>Componente no encontrado</h1><button className="module-button" onClick={()=>navigate('catalog')}>Ver catálogo</button></main>}</>}
 {route==='builder'&&<BuilderPage items={items} selection={selection} setSelection={setSelection} budget={budget} setBudget={setBudget} user={!!user} builds={builds.filter(b=>b.owner===owner)} onSave={saveBuild} onLoad={b=>{setSelection({...b.selection});setBudget(b.budget);setToast(`Configuración “${b.name}” cargada.`)}} onDelete={id=>{setBuilds(builds.filter(b=>b.id!==id||b.owner!==owner));setToast('Ensamble eliminado.')}}/>}
 {route==='comparison'&&<ComparisonPage items={items} offers={offers}/>}
 {route==='admin'&&(user?<AdminPage items={items} offers={offers} onItems={changeItems} onOffers={setOffers} notify={setToast}/>:<main className="catalog-main catalog-empty"><h1>Panel administrativo demo</h1><p>Inicia sesión para gestionar componentes y ofertas temporales.</p><button onClick={()=>requireLogin('admin')}>Iniciar sesión</button></main>)}
 </div>}{toast&&<div className="hud auth-hud" role="status"><Check size={18}/><div><strong>PCDEX / SISTEMA</strong><p>{toast}</p></div><button aria-label="Cerrar notificación" onClick={()=>setToast('')}><X size={17}/></button></div>}</>
}
