import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { Router, type Request, type Response } from 'express';
import { prisma, frontendOrigin } from '../../config/database.js';
import { hashPassword } from './crypto.js';

export const googleAuth = Router();
const save = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
const regenerate = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
const front = (path: string) => `${frontendOrigin.replace(/\/$/, '')}/#/${path}`;
const fail = (res: Response, code: string) => res.redirect(303, front(`login?google_error=${code}`));

function config() {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (!clientId || !clientSecret || !redirectUri) return null;
    try {
        const uri = new URL(redirectUri);
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(uri.hostname);
        if ((uri.protocol !== 'https:' && !(uri.protocol === 'http:' && local)) ||
            uri.pathname !== '/api/auth/google/callback' || uri.search || uri.hash ||
            uri.username || uri.password) return null;
        return { clientId, clientSecret, redirectUri };
    } catch { return null; }
}

googleAuth.get('/google', async (req, res) => {
    const settings = config();
    if (!settings) return fail(res, 'no_configurado');
    const state = randomBytes(32).toString('hex');
    const nonce = randomBytes(32).toString('hex');
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    req.session.googleOAuth = { state, nonce, verifier, expiresAt: Date.now() + 10 * 60_000 };
    await save(req);
    const client = new OAuth2Client({ clientId: settings.clientId, clientSecret: settings.clientSecret, redirectUri: settings.redirectUri });
    return res.redirect(302, client.generateAuthUrl({
        response_type: 'code', scope: ['openid', 'email', 'profile'], state, nonce,
        code_challenge: challenge, code_challenge_method: CodeChallengeMethod.S256
    }));
});

googleAuth.get('/google/callback', async (req, res) => {
    const settings = config();
    if (!settings) return fail(res, 'no_configurado');
    const attempt = req.session.googleOAuth;
    delete req.session.googleOAuth;
    await save(req);
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!attempt || attempt.expiresAt < Date.now() || !/^[a-f0-9]{64}$/.test(state) ||
        !/^[a-f0-9]{64}$/.test(attempt.state) ||
        !timingSafeEqual(Buffer.from(state, 'hex'), Buffer.from(attempt.state, 'hex')))
        return fail(res, 'solicitud_invalida');
    if (!code || code.length > 4096) return fail(res, 'cancelado');
    try {
        const client = new OAuth2Client({ clientId: settings.clientId, clientSecret: settings.clientSecret, redirectUri: settings.redirectUri });
        const { tokens } = await client.getToken({ code, codeVerifier: attempt.verifier });
        if (!tokens.id_token) return fail(res, 'fallo');
        const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: settings.clientId });
        const profile = ticket.getPayload();
        if (!profile || profile.nonce !== attempt.nonce || !profile.sub || profile.sub.length > 255 ||
            !profile.email || profile.email_verified !== true) return fail(res, 'fallo');
        const email = profile.email.trim().toLowerCase();
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 'fallo');
        const randomPassword = await hashPassword(randomBytes(32).toString('base64url'));
        const user = await prisma.$transaction(async tx => {
            const identity = await tx.googleIdentity.findUnique({
                where: { googleSub: profile.sub }, include: { user: { include: { roles: true } } }
            });
            if (identity) return { user: identity.user, conflict: false };
            if (await tx.user.findUnique({ where: { email } })) return { user: null, conflict: true };
            const name = (profile.name?.trim() || email.split('@')[0] || 'Usuario').slice(0, 80);
            const created = await tx.user.create({
                data: {
                    email, username: name, passwordHash: randomPassword,
                    roles: { create: { role: { connect: { name: 'USER' } } } },
                    googleIdentity: { create: { googleSub: profile.sub } }
                },
                include: { roles: true }
            });
            return { user: created, conflict: false };
        });
        if (user.conflict || !user.user) return fail(res, 'cuenta_existente');
        // No permitir que OAuth omita el segundo factor del administrador.
        if (user.user.roles.some(role => role.roleName === 'ADMIN')) return fail(res, 'admin_requiere_acceso');
        await regenerate(req);
        req.session.userId = user.user.id;
        req.session.csrf = randomBytes(32).toString('hex');
        await save(req);
        return res.redirect(303, front('home'));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            return fail(res, 'cuenta_existente');
        console.error('No se pudo completar el acceso con Google.');
        return fail(res, 'fallo');
    }
});
