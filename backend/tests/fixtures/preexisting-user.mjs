import assert from 'node:assert/strict';
const target = new URL(process.env.DATABASE_URL ?? 'mysql://invalid');
assert.equal(process.env.PCDEX_AUTH_TEST_ISOLATED, 'yes');
assert.equal(target.hostname, '127.0.0.1');
assert.equal(target.port, '33317');
assert.equal(target.pathname, '/pcdex_oauth_isolated');
const { prisma } = await import('../../src/config/database.ts');
const { hashPassword } = await import('../../src/modules/auth/crypto.ts');
try {
  await prisma.role.create({ data: { name: 'USER' } });
  await prisma.user.create({ data: {
    id: 'preexisting-test-user', email: 'anterior@example.invalid', username: 'Cuenta anterior',
    passwordHash: await hashPassword('Antigua-123456'),
    roles: { create: { role: { connect: { name: 'USER' } } } }
  } });
  console.log('Cuenta ficticia anterior creada únicamente en la base aislada.');
} finally { await prisma.$disconnect(); }
