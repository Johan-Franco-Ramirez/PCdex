import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, LogOut, X } from 'lucide-react'
import Brand from '../components/layout/Brand'
import AIPage from '../pages/Builder/AIPage'
import { aiComponents, initialMessages } from '../data/aiComponents'
import type { ChatMessage } from '../types/ai'
import HomePage from '../pages/Home/HomePage'
import CatalogPage from '../pages/Catalog/CatalogPage'
import { CatalogDetail } from '../pages/ComponentDetail/CatalogDetail'
import BuilderPage from '../pages/Builder/BuilderPage'
import ComparisonPage from '../pages/Comparison/ComparisonPage'
import AdminPage from '../pages/Admin/AdminPage'
import LoginPage from '../pages/Login/LoginPage'
import RegisterPage from '../pages/Register/RegisterPage'
import ProfilePage from '../pages/Profile/ProfilePage'
import { catalog } from '../data/components'
import { demoOffers } from '../data/demoOffers'
import type { Build, CatalogComponent, DemoOffer } from '../types/hardware'
import type { DemoUser, SavedAction, SavedComponent } from '../types/auth'
import { useToast } from '../hooks/useToast'
import { isAdmin, navigationFor, readRoute, routeForUser, type Route } from './navigation'
import '../pages/Catalog/catalog.css'
import '../pages/ComponentDetail/component-detail.css'
import '../components/layout/modules.css'
import { ApiError, listAllComponents, toCatalogComponent } from '../services/api'
import { getSession, listFavorites, setFavorite, signOut } from '../services/auth'
const emptySaved={favorite:false,added:false}
export default function AppRouter(){
 const [requestedRoute,setRoute]=useState<Route>(readRoute),[user,setUser]=useState<DemoUser|null>(null)
 const [sessionReady,setSessionReady]=useState(false)
 const route=routeForUser(requestedRoute,user),administrator=isAdmin(user)
 const [items,setItems]=useState<CatalogComponent[]>([...catalog,...aiComponents]),[offers,setOffers]=useState<DemoOffer[]>(demoOffers)
 const [apiStatus,setApiStatus]=useState<'connecting'|'connected'|'offline'>('connecting')
 const [selectedId,setSelectedId]=useState(()=>new URLSearchParams(location.hash.split('?')[1]).get('id')??'CPU-0042')
 const [messages,setMessages]=useState<ChatMessage[]>(initialMessages)
 const [category,setCategory]=useState('')
 const [accounts,setAccounts]=useState<Record<string,Record<string,SavedComponent>>>({})
 const [favoritesState,setFavoritesState]=useState<{owner:string;refresh:number;items:CatalogComponent[];status:'ready'|'error';error:string}>({owner:'',refresh:-1,items:[],status:'ready',error:''})
 const [favoritesRefresh,setFavoritesRefresh]=useState(0)
 const favoriteBusy=useRef(new Set<string>())
 const [pending,setPending]=useState<{action:SavedAction;id:string}|null>(null)
 const [resume,setResume]=useState<Route>('home'),[pendingBuild,setPendingBuild]=useState('')
 const [selection,setSelection]=useState<Build['selection']>({}),[budget,setBudget]=useState(10000000),[builds,setBuilds]=useState<Build[]>([])
 const {toast,setToast}=useToast()
 const sessionRevision=useRef(0)
 useEffect(()=>{let active=true; void listAllComponents().then(data=>{if(active){setItems(data.map(toCatalogComponent));setApiStatus('connected')}}).catch(()=>{if(active)setApiStatus('offline')});return()=>{active=false}},[])
 useEffect(()=>{let active=true;const revision=sessionRevision.current;void getSession().then(result=>{if(active&&revision===sessionRevision.current)setUser(result.user)}).catch(error=>{if(active&&revision===sessionRevision.current&&!(error instanceof ApiError&&error.status===401))setToast('No se pudo comprobar la sesión.')}).finally(()=>{if(active&&revision===sessionRevision.current)setSessionReady(true)});return()=>{active=false}},[setToast])
 const owner=user?.email.toLowerCase()??''
 const favorites=favoritesState.owner===owner?favoritesState.items:[]
 const favoritesLoading=favoritesState.owner!==owner||favoritesState.refresh!==favoritesRefresh
 const favoritesReady=!!owner&&!favoritesLoading&&favoritesState.status==='ready'
 const saved:Record<string,SavedComponent>={...(accounts[owner]??{})}
 favorites.forEach(item=>{saved[item.id]={...(saved[item.id]??emptySaved),favorite:true}})
 const selected=items.find(i=>i.id===selectedId)
 useEffect(()=>{let active=true;if(!owner)return;void listFavorites().then(items=>{if(active)setFavoritesState({owner,refresh:favoritesRefresh,items,status:'ready',error:''})}).catch(error=>{if(active)setFavoritesState({owner,refresh:favoritesRefresh,items:[],status:'error',error:error instanceof Error?error.message:'No se pudieron cargar los favoritos.'})});return()=>{active=false}},[owner,favoritesRefresh])
 useEffect(()=>{const listener=()=>{setRoute(readRoute());if(readRoute()==='component')setSelectedId(new URLSearchParams(location.hash.split('?')[1]).get('id')??'CPU-0042')};window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener)},[])
 useEffect(()=>{if(sessionReady&&requestedRoute!==route)window.location.replace(`#/${route}`)},[requestedRoute,route,sessionReady])
 useEffect(()=>{document.title=`PCDex · ${{ai:'PCdex AI',home:'Inicio',catalog:'Catálogo',component:selected?.name??'Ficha',builder:'Constructor',comparison:'Ofertas',admin:'Administración',profile:'Mi perfil',login:'Iniciar sesión',register:'Registro'}[route]}`},[route,selected?.name])
 function navigate(next:Route){setRoute(next);location.hash=next==='component'?`/component?id=${selectedId}`:`/${next}`;window.scrollTo(0,0)}
 function open(id:string){setSelectedId(id);setRoute('component');location.hash=`/component?id=${id}`;window.scrollTo(0,0)}
 function requireLogin(target:Route){setResume(target);navigate('login');setToast('Inicia sesión o regístrate para continuar.')}
 function updateSelection(id:string,add:boolean){const item=items.find(i=>i.id===id);if(item)setSelection(previous=>{const next={...previous};if(add)next[item.category]=id;else if(next[item.category]===id)delete next[item.category];return next})}
 async function saveFavorite(id:string,add:boolean){
  if(!favoritesReady){setToast('Espera a que carguen tus favoritos o vuelve a intentarlo desde tu perfil.');return}
  const key=`${owner}:${id}`;if(favoriteBusy.current.has(key))return;favoriteBusy.current.add(key);const revision=sessionRevision.current
  try{await setFavorite(id,add);if(revision!==sessionRevision.current)return;const item=items.find(i=>i.id===id)??favorites.find(i=>i.id===id);setFavoritesState(previous=>previous.owner!==owner?previous:{...previous,items:add&&item?[item,...previous.items.filter(i=>i.id!==id)]:previous.items.filter(i=>i.id!==id)});setToast(add?'Añadido a favoritos.':'Retirado de favoritos.')}
  catch(error){if(revision===sessionRevision.current)setToast(error instanceof Error?error.message:'No se pudo actualizar favoritos.')}
  finally{favoriteBusy.current.delete(key)}
 }
 function save(action:SavedAction,id=selectedId){if(!user){setPending({action,id});setSelectedId(id);requireLogin('component');return}if(action==='favorite'){void saveFavorite(id,!saved[id]?.favorite);return}const next={...(saved[id]??emptySaved),added:!saved[id]?.added,favorite:false};setAccounts(previous=>({...previous,[owner]:{...(previous[owner]??{}),[id]:next}}));updateSelection(id,next.added);setToast(next.added?'Componente guardado durante esta sesión.':'Componente retirado.')}
 function saveBuild(name:string){if(!user){setPendingBuild(name);requireLogin('builder');return}setBuilds([...builds,{id:crypto.randomUUID(),name,owner,selection:{...selection},budget}]);setToast('Nuevo ensamble guardado durante esta sesión.')}
 function login(profile:DemoUser){sessionRevision.current++;const key=profile.email.toLowerCase();setUser(profile);if(isAdmin(profile)){setPending(null);setPendingBuild('');setResume('home');navigate('admin');setToast(`Bienvenido, ${profile.username}.`);return}if(pending){if(pending.action==='favorite'){const id=pending.id,revision=sessionRevision.current;void setFavorite(id,true).then(()=>{if(revision===sessionRevision.current){setFavoritesRefresh(value=>value+1);setToast('Añadido a favoritos.')}}).catch(error=>{if(revision===sessionRevision.current)setToast(error instanceof Error?error.message:'No se pudo guardar el favorito.')})}else{const previous=accounts[key]??{};setAccounts({...accounts,[key]:{...previous,[pending.id]:{...(previous[pending.id]??emptySaved),added:true}}});updateSelection(pending.id,true);setToast('Sesión iniciada. Componente añadido al ensamble durante esta sesión.')}open(pending.id);setPending(null)}else{if(pendingBuild){setBuilds([...builds,{id:crypto.randomUUID(),name:pendingBuild,owner:key,selection:{...selection},budget}]);setPendingBuild('');setToast('Sesión iniciada. Ensamble guardado durante esta sesión.')}else setToast(`Bienvenido, ${profile.username}.`);navigate(routeForUser(resume,profile))}setResume('home')}
 async function logout(){try{await signOut();sessionRevision.current++;setFavoritesState({owner:'',refresh:-1,items:[],status:'ready',error:''});setUser(null);setSelection({});setPending(null);setPendingBuild('');navigate('home');setToast('Sesión cerrada.')}catch(error){setToast(error instanceof Error?error.message:'No se pudo cerrar la sesión.')}}
 function changeItems(next:CatalogComponent[]){setItems(next);const valid=new Set(next.map(i=>i.id));setSelection(previous=>Object.fromEntries(Object.entries(previous).filter(([,id])=>valid.has(id))));setBuilds(previous=>previous.map(b=>({...b,selection:Object.fromEntries(Object.entries(b.selection).filter(([,id])=>valid.has(id)))})))}
 function catalogAt(value=''){setCategory(value);navigate('catalog')}
 const auth=route==='login'||route==='register'
 const profileRevision=sessionRevision.current
 if(!sessionReady)return <main className="catalog-main" role="status" aria-live="polite"><Brand/><p>Comprobando sesión…</p></main>
 return <>{auth?<div className="auth-shell"><aside className="auth-story"><Brand/><div className="auth-story-content"><div className="auth-step"><span/> PCDEX / ACCESO</div><h2>Conoce cada pieza.<br/>Construye <span>sin límites.</span></h2><p>Accede a tu cuenta para continuar explorando PCdex.</p><div className="auth-core"><div className="core-ring"/><div className="core-chip"><Brand/></div></div></div></aside>{route==='login'?<LoginPage onSuccess={login} navigate={next=>{if(next==='home'){setPending(null);setPendingBuild('');setResume('home')}navigate(next)}}/>:<RegisterPage onSuccess={login} navigate={next=>{if(next==='home'){setPending(null);setPendingBuild('');setResume('home')}navigate(next)}}/>}</div>:<div className="home-shell"><div className="home-header"><button className="brand-link" onClick={()=>navigate('home')} aria-label="PCDex inicio"><Brand/></button><div>{user?<><button className="home-user" onClick={()=>navigate('profile')} aria-label="Abrir mi perfil">{user.username} · Mi perfil</button><button onClick={()=>void logout()}><LogOut size={16}/> Cerrar sesión</button></>:<div className="guest-actions"><button onClick={()=>{setResume(route);navigate('login')}}>Iniciar sesión</button><button onClick={()=>{setResume(route);navigate('register')}}>Registrarse</button></div>}</div></div><nav className="module-nav" aria-label="Navegación principal">{navigationFor(user).map(([value,label])=><a key={value} href={`#/${value}`} aria-current={route===value?'page':undefined} onClick={e=>{e.preventDefault();navigate(value)}}>{label}</a>)}</nav>
 {route!=='admin'&&<p className={`api-connection ${apiStatus}`} role="status">{apiStatus==='connecting'?'Conectando con el backend…':apiStatus==='connected'?'Catálogo conectado al backend':'Backend sin conexión · mostrando catálogo de demostración'}</p>}
 {route==='home'&&<HomePage items={items} saved={saved} onOpen={open} onSave={save} onCatalog={catalogAt} onBuilder={()=>navigate('builder')}/>}
 {route==='catalog'&&<CatalogPage key={category} items={items} initialCategory={category} saved={saved} onOpen={open} onSave={save}/>}
 {route==='component'&&<><div className="catalog-main detail-back"><button className="module-button" onClick={()=>navigate('catalog')}><ArrowLeft size={15}/> Volver al catálogo</button></div>{selected?<CatalogDetail item={selected} saved={saved[selectedId]??emptySaved} onSave={save}/>:<main className="catalog-main"><h1>Componente no encontrado</h1><button className="module-button" onClick={()=>navigate('catalog')}>Ver catálogo</button></main>}</>}
 {route==='ai'&&<AIPage items={items} selection={selection} budget={budget} onSelection={setSelection} onBudget={setBudget} messages={messages} onMessages={setMessages}/>} 
 {route==='builder'&&<BuilderPage items={items} selection={selection} setSelection={setSelection} budget={budget} setBudget={setBudget} user={!!user} apiConnected={apiStatus==='connected'} builds={builds.filter(b=>b.owner===owner)} onSave={saveBuild} onLoad={b=>{setSelection({...b.selection});setBudget(b.budget);setToast(`Configuración “${b.name}” cargada.`)}} onDelete={id=>{setBuilds(builds.filter(b=>b.id!==id||b.owner!==owner));setToast('Ensamble eliminado.')}}/>}
 {route==='comparison'&&<ComparisonPage items={items} offers={offers}/>}
 {route==='profile'&&user&&<ProfilePage user={user} favorites={favorites} saved={saved} loading={favoritesLoading} error={!favoritesLoading?favoritesState.error:''} onRetry={()=>setFavoritesRefresh(value=>value+1)} onUser={updated=>{if(profileRevision!==sessionRevision.current)return;const nextOwner=updated.email.toLowerCase();if(nextOwner!==owner){sessionRevision.current++;setAccounts(previous=>{const copy={...previous};if(copy[owner]){copy[nextOwner]=copy[owner];delete copy[owner]}return copy});setBuilds(previous=>previous.map(build=>build.owner===owner?{...build,owner:nextOwner}:build))}setUser(updated)}} onOpen={open} onSave={save}/>}
 {route==='admin'&&administrator&&<AdminPage items={items} offers={offers} onItems={changeItems} onOffers={setOffers} notify={setToast}/>}
 </div>}{toast&&<div className="hud auth-hud" role="status"><Check size={18}/><div><strong>PCDEX / SISTEMA</strong><p>{toast}</p></div><button aria-label="Cerrar notificación" onClick={()=>setToast('')}><X size={17}/></button></div>}</>
}

