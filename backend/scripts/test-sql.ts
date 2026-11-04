import 'dotenv/config';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const source = process.env.DATABASE_URL;
if (!source)
    throw new Error('DATABASE_URL requerida.');
const name = 'pcdex_test_' + randomUUID().replaceAll('-', '');
const url = source.replace(/database=[^;]+/i, `database=${name}`);
if (url === source)
    throw new Error('DATABASE_URL debe incluir database=...');
const master = new PrismaClient({
    datasourceUrl: source.replace(/database=[^;]+/i, 'database=master')
});
try {
    await master.$executeRawUnsafe(`CREATE DATABASE [${name}]`);
}
finally {
    await master.$disconnect();
}
console.log(`Base aislada de pruebas creada: ${name}. Se conserva para inspección; no se borra ninguna base.`);
const env = {
    ...process.env, DATABASE_URL: url, TEST_DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), TOTP_ENCRYPTION_KEY: randomBytes(48).toString('hex'), NODE_ENV: 'test'
};
for (const args of [['node_modules/prisma/build/index.js', 'migrate', 'deploy'], ['node_modules/tsx/dist/cli.mjs', '--test', 'tests/sql.integration.ts']]) {
    const result = spawnSync(process.execPath, args, {
        cwd: process.cwd(), env, stdio: 'inherit'
    });
    if (result.status !== 0)
        process.exit(result.status ?? 1);
}
