import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const mysqlPassword = randomBytes(32).toString('hex');
const rootPassword = randomBytes(32).toString('hex');
const sessionSecret = randomBytes(48).toString('hex');
const totpKey = randomBytes(48).toString('hex');
const emailCodeSecret = randomBytes(32).toString('hex');
const contents = [
  'NODE_ENV=development', 'HOST=127.0.0.1', 'PORT=3000',
  'FRONTEND_ORIGIN=http://localhost:5173',
  `DATABASE_URL=mysql://pcdex:${mysqlPassword}@127.0.0.1:3307/pcdex`,
  `DOCKER_DATABASE_URL=mysql://pcdex:${mysqlPassword}@pcdex-db:3306/pcdex`,
  `MYSQL_PASSWORD=${mysqlPassword}`, `MYSQL_ROOT_PASSWORD=${rootPassword}`,
  `SESSION_SECRET=${sessionSecret}`, `TOTP_ENCRYPTION_KEY=${totpKey}`,
  'APP_HOST_PORT=8081', 'APP_ORIGIN=http://localhost:8081', '',
  '# Google OAuth y correo: completar las credenciales localmente.',
  'GOOGLE_CLIENT_ID=', 'GOOGLE_CLIENT_SECRET=',
  'GOOGLE_REDIRECT_URI=http://localhost:8081/api/auth/google/callback',
  'SMTP_USER=', 'SMTP_PASSWORD=', `EMAIL_CODE_SECRET=${emailCodeSecret}`,
  'REQUIRE_EMAIL_VERIFICATION=false', '',
].join('\n');
await writeFile(new URL('../.env.mysql', import.meta.url), contents, { flag: 'wx' });
console.log('Configuración local MySQL creada en backend/.env.mysql. No se muestran credenciales.');
