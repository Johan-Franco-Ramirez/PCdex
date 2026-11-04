import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import type { AIContext, ChatMessage } from '../../types/ai'
import type { Build } from '../../types/hardware'
import { aiService } from '../../services/aiService'
import AIBuildPanel from '../../components/builder/AIBuildPanel'
import { initialMessages } from '../../data/aiComponents'
import './ai.css'
export default function AIPage({items,selection,budget,onSelection,onBudget,messages,onMessages}: AIContext & {onSelection:(value:Build['selection'])=>void;onBudget:(value:number)=>void;messages:ChatMessage[];onMessages:(value:ChatMessage[])=>void}) {
 const [input,setInput]=useState(''),[busy,setBusy]=useState(false)
 const end=useRef<HTMLDivElement>(null),locked=useRef(false),active=useRef(true)
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[])
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'})},[messages,busy])
 async function send(text:string) {
  if(!text.trim()||locked.current)return
  locked.current=true;setBusy(true);setInput('')
  const next=[...messages,{id:crypto.randomUUID(),role:'user' as const,content:text.trim()}];onMessages(next)
  try {
   const reply=await aiService.reply(text,{items,selection,budget})
   if(!active.current)return
   if(reply.selection)onSelection(reply.selection)
   if(reply.budget!==undefined)onBudget(reply.budget)
   onMessages([...next,{id:crypto.randomUUID(),role:'assistant',content:reply.content}])
  } catch {if(active.current)onMessages([...next,{id:crypto.randomUUID(),role:'assistant',content:'No pude procesar esa solicitud. Inténtalo de nuevo; tu configuración sigue disponible.'}])}
  finally {locked.current=false;if(active.current)setBusy(false)}
 }
 return <main className="catalog-main"><div className="auth-step"><span/> ASISTENTE DE ENSAMBLE / MODO DEMO</div><h1>Tu próxima PC empieza <span>con una idea.</span></h1><p className="muted">Conversa, explora y ajusta cada pieza. Todo funciona localmente con datos simulados.</p><div className="ai-grid"><section className="panel ai-chat"><header className="ai-section-title"><div><Bot size={22}/><h2>PCdex AI</h2></div><button className="module-button" disabled={busy} onClick={()=>onMessages(initialMessages)}>Nuevo chat</button></header><div className="ai-messages" role="log" aria-label="Conversación con PCdex AI" aria-live="polite">{messages.map(m=><article className={`ai-message ${m.role}`} key={m.id}><small>{m.role==='assistant'?'PCDEX AI · SIMULADO':'TÚ'}</small><p>{m.content}</p></article>)}{busy&&<p role="status" className="muted">Preparando respuesta…</p>}<div ref={end}/></div><div className="ai-prompts">{['Arma un PC con presupuesto de 4 millones','Cambia la gráfica por una más barata','Consulta el presupuesto','Verifica compatibilidad'].map(prompt=><button key={prompt} disabled={busy} onClick={()=>void send(prompt)}><Sparkles size={12}/>{prompt}</button>)}</div><form className="ai-compose" onSubmit={e=>{e.preventDefault();void send(input)}}><label className="sr-only" htmlFor="ai-message">Mensaje para PCdex AI</label><textarea id="ai-message" rows={2} maxLength={1500} placeholder="Ej.: cambia el procesador por Intel…" value={input} disabled={busy} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send(input)}}}/><button type="submit" className="module-button" disabled={busy||!input.trim()} aria-label="Enviar mensaje"><Send size={18}/></button></form><p className="ai-footnote">Asistente simulado · Sin conexión a servicios externos · Shift + Enter para un salto</p></section><AIBuildPanel items={items} selection={selection} budget={budget} onSelection={onSelection} onBudget={onBudget} disabled={busy}/></div></main>
}
