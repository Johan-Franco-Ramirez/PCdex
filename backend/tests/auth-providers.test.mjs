import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

test('registro por código y acceso Google con proveedores y base simulados', async () => {
  process.env.SESSION_SECRET = 'solo-prueba-secreto-de-sesion-mas-de-32';
  process.env.EMAIL_CODE_SECRET = 'solo-prueba-secreto-de-correo-mas-de-32';
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
  process.env.SMTP_USER = 'remitente@example.invalid';
  process.env.SMTP_PASSWORD = 'no-es-una-credencial-real';
  process.env.GOOGLE_CLIENT_ID = 'cliente-de-prueba';
  process.env.GOOGLE_CLIENT_SECRET = 'secreto-de-prueba';
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8081/api/auth/google/callback';
  process.env.DATABASE_URL = 'mysql://test:test@127.0.0.1:3306/aislada';
  const { prisma } = await import('../src/config/database.ts');
  const { createApp } = await import('../src/app.ts');
  const original = {
    session: prisma.session, user: prisma.user, emailVerification: prisma.emailVerification,
    transaction: prisma.$transaction, transport: nodemailer.createTransport,
    getToken: OAuth2Client.prototype.getToken, verify: OAuth2Client.prototype.verifyIdToken
  };
  const sessions = new Map(), users = new Map(), challenges = new Map(), identities = new Map();
  let sentCode = '', tokenExchanges = 0, profile = {};
  const matches = (record, where) => !!record &&
    (!where.codeHash || record.codeHash === where.codeHash) &&
    (!where.expiresAt?.gt || record.expiresAt > where.expiresAt.gt) &&
    (where.attempts?.lt === undefined || record.attempts < where.attempts.lt) &&
    (where.attempts?.lte === undefined || record.attempts <= where.attempts.lte);
  const db = {
    user: {
      findUnique: async ({ where }) => where.email ? users.get(where.email) ?? null : [...users.values()].find(u => u.id === where.id) ?? null,
      create: async ({ data }) => {
        if (users.has(data.email)) throw new Error('Correo duplicado de prueba');
        const user = { id: `user-${users.size + 1}`, email: data.email, username: data.username, passwordHash: data.passwordHash, roles: [{ roleName: 'USER' }] };
        users.set(user.email, user);
        if (data.googleIdentity) identities.set(data.googleIdentity.create.googleSub, user);
        return user;
      }
    },
    googleIdentity: { findUnique: async ({ where }) => identities.has(where.googleSub) ? { user: identities.get(where.googleSub) } : null },
    emailVerification: {
      findUnique: async ({ where }) => challenges.get(where.email) ?? null,
      upsert: async ({ where, create, update }) => {
        const previous = challenges.get(where.email);
        const next = previous ? { ...previous, ...update } : { ...create, attempts: 0 };
        challenges.set(where.email, next); return next;
      },
      updateMany: async ({ where }) => {
        const row = challenges.get(where.email);
        if (!matches(row, where)) return { count: 0 };
        row.attempts++; return { count: 1 };
      },
      deleteMany: async ({ where }) => {
        const row = challenges.get(where.email);
        if (!matches(row, where)) return { count: 0 };
        challenges.delete(where.email); return { count: 1 };
      }
    }
  };
  const fakeSession = {
    findUnique: async ({ where }) => sessions.get(where.id) ?? null,
    upsert: async ({ where, create, update }) => {
      const row = sessions.has(where.id) ? { ...sessions.get(where.id), ...update } : create;
      sessions.set(where.id, row); return row;
    },
    deleteMany: async ({ where }) => ({ count: sessions.delete(where.id) ? 1 : 0 }),
    updateMany: async () => ({ count: 1 })
  };
  Object.defineProperty(prisma, 'session', { value: fakeSession, configurable: true });
  Object.defineProperty(prisma, 'user', { value: db.user, configurable: true });
  Object.defineProperty(prisma, 'emailVerification', { value: db.emailVerification, configurable: true });
  Object.defineProperty(prisma, '$transaction', { value: async fn => fn(db), configurable: true });
  nodemailer.createTransport = () => ({ sendMail: async ({ text }) => { sentCode = text.match(/\b\d{6}\b/)[0]; }, close() {} });
  OAuth2Client.prototype.getToken = async () => { tokenExchanges++; return { tokens: { id_token: 'falso' } }; };
  OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => profile });
  const server = createApp().listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const freshSession = async () => {
      const response = await fetch(base + '/api/auth/session');
      return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: (await response.json()).data.csrfToken };
    };
    const post = (path, body, session) => fetch(base + path, {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: session.cookie, 'x-csrf-token': session.csrf },
      body: JSON.stringify(body), redirect: 'manual'
    });
    const session = await freshSession();
    const savedClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    const notConfigured = await fetch(base + '/api/auth/google', { headers: { cookie: session.cookie }, redirect: 'manual' });
    assert.match(notConfigured.headers.get('location'), /no_configurado/);
    process.env.GOOGLE_CLIENT_ID = savedClientId;
    assert.equal((await post('/api/auth/verification/email', { email: 'usuario@example.invalid' }, session)).status, 202);
    assert.match(sentCode, /^\d{6}$/);
    const wrong = sentCode === '000000' ? '000001' : '000000';
    const input = { email: 'usuario@example.invalid', username: 'Usuario', password: 'Contrasena-12345' };
    assert.equal((await post('/api/auth/register', { ...input, codigo: wrong }, session)).status, 400);
    assert.equal(challenges.get(input.email).attempts, 1);
    assert.equal((await post('/api/auth/register', { ...input, codigo: sentCode }, session)).status, 201);
    assert.equal(challenges.has(input.email), false);
    assert.equal(users.size, 1);
    const duplicateSession = await freshSession();
    assert.equal((await post('/api/auth/register', { ...input, codigo: sentCode }, duplicateSession)).status, 409);
    const limitedEmail = 'limite@example.invalid';
    assert.equal((await post('/api/auth/verification/email', { email: limitedEmail }, duplicateSession)).status, 202);
    const incorrect = sentCode === '000000' ? '000001' : '000000';
    const limitedInput = { ...input, email: limitedEmail, codigo: incorrect };
    for (let i = 0; i < 5; i++) assert.equal((await post('/api/auth/register', limitedInput, duplicateSession)).status, 400);
    assert.equal(challenges.get(limitedEmail).attempts, 5);
    assert.equal((await post('/api/auth/register', { ...limitedInput, codigo: sentCode }, duplicateSession)).status, 400);
    assert.equal(users.has(limitedEmail), false);
    const smtpPassword = process.env.SMTP_PASSWORD;
    delete process.env.SMTP_PASSWORD;
    assert.equal((await post('/api/auth/verification/email', { email: 'faltante@example.invalid' }, duplicateSession)).status, 503);
    process.env.SMTP_PASSWORD = smtpPassword;

    const googleSession = await freshSession();
    const begin = async () => {
      const response = await fetch(base + '/api/auth/google', { headers: { cookie: googleSession.cookie }, redirect: 'manual' });
      assert.equal(response.status, 302);
      return new URL(response.headers.get('location'));
    };
    const callback = (state, code = 'falso') => fetch(base + '/api/auth/google/callback?state=' + state + '&code=' + code, {
      headers: { cookie: googleSession.cookie }, redirect: 'manual'
    });
    const invalid = await begin();
    assert.equal(invalid.searchParams.get('code_challenge_method'), 'S256');
    assert.match((await callback('falso')).headers.get('location'), /solicitud_invalida/);
    assert.equal(tokenExchanges, 0);
    const attempt = await begin();
    profile = { sub: 'google-1', email: 'google@example.invalid', email_verified: true, name: 'Google', nonce: 'incorrecto' };
    assert.match((await callback(attempt.searchParams.get('state'))).headers.get('location'), /google_error=fallo/);
    assert.equal(users.size, 1);
    const valid = await begin();
    profile.nonce = valid.searchParams.get('nonce');
    const signedIn = await callback(valid.searchParams.get('state'));
    assert.match(signedIn.headers.get('location'), /#\/home$/);
    assert.equal(identities.get('google-1').email, 'google@example.invalid');
    assert.equal(users.size, 2);
    assert.match((await callback(valid.searchParams.get('state'))).headers.get('location'), /solicitud_invalida/);
    const collisionSession = await freshSession();
    const collisionStart = await fetch(base + '/api/auth/google', { headers: { cookie: collisionSession.cookie }, redirect: 'manual' });
    const collision = new URL(collisionStart.headers.get('location'));
    profile = { sub: 'google-otro', email: input.email, email_verified: true, nonce: collision.searchParams.get('nonce') };
    const rejected = await fetch(base + '/api/auth/google/callback?state=' + collision.searchParams.get('state') + '&code=falso', {
      headers: { cookie: collisionSession.cookie }, redirect: 'manual'
    });
    assert.match(rejected.headers.get('location'), /cuenta_existente/);
    assert.equal(identities.has('google-otro'), false);
    const adminSession = await freshSession();
    const adminStart = await fetch(base + '/api/auth/google', { headers: { cookie: adminSession.cookie }, redirect: 'manual' });
    const adminAttempt = new URL(adminStart.headers.get('location'));
    identities.set('google-admin', { id: 'admin', email: 'admin@example.invalid', roles: [{ roleName: 'ADMIN' }] });
    profile = { sub: 'google-admin', email: 'admin@example.invalid', email_verified: true, nonce: adminAttempt.searchParams.get('nonce') };
    const adminResult = await fetch(base + '/api/auth/google/callback?state=' + adminAttempt.searchParams.get('state') + '&code=falso', {
      headers: { cookie: adminSession.cookie }, redirect: 'manual'
    });
    assert.match(adminResult.headers.get('location'), /admin_requiere_acceso/);
    process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
    const legacySession = await freshSession();
    assert.equal((await post('/api/auth/verification/email', { email: 'antiguo@example.invalid' }, legacySession)).status, 503);
    assert.equal((await post('/api/auth/register', { email: 'antiguo@example.invalid', username: 'Anterior', password: 'Contrasena-12345' }, legacySession)).status, 201);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    for (const key of ['session', 'user', 'emailVerification']) Object.defineProperty(prisma, key, { value: original[key], configurable: true });
    Object.defineProperty(prisma, '$transaction', { value: original.transaction, configurable: true });
    nodemailer.createTransport = original.transport;
    OAuth2Client.prototype.getToken = original.getToken;
    OAuth2Client.prototype.verifyIdToken = original.verify;
  }
});
