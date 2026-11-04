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
    const [salt, hex] = hash.split(':');
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
    const [iv, tag, data] = value.split('.').map(x => Buffer.from(x, 'base64url'));
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
