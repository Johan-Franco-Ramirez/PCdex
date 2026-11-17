import { createHmac } from 'node:crypto';
import { env } from '../../config/env.js';

export const hashEmailCode = (email: string, codigo: string) =>
 createHmac('sha256', env.EMAIL_CODE_SECRET).update(`${email}:${codigo}`).digest('hex');

export async function consumeEmailCode(tx: import('@prisma/client').Prisma.TransactionClient, email: string, codigo: string) {
 const now = new Date();
 const challenge = await tx.verificacionCorreo.findFirst({
  where: { email, expira_en: { gt: now }, intentos: { lt: 5 } },
  orderBy: { creado_en: 'desc' },
 });
 if (!challenge) return false;

 // Each submission consumes an attempt even when the supplied code is wrong.
 const attempt = await tx.verificacionCorreo.updateMany({
  where: { token_hash: challenge.token_hash, intentos: { lt: 5 }, expira_en: { gt: now } },
  data: { intentos: { increment: 1 } },
 });
  if (attempt.count !== 1 || challenge.token_hash !== hashEmailCode(email, codigo)) return false;

 const consumed = await tx.verificacionCorreo.deleteMany({
  where: { token_hash: challenge.token_hash, email, expira_en: { gt: now }, intentos: { lte: 5 } },
 });
 return consumed.count === 1;
}
