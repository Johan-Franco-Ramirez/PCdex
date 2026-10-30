import { CircuitBoard, Cpu, HardDrive, MemoryStick, Monitor, Zap, Box, Fan } from 'lucide-react'
import type { Category } from '../../types/hardware'
const icons = { Procesadores: Cpu, 'Tarjetas gráficas': Monitor, 'Memoria RAM': MemoryStick, Almacenamiento: HardDrive, 'Fuentes de poder': Zap, Motherboards: CircuitBoard, Gabinetes: Box, Refrigeración: Fan }
export function HardwareArt({ category }: { category: Category }) { const Icon = icons[category]; return <div className={`hardware-art art-${Object.keys(icons).indexOf(category)}`} aria-hidden="true"><div className="art-orbit"/><Icon size={72} strokeWidth={1}/><span>PCDEX / HARDWARE SCAN</span></div> }
