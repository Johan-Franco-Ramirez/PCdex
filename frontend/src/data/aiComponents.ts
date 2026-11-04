import type { CatalogComponent } from '../types/hardware'
import type { ChatMessage } from '../types/ai'
export const initialMessages: ChatMessage[] = [{id:'welcome',role:'assistant',content:'Hola, soy PCdex AI. Cuéntame tu presupuesto en pesos colombianos y te ayudaré a armar una PC con nuestro catálogo de prueba. También puedes cambiar y eliminar piezas desde aquí.'}]
// Alternativas ficticias para explorar presupuestos. Todos los precios son simulados.
export const aiComponents: CatalogComponent[] = [
 { id:'MB-INTEL', name:'Motherboard demo B660 DDR4', brand:'PCDex', category:'Motherboards', price:399900, socket:'LGA1700', memory:'DDR4', formFactor:'ATX', summary:'LGA1700 · DDR4 · ATX', badge:'DEMO', specs:[['Socket','LGA1700'],['Memoria','DDR4']] },
 { id:'GPU-DEMO', name:'GPU demo Gaming 8 GB', brand:'PCDex', category:'Tarjetas gráficas', price:899900, watts:130, summary:'8 GB · Gaming de entrada', badge:'DEMO', specs:[['Memoria','8 GB']] },
 { id:'SSD-DEMO', name:'SSD demo NVMe 500 GB', brand:'PCDex', category:'Almacenamiento', price:149900, summary:'500 GB · M.2 NVMe', badge:'DEMO', specs:[['Capacidad','500 GB']] },
]
