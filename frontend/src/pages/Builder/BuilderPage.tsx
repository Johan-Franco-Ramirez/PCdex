import { useEffect, useState } from 'react'
import { Check, Save, Trash2 } from 'lucide-react'
import { categories } from '../../data/categories'
import type { Build, CatalogComponent } from '../../types/hardware'
import { buildTotal, diagnose } from '../../services/builder'
import { formatCOP, formatComponentPrice } from '../../services/catalog'
import { validateBuild } from '../../services/api'
export default function BuilderPage({ items, selection, setSelection, budget, setBudget, builds, onSave, onLoad, onDelete, user, apiConnected }: { items:CatalogComponent[]; selection:Build['selection']; setSelection:(value:Build['selection'])=>void; budget:number; setBudget:(value:number)=>void; builds:Build[]; onSave:(name:string)=>void; onLoad:(build:Build)=>void; onDelete:(id:string)=>void; user:boolean; apiConnected:boolean }) {
 const [name,setName]=useState('Mi próximo build')
 const [serverCheck,setServerCheck]=useState<{compatible:boolean;errores:string[];advertencias:string[]}|null>(null)
 const [serverError,setServerError]=useState('')
 const [checking,setChecking]=useState(false)
 const ids=Object.values(selection).filter((id):id is string=>Boolean(id))
 const idsKey=JSON.stringify(ids)
 const complete=ids.length===8&&new Set(ids).size===8
 useEffect(()=>{
  if(!apiConnected||!complete){setServerCheck(null);setServerError('');setChecking(false);return}
  let active=true
  setChecking(true);setServerError('');setServerCheck(null)
  void validateBuild(JSON.parse(idsKey) as string[]).then(result=>{if(active)setServerCheck(result)}).catch(error=>{if(active)setServerError(error instanceof Error?error.message:'No se pudo validar el ensamble.')}).finally(()=>{if(active)setChecking(false)})
  return()=>{active=false}
 },[apiConnected,complete,idsKey])
 const total=buildTotal(selection,items), localChecks=diagnose(selection,items)
 const hasUnknownPrice=items.some(item=>item.priceKnown===false&&ids.includes(item.id))
 const checks=serverCheck?[
  ...(serverCheck.compatible?[{label:'Reglas del servidor',status:'pass' as const,message:'La API confirmó que la configuración cumple las reglas técnicas disponibles.'}]:serverCheck.errores.map((message,index)=>({label:`Compatibilidad ${index+1}`,status:'error' as const,message}))),
  ...serverCheck.advertencias.map((message,index)=>({label:`Advertencia ${index+1}`,status:'warning' as const,message})),
 ]:localChecks
 return <main className="catalog-main"><div className="auth-step"><span/> TERMINAL DE ENSAMBLE</div><h1>Diseña tu próxima máquina<span>.</span></h1><p className="muted">Una pieza por categoría. Puedes explorar sin sesión; accede para guardar varios ensambles.</p><div className="builder-grid"><section className="panel p-6"><h3>Selección de componentes</h3>{categories.map(category=><div className="builder-slot" key={category}><label htmlFor={`slot-${category}`}>{category}</label><select id={`slot-${category}`} value={selection[category]??''} onChange={e=>setSelection({...selection,[category]:e.target.value})}><option value="">Seleccionar componente</option>{items.filter(i=>i.category===category).map(i=><option key={i.id} value={i.id}>{i.name} · {formatComponentPrice(i)}</option>)}</select></div>)}</section><aside className="panel p-6"><h3>Resumen de configuración</h3><label className="module-field">Presupuesto máximo (COP)<input type="number" min="0" step="10000" value={budget||''} onChange={e=>setBudget(Math.max(0,Number(e.target.value)))}/></label><span className="card-price-label">{hasUnknownPrice?"TOTAL PARCIAL":"TOTAL ESTIMADO"}</span><div className="price">{formatCOP(total)}</div>{hasUnknownPrice&&<p className="muted">Hay componentes sin precio; el total no los incluye.</p>}<p className={budget && total>budget?'field-error':'muted'}>{budget ? total>budget ? `Superas tu presupuesto en ${formatCOP(total-budget)}.` : `Disponible: ${formatCOP(budget-total)}` : 'Configura un presupuesto opcional.'}</p><span className="chip amber">{apiConnected?(checking?'VALIDANDO EN SERVIDOR':serverError?'VALIDACIÓN LOCAL · API NO DISPONIBLE':complete?'VALIDACIÓN DEL SERVIDOR':'VALIDACIÓN LOCAL'):'DIAGNÓSTICO LOCAL · API DESCONECTADA'}</span>{serverError&&<p role="alert" className="field-error">{serverError}</p>}<div className="diagnostics">{checks.map(check=><div className={`diagnostic ${check.status}`} key={check.label}><strong>{check.status==='pass'?'PASS':check.status==='error'?'ERROR':'AVISO'} / {check.label}</strong><p>{check.message}</p></div>)}</div><p className="muted">{Object.values(selection).filter(Boolean).length} / 8 categorías seleccionadas. La validación de servidor solo se ejecuta con las ocho piezas.</p><label className="module-field">Nombre del ensamble<input maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><button className="auth-submit" disabled={!name.trim()||!Object.values(selection).some(Boolean)} onClick={()=>onSave(name.trim())}><Save size={16}/>{user?'Guardar nuevo ensamble':'Iniciar sesión y guardar'}</button></aside></div><div className="catalog-results-heading"><h2>Mis ensambles de esta sesión <span>{builds.length}</span></h2></div>{builds.length ? <div className="home-cards">{builds.map(b=><article key={b.id}><Check size={20}/><h3>{b.name}</h3><p>{Object.values(b.selection).filter(Boolean).length} piezas · {formatCOP(buildTotal(b.selection,items))}</p><div className="actions"><button onClick={()=>onLoad(b)}>Cargar configuración</button><button aria-label={`Eliminar ${b.name}`} onClick={()=>onDelete(b.id)}><Trash2 size={16}/></button></div></article>)}</div>:<p className="muted">Aún no hay ensambles guardados para tu cuenta demo en esta sesión.</p>}</main>
}
