import { CATEGORIAS, esCategoria, relacionPorCategoria, type ComponenteDetallado } from '../catalog/catalog.types.js';
export interface ResultadoCompatibilidad { compatible: boolean; errores: string[]; advertencias: string[] }
export const normalizar = (value: string) => value.trim().toUpperCase().replace(/[\s-]/g,'');
/** Solo reglas deterministas: la IA no interviene en esta decisión. */
export function evaluarComponentes(items: ComponenteDetallado[], ids: readonly string[]): ResultadoCompatibilidad {
 const errores: string[]=[], advertencias: string[]=[];
 if(new Set(ids).size!==ids.length)errores.push('Hay IDs repetidos: selecciona cada componente una sola vez.');
 const presentes=new Set(items.map(i=>i.id));
 for(const id of ids)if(!presentes.has(id))errores.push(`No existe el componente ${id}.`);
 for(const item of items){
  if(!esCategoria(item.categoria)){errores.push(`Categoría no admitida en ${item.id}.`);continue;}
  const relations=Object.values(relacionPorCategoria).filter(key=>item[key]!==null);
  if(relations.length!==1 || item[relacionPorCategoria[item.categoria]]===null)errores.push(`La ficha técnica de ${item.id} no corresponde a su categoría.`);
 }
 for(const category of CATEGORIAS){const n=items.filter(i=>i.categoria===category).length;if(n===0)errores.push(`Falta un componente de la categoría ${category}.`);if(n>1)errores.push(`Solo se admite un componente por categoría: ${category}.`);}
 const cpu=items.find(i=>i.categoria==='CPU')?.procesador;
 const mb=items.find(i=>i.categoria==='MOTHERBOARD')?.placaMadre;
 const ram=items.find(i=>i.categoria==='RAM')?.memoriaRAM;
 const gpu=items.find(i=>i.categoria==='GPU')?.tarjetaGrafica;
 const psu=items.find(i=>i.categoria==='PSU')?.fuentePoder;
 const cooler=items.find(i=>i.categoria==='COOLER')?.refrigeracion;
 if(cpu&&mb&&normalizar(cpu.socket)!==normalizar(mb.socket))errores.push(`Socket incompatible: CPU ${cpu.socket}, motherboard ${mb.socket}.`);
 if(mb&&ram&&normalizar(mb.tipo_ram)!==normalizar(ram.tipo))errores.push(`RAM incompatible: motherboard ${mb.tipo_ram}, memoria ${ram.tipo}.`);
 if(cpu&&(!cpu.socket.trim()||cpu.nucleos<=0||cpu.tdp<=0))errores.push('La CPU tiene datos técnicos inválidos.');
 if(gpu&&(gpu.tdp<=0||gpu.vram.lte(0)))errores.push('La GPU tiene TDP o VRAM inválidos.');
 if(mb&&(!mb.socket.trim()||!mb.tipo_ram.trim()||!mb.formato.trim()))errores.push('La motherboard tiene datos técnicos incompletos.');
 if(ram&&(!ram.tipo.trim()||ram.capacidad<=0))errores.push('La memoria tiene datos técnicos inválidos.');
 if(psu&&psu.vatios<=0)errores.push('La fuente debe tener una potencia positiva.');
 if(cpu&&gpu&&psu){
  const consumo=cpu.tdp+gpu.tdp+100;
  // Multiplicación entera: consumo <= 80% de la fuente, sin redondeo permisivo.
  if(consumo*5>psu.vatios*4)errores.push(`Fuente insuficiente: CPU + GPU + 100 W = ${consumo} W; límite al 80% = ${psu.vatios*0.8} W.`);
 }
 if(cooler&&cpu){if(cooler.tdp_soportado===null)advertencias.push('No se conoce el TDP soportado por la refrigeración.');else if(cooler.tdp_soportado<cpu.tdp)errores.push('La refrigeración no soporta el TDP declarado del procesador.');}
 if(items.some(i=>i.precio===null))advertencias.push('Hay componentes sin cotización: no es posible calcular un precio total completo.');
 advertencias.push('La compatibilidad se limita a las reglas declaradas: comprueba BIOS, formatos admitidos, dimensiones y conectores con el fabricante. El esquema mínimo no almacena todos esos datos.');
 return {compatible:errores.length===0,errores,advertencias};
}
