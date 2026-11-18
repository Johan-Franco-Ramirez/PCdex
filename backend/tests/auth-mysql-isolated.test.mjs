import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

test('registro y Google con MySQL aislado y proveedores simulados', async () => {
  const target = new URL(process.env.DATABASE_URL ?? 'mysql://invalid');
  assert.equal(process.env.PCDEX_AUTH_TEST_ISOLATED, 'yes');
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.port, '33317');
  assert.equal(target.pathname, '/pcdex_oauth_isolated');
  process.env.SESSION_SECRET = 'solo-prueba-secreto-de-sesion-mas-de-32';
  process.env.EMAIL_CODE_SECRET = 'solo-prueba-secreto-de-correo-mas-de-32';
  process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
  process.env.SMTP_USER = 'remitente@example.invalid';
  process.env.SMTP_PASSWORD = 'no-es-una-credencial-real';
  process.env.GOOGLE_CLIENT_ID = 'cliente-de-prueba';
  process.env.GOOGLE_CLIENT_SECRET = 'secreto-de-prueba';
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost:8081/api/auth/google/callback';
  const { prisma } = await import('../src/config/database.ts');
  const { createApp } = await import('../src/app.ts');
  assert.equal(await prisma.user.count({ where: { id: 'preexisting-test-user' } }), 1);
  const original = { transport: nodemailer.createTransport, getToken: OAuth2Client.prototype.getToken, verify: OAuth2Client.prototype.verifyIdToken };
  let sentCode = '', profile = {};
  nodemailer.createTransport = () => ({ sendMail: async ({ text }) => { sentCode = text.match(/\b\d{6}\b/)[0]; }, close() {} });
  OAuth2Client.prototype.getToken = async () => ({ tokens: { id_token: 'falso' } });
  OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => profile });
  const server = createApp().listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const session = async () => {
      const response = await fetch(base + '/api/auth/session');
      return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: (await response.json()).data.csrfToken };
    };
    const s = await session();
    const post = (path, body) => fetch(base + path, {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: s.cookie, 'x-csrf-token': s.csrf },
      body: JSON.stringify(body), redirect: 'manual'
    });
    const previousLogin = await post('/api/auth/login', { email: 'anterior@example.invalid', password: 'Antigua-123456' });
    assert.equal(previousLogin.status, 200);
    const s2 = await session();
    s.cookie = s2.cookie; s.csrf = s2.csrf;
    assert.equal((await post('/api/auth/verification/email', { email: 'prueba@example.invalid' })).status, 202);
    const record = await prisma.emailVerification.findUniqueOrThrow({ where: { email: 'prueba@example.invalid' } });
    assert.notEqual(record.codeHash, sentCode);
    assert.equal((await post('/api/auth/register', {
      email: 'prueba@example.invalid', username: 'Prueba', password: 'Contrasena-12345', codigo: sentCode
    })).status, 201);
    assert.equal(await prisma.emailVerification.count(), 0);
    assert.equal(await prisma.user.count({ where: { email: 'prueba@example.invalid' } }), 1);
    const gs = await session();
    const begin = await fetch(base + '/api/auth/google', { headers: { cookie: gs.cookie }, redirect: 'manual' });
    const url = new URL(begin.headers.get('location'));
    profile = { sub: 'google-sub-prueba', email: 'google@example.invalid', email_verified: true, nonce: url.searchParams.get('nonce') };
    const result = await fetch(base + '/api/auth/google/callback?state=' + url.searchParams.get('state') + '&code=falso', {
      headers: { cookie: gs.cookie }, redirect: 'manual'
    });
    assert.match(result.headers.get('location'), /#\/home$/);
    const identity = await prisma.googleIdentity.findUniqueOrThrow({ where: { googleSub: 'google-sub-prueba' }, include: { user: true } });
    assert.equal(identity.user.email, 'google@example.invalid');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    nodemailer.createTransport = original.transport;
    OAuth2Client.prototype.getToken = original.getToken;
    OAuth2Client.prototype.verifyIdToken = original.verify;
    await prisma.$disconnect();
  }
});
