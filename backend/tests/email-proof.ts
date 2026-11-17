import { randomInt } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { hashEmailCode } from '../src/modules/auth/email-code.js';

// Simula un código entregado por correo sin depender de Gmail durante las pruebas.
export async function emailProof(prisma: PrismaClient, email: string, expires = Date.now() + 60000) {
 const codigo = randomInt(0,1_000_000).toString().padStart(6,'0');
 await prisma.verificacionCorreo.create({data:{token_hash:hashEmailCode(email,codigo),email,expira_en:new Date(expires)}});
 return codigo;
}
