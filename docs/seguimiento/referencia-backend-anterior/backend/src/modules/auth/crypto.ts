import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import * as OTPAuth from 'otpauth';
import { ApiError } from '../../domain.js';
import { requiredSecret } from '../../config/database.js';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const key = await scrypt(password, salt, 64) as Buffer;
    return `${salt}:${key.toString('hex')}`;
}
export async function checkPassword(password: string, hash: string) {
    const parts = hash.split(':');
    if (parts.length !== 2 || !/^[a-f0-9]{32}$/i.test(parts[0] ?? '') || !/^[a-f0-9]{128}$/i.test(parts[1] ?? '')) return false;
    const salt = parts[0]!;
    const hex = parts[1]!;
    const expected = Buffer.from(hex, 'hex');
    const actual = await scrypt(password, salt, 64) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function encrypt(secret: string) {
    const key = createHash('sha256').update(requiredSecret('TOTP_ENCRYPTION_KEY')).digest(), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map(x => x.toString('base64url')).join('.');
}
export function decrypt(value: string) {
    const parts = value.split('.');
    if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error('Secreto cifrado inválido.');
    const iv = Buffer.from(parts[0]!, 'base64url'), tag = Buffer.from(parts[1]!, 'base64url'), data = Buffer.from(parts[2]!, 'base64url');
    if (iv.length !== 12 || tag.length !== 16) throw new Error('Secreto cifrado inválido.');
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(requiredSecret('TOTP_ENCRYPTION_KEY')).digest(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
export function newTotp(email: string) {
    return new OTPAuth.TOTP({
        issuer: 'PCdex', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret: new OTPAuth.Secret({
            size: 20
        })
    });
}
export function totpStep(secret: string, token: string) {
    if (!/^\d{6}$/.test(token))
        throw new ApiError(400, 'Código TOTP inválido.');
    const otp = new OTPAuth.TOTP({
        algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret)
    });
    const timestamp = Date.now(), delta = otp.validate({
        token, timestamp, window: 1
    });
    if (delta === null)
        throw new ApiError(401, 'Código TOTP inválido o caducado.');
    return BigInt(Math.floor(timestamp / 30000) + delta);
}
