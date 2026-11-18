// Respaldo local: node --env-file=backend/.env.mysql backend/scripts/backup-mysql-local.mjs
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const url = new URL(process.env.DATABASE_URL ?? 'mysql://invalid');
if (url.protocol !== 'mysql:' || url.hostname !== '127.0.0.1' || url.port !== '3307' || url.pathname !== '/pcdex') {
  throw new Error('El respaldo se limita a la base local pcdex en 127.0.0.1:3307.');
}
if (!process.env.MYSQL_ROOT_PASSWORD) throw new Error('Falta MYSQL_ROOT_PASSWORD en el entorno local.');
const executable = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';
if (!existsSync(executable)) throw new Error('No se encontró mysqldump de MySQL Server 8.0.');
const dir = resolve('backups', 'mysql');
mkdirSync(dir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(dir, `pcdex-${timestamp}-${randomUUID()}.sql`);
const dump = spawn(executable, ['--no-defaults', '--host=127.0.0.1', '--port=3307', '--user=root',
  '--single-transaction', '--quick', '--no-tablespaces', '--hex-blob', 'pcdex'],
  { env: { ...process.env, MYSQL_PWD: process.env.MYSQL_ROOT_PASSWORD }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let errorText = '';
dump.stderr.on('data', chunk => { errorText += chunk.toString(); });
const exit = new Promise((resolveExit, reject) => {
  dump.once('error', reject);
  dump.once('close', code => code === 0 ? resolveExit() : reject(new Error(`mysqldump terminó con código ${code}. ${errorText}`)));
});
try {
  await Promise.all([pipeline(dump.stdout, createWriteStream(output, { flags: 'wx' })), exit]);
  if (statSync(output).size === 0) throw new Error('El archivo del respaldo está vacío.');
  console.log(`Respaldo creado: ${output}`);
  console.log('Contiene información privada. Aún falta verificar su restauración en una base aislada.');
} catch (error) {
  console.error(`El respaldo incompleto, si existe, está en: ${output}`);
  throw error;
}
