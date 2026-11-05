export const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'] as const;
export type Category = typeof categories[number];
export const labels: Record<Category, string> = { cpu: 'Procesadores', gpu: 'Tarjetas gráficas', motherboard: 'Motherboards', ram: 'Memoria RAM', storage: 'Almacenamiento', psu: 'Fuentes de poder', case: 'Gabinetes', cooler: 'Refrigeración' };
export interface Specs {
    cpu: {
        socket?: string;
        cores?: number;
        threads?: number;
        frequencyGHz?: number;
        tdp?: number;
        generation?: string;
    };
    gpu: {
        vramGB?: number;
        memoryType?: string;
        watts?: number;
        lengthMm?: number;
    };
    motherboard: {
        socket?: string;
        chipset?: string;
        supportedGenerations?: string[];
        formFactor?: string;
        memoryType?: string;
        storageInterfaces?: string[];
    };
    ram: {
        memoryType?: string;
        capacityGB?: number;
        frequencyMHz?: number;
        modules?: number;
    };
    storage: {
        type?: string;
        capacityGB?: number;
        interface?: string;
    };
    psu: {
        watts?: number;
        certification?: string;
    };
    case: {
        supportedFormFactors?: string[];
        maxGpuLengthMm?: number;
        maxCoolerHeightMm?: number;
    };
    cooler: {
        type?: string;
        sockets?: string[];
        heightMm?: number;
    };
}
export type Component = {
    [K in Category]: {
        id: string;
        name: string;
        category: K;
        brand: string;
        model: string;
        description: string;
        image?: string;
        estimatedPrice: number | null;
        priceSource: string | null;
        priceReferenceDate: string | null;
        priceKind: 'DEMO' | 'ESTIMATED';
        currency: 'COP';
        active: boolean;
        specs: Specs[K];
    };
}[Category];
export type Status = 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNVERIFIED';
export interface Check {
    rule: string;
    status: Status;
    componentIds: string[];
    message: string;
}
export interface Compatibility {
    status: Status;
    checks: Check[];
    scope: string;
}
export interface Build {
    id: string;
    name: string;
    mode: 'automatic' | 'manual' | 'mixed';
    budget: number;
    profile: Profile;
    componentIds: string[];
    total: number;
    warnings: string[];
    compatibility: Compatibility;
    ownerId: null;
    visibility: 'private';
    createdAt: string;
    updatedAt: string;
}
export const profiles = ['gaming', 'estudio', 'trabajo', 'oficina', 'diseño'] as const;
export type Profile = typeof profiles[number];
export interface Database {
    version: 1;
    components: Component[];
    builds: Build[];
}
export class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
