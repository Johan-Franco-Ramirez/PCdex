import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
export const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
export function requiredSecret(name: string): string {
    const value = process.env[name];
    if (!value || value.length < 32)
        throw new Error(`${name} debe contener al menos 32 caracteres aleatorios.`);
    return value;
}
