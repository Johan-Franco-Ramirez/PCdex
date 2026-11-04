import type {CatalogComponent,Category} from '../types/hardware'
export interface AuthUser {id:string;username:string;email:string;roles:string[];mfa:boolean}
export interface ApiComponent {id:string;name:string;brand:string;model:string;category:string;description:string;image?:string;estimatedPrice:number|null;priceSource:string|null;priceReferenceDate:string|null;priceKind:'DEMO'|'ESTIMATED';currency:'COP';active:boolean;specs:Record<string,string|number|string[]>}
export interface Compatibility {status:'COMPATIBLE'|'INCOMPATIBLE'|'UNVERIFIED';scope:string;checks:{rule:string;status:string;componentIds:string[];message:string}[]}
export interface Evaluation {total:number;warnings:string[];compatibility:Compatibility}
export interface ApiBuild extends Evaluation {id:string;name:string;mode:string;budget:number;profile:string;componentIds:string[];components:ApiComponent[];changes:string[];draft:boolean;updatedAt:string}
export const names:Record<string,Category>={cpu:'Procesadores',gpu:'Tarjetas gráficas',motherboard:'Motherboards',ram:'Memoria RAM',storage:'Almacenamiento',psu:'Fuentes de poder',case:'Gabinetes',cooler:'Refrigeración'}
let csrfToken=''
let initializing:Promise<SessionResponse>|undefined
interface SessionResponse {user:AuthUser|null;csrfToken:string;pendingTotp?:boolean}
export async function api<T>(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T>{
 if(method!=='GET'&&!csrfToken)await session()
 const response=await fetch(`${import.meta.env.VITE_API_URL??''}${path}`,{method,credentials:'include',headers:{'Content-Type':'application/json',...(method!=='GET'?{'X-CSRF-Token':csrfToken}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal})
 const result=await response.json() as {data:T;error?:{message:string}}
 if(!response.ok)throw new Error(result.error?.message??'No se pudo completar la operación.')
 const data=result.data
 if(data&&typeof data==='object'&&'csrfToken'in data&&typeof data.csrfToken==='string')csrfToken=data.csrfToken
 return data
}
export function session():Promise<SessionResponse>{initializing??=api<SessionResponse>('/api/auth/session').finally(()=>{initializing=undefined});return initializing}
export async function logout(){await api('/api/auth/logout','POST',{});csrfToken=''}
export function toCatalog(item:ApiComponent):CatalogComponent{return {id:item.id,name:item.name,brand:item.brand,category:names[item.category],price:item.estimatedPrice??0,priceMissing:item.estimatedPrice===null,summary:item.description,badge:item.estimatedPrice===null?'PRECIO NO DISPONIBLE':item.priceKind==='DEMO'?'PRECIO DEMO':'PRECIO ESTIMADO',specs:Object.entries(item.specs).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):String(v)]),socket:typeof item.specs.socket==='string'?item.specs.socket:Array.isArray(item.specs.sockets)?item.specs.sockets.join(','):undefined,memory:typeof item.specs.memoryType==='string'?item.specs.memoryType:undefined,formFactor:typeof item.specs.formFactor==='string'?item.specs.formFactor:undefined,generation:typeof item.specs.generation==='string'?item.specs.generation:undefined,watts:item.category==='psu'?undefined:Number(item.specs.watts??item.specs.tdp??0),capacity:item.category==='psu'?Number(item.specs.watts):undefined}}
export async function loadApiCatalog(signal?:AbortSignal):Promise<CatalogComponent[]>{const all:ApiComponent[]=[];let page=1;while(true){const batch=await api<ApiComponent[]>(`/api/components?limit=100&page=${page++}`,'GET',undefined,signal);all.push(...batch);if(batch.length<100)break}return all.map(toCatalog)}
