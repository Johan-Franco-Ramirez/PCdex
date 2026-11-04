import { Router, type Request, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/database.js';
import { ApiError } from '../../domain.js';
import { object, text } from '../../validation.js';
import { hashPassword, checkPassword, encrypt, decrypt, newTotp, totpStep } from './crypto.js';
export async function userFor(req: Request) {
    const userId = req.session.userId;
    if (!userId)
        return null;
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }, include: {
            roles: true
        }
    });
    if (!user)
        return null;
    return {
        id: user.id, email: user.email, username: user.username, roles: user.roles.map(x => x.roleName), mfa: req.session.mfa === true
    };
}
export const requireUser: RequestHandler = async (req, _res, next) => {
    if (!await userFor(req))
        throw new ApiError(401, 'Inicia sesión para continuar.');
    next();
};
export const requireAdmin: RequestHandler = async (req, _res, next) => {
    const user = await userFor(req);
    if (!user)
        throw new ApiError(401, 'Inicia sesión para continuar.');
    if (!user.roles.includes('ADMIN') || !user.mfa)
        throw new ApiError(403, 'Se requiere un administrador con segundo factor verificado.');
    next();
};
const regenerate = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
const save = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
function email(value: unknown) {
    const result = text(value, 'email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
        throw new ApiError(400, 'Correo inválido.');
    return result;
}
function password(value: unknown) {
    if (typeof value !== 'string' || value.length < 12 || value.length > 128)
        throw new ApiError(400, 'La contraseña debe tener entre 12 y 128 caracteres.');
    return value;
}
export const auth = Router();
auth.get('/session', async (req, res) => {
    req.session.csrf ??= randomBytes(32).toString('hex');
    res.json({
        success: true, data: {
            user: await userFor(req), csrfToken: req.session.csrf, pendingTotp: !!req.session.pendingUserId && !!req.session.pendingUntil && req.session.pendingUntil > Date.now()
        }
    });
});
auth.use(rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: {
        success: false, error: {
            message: 'Demasiados intentos. Inténtalo más tarde.'
        }
    }
}));
auth.post('/register', async (req, res) => {
    const v = object(req.body);
    if ('roles' in v || 'role' in v)
        throw new ApiError(400, 'El registro público no admite roles.');
    const normalized = email(v.email), username = text(v.username, 'username', 80), pass = password(v.password);
    if (await prisma.user.findUnique({
        where: {
            email: normalized
        }
    }))
        throw new ApiError(409, 'No se pudo registrar la cuenta con esos datos.');
    const user = await prisma.user.create({
        data: {
            email: normalized, username, passwordHash: await hashPassword(pass), roles: {
                create: {
                    role: {
                        connect: {
                            name: 'USER'
                        }
                    }
                }
            }
        }
    });
    await regenerate(req);
    req.session.userId = user.id;
    req.session.csrf = randomBytes(32).toString('hex');
    await save(req);
    res.status(201).json({
        success: true, data: {
            user: await userFor(req), csrfToken: req.session.csrf
        }
    });
});
auth.post('/login', async (req, res) => {
    const v = object(req.body), normalized = email(v.email), pass = password(v.password);
    const user = await prisma.user.findUnique({
        where: {
            email: normalized
        }, include: {
            roles: true
        }
    });
    const fallback = '00000000000000000000000000000000:' + Buffer.alloc(64).toString('hex');
    const valid = await checkPassword(pass, user?.passwordHash ?? fallback);
    if (!user || !valid)
        throw new ApiError(401, 'Correo o contraseña incorrectos.');
    await regenerate(req);
    req.session.csrf = randomBytes(32).toString('hex');
    if (user.roles.some(x => x.roleName === 'ADMIN')) {
        req.session.pendingUserId = user.id;
        req.session.pendingUntil = Date.now() + 5 * 60000;
        await save(req);
        res.json({
            success: true, data: {
                requiresTotp: true, needsSetup: !user.totpEnabled, csrfToken: req.session.csrf
            }
        });
        return;
    }
    req.session.userId = user.id;
    await save(req);
    res.json({
        success: true, data: {
            user: await userFor(req), csrfToken: req.session.csrf
        }
    });
});
async function pending(req: Request) {
    if (!req.session.pendingUserId || !req.session.pendingUntil || req.session.pendingUntil < Date.now())
        throw new ApiError(401, 'Vuelve a iniciar sesión para verificar el segundo factor.');
    const user = await prisma.user.findUnique({
        where: {
            id: req.session.pendingUserId
        }, include: {
            roles: true
        }
    });
    if (!user || !user.roles.some(x => x.roleName === 'ADMIN'))
        throw new ApiError(403, 'Acceso administrativo requerido.');
    return user;
}
auth.post('/totp/setup', async (req, res) => {
    const user = await pending(req);
    if (user.totpEnabled)
        throw new ApiError(409, 'El segundo factor ya está configurado.');
    if (!user.totpSecret) {
        const otp = newTotp(user.email);
        await prisma.user.updateMany({
            where: {
                id: user.id, totpSecret: null, totpEnabled: false
            }, data: {
                totpSecret: encrypt(otp.secret.base32)
            }
        });
    }
    const current = await prisma.user.findUniqueOrThrow({
        where: {
            id: user.id
        }
    });
    const secret = decrypt(current.totpSecret!);
    const otp = newTotp(user.email);
    otp.secret = (await import('otpauth')).Secret.fromBase32(secret);
    res.json({
        success: true, data: {
            secret, uri: otp.toString()
        }
    });
});
auth.post('/totp/verify', async (req, res) => {
    const user = await pending(req);
    if (!user.totpSecret)
        throw new ApiError(400, 'Configura primero el segundo factor.');
    const step = totpStep(decrypt(user.totpSecret), text(object(req.body).code, 'code', 6));
    const result = await prisma.user.updateMany({
        where: {
            id: user.id, lastTotpStep: {
                lt: step
            }
        }, data: {
            lastTotpStep: step, totpEnabled: true
        }
    });
    if (result.count !== 1)
        throw new ApiError(401, 'El código ya fue utilizado; espera el siguiente.');
    await regenerate(req);
    req.session.userId = user.id;
    req.session.mfa = true;
    req.session.csrf = randomBytes(32).toString('hex');
    await save(req);
    res.json({
        success: true, data: {
            user: await userFor(req), csrfToken: req.session.csrf
        }
    });
});
auth.post('/logout', async (req, res) => {
    await new Promise<void>((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
    res.clearCookie('pcdex.sid', {
        path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production'
    });
    res.json({
        success: true, data: {
            loggedOut: true
        }
    });
});
