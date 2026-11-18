import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import { prisma, requiredSecret } from '../../config/database.js';
import { ApiError } from '../../domain.js';

const codeHash = (email: string, code: string) =>
    createHmac('sha256', requiredSecret('EMAIL_CODE_SECRET')).update(`${email}:${code}`).digest('hex');
const invalid = () => new ApiError(400, 'El código no es válido, venció o superó los intentos permitidos.');

export async function requestEmailCode(email: string) {
    const user = process.env.SMTP_USER?.trim(), pass = process.env.SMTP_PASSWORD;
    if (!user || !pass) throw new ApiError(503, 'El envío de correo aún no está configurado.');
    // Comprueba la clave antes de generar o registrar desafíos.
    try { requiredSecret('EMAIL_CODE_SECRET'); }
    catch { throw new ApiError(503, 'La clave de verificación de correo aún no está configurada.'); }
    const now = new Date();
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return;
    const recent = await prisma.emailVerification.findUnique({ where: { email } });
    if (recent && recent.createdAt.getTime() > now.getTime() - 60_000) return;
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const hash = codeHash(email, code), expiresAt = new Date(now.getTime() + 15 * 60_000);
    await prisma.emailVerification.upsert({
        where: { email }, create: { email, codeHash: hash, createdAt: now, expiresAt },
        update: { codeHash: hash, createdAt: now, expiresAt, attempts: 0 }
    });
    const transport = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user, pass }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000
    });
    try {
        await transport.sendMail({
            from: user, to: email, subject: 'Código de verificación de PCdex',
            text: `Tu código de verificación es ${code}. Vence en 15 minutos. No lo compartas.`
        });
    } catch {
        await prisma.emailVerification.deleteMany({ where: { email, codeHash: hash } });
        throw new ApiError(503, 'No fue posible enviar el código. Inténtalo más tarde.');
    } finally { transport.close(); }
}

// El intento se registra fuera de la transacción de alta para que no se revierta si es incorrecto.
export async function reserveEmailCode(email: string, value: unknown) {
    if (typeof value !== 'string' || !/^\d{6}$/.test(value)) throw invalid();
    const now = new Date(), challenge = await prisma.emailVerification.findUnique({ where: { email } });
    if (!challenge || challenge.expiresAt <= now || challenge.attempts >= 5) throw invalid();
    const updated = await prisma.emailVerification.updateMany({
        where: { email, codeHash: challenge.codeHash, expiresAt: { gt: now }, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } }
    });
    if (updated.count !== 1) throw invalid();
    const received = Buffer.from(codeHash(email, value), 'hex'), expected = Buffer.from(challenge.codeHash, 'hex');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw invalid();
    return challenge.codeHash;
}
