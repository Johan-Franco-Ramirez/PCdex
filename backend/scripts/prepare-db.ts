import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const source = process.env.DATABASE_URL;
if (!source || !source.startsWith('mysql://'))
    throw new Error('DATABASE_URL debe apuntar a una base MySQL existente.');
// La base se crea por separado; este comando aplica migraciones y datos demo.
for (const args of [['node_modules/prisma/build/index.js', 'migrate', 'deploy'], ['node_modules/tsx/dist/cli.mjs', 'src/seed.ts']]) {
    const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
    if (result.status !== 0) process.exit(result.status ?? 1);
}
