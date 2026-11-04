import {setTimeout as delay} from 'node:timers/promises';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
const source = process.env.DATABASE_URL;
if (!source)
    throw new Error('DATABASE_URL requerida.');
const name = /database=([^;]+)/i.exec(source)?.[1];
if (!name || !/^pcdex_[A-Za-z0-9_]{1,60}$/.test(name))
    throw new Error('Este inicializador solo crea bases con prefijo pcdex_ y nombres simples. Para otras bases usa tus herramientas de administración.');
const master = new PrismaClient({
    datasourceUrl: source.replace(/database=[^;]+/i, 'database=master')
});
try {
    const deadline=Date.now()+120000;
    while(true){try{await master.$queryRaw`SELECT 1`;break}catch(error){const message=error instanceof Error?error.message:'';if(Date.now()>deadline||!/closed the connection|reach database server|ECONNREFUSED/i.test(message))throw error;console.log('SQL Server sigue iniciando; se reintentará la conexión.');await delay(2000)}}
    const rows = await master.$queryRaw<{
        id: number | null;
    }[]> `SELECT DB_ID(${name}) AS id`;
    if (rows[0]?.id === null) {
        await master.$executeRawUnsafe(`CREATE DATABASE [${name}]`);
        console.log('Base PCdex creada.');
    }
    else
        console.log('Se conserva la base existente.');
}
finally {
    await master.$disconnect();
}
for (const args of [['node_modules/prisma/build/index.js', 'migrate', 'deploy'], ['node_modules/tsx/dist/cli.mjs', 'src/seed.ts']]) {
    const result = spawnSync(process.execPath, args, {
        stdio: 'inherit', env: process.env
    });
    if (result.status !== 0)
        process.exit(result.status ?? 1);
}
