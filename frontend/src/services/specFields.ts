export const specFields:Record<string, Array<[string,string,'number'|'text'|'list']>>={
 cpu:[['socket','Socket','text'],['cores','Núcleos','number'],['threads','Hilos','number'],['frequencyGHz','Frecuencia (GHz)','number'],['tdp','Consumo de referencia (W)','number'],['generation','Generación','text']],
 gpu:[['vramGB','Memoria VRAM (GB)','number'],['memoryType','Tipo de memoria gráfica','text'],['watts','Consumo (W)','number'],['lengthMm','Longitud (mm)','number']],
 motherboard:[['socket','Socket','text'],['chipset','Chipset','text'],['supportedGenerations','Generaciones de CPU admitidas (separadas por coma)','list'],['formFactor','Formato de placa','text'],['memoryType','Tipo de RAM','text'],['storageInterfaces','Interfaces de almacenamiento (separadas por coma)','list']],
 ram:[['memoryType','Tipo de RAM','text'],['capacityGB','Capacidad (GB)','number'],['frequencyMHz','Frecuencia (MHz)','number'],['modules','Número de módulos','number']],
 storage:[['type','Tipo de unidad (SSD / HDD)','text'],['capacityGB','Capacidad (GB)','number'],['interface','Interfaz (NVMe / SATA)','text']],
 psu:[['watts','Potencia (W)','number'],['certification','Certificación','text']],
 case:[['supportedFormFactors','Formatos de placa admitidos (separados por coma)','list'],['maxGpuLengthMm','Longitud máxima de GPU (mm)','number'],['maxCoolerHeightMm','Altura máxima de refrigerador (mm)','number']],
 cooler:[['type','Tipo de refrigeración','text'],['sockets','Sockets admitidos (separados por coma)','list'],['heightMm','Altura (mm)','number']]
}
