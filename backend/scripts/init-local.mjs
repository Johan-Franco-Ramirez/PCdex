import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
const password='Pc!'+randomBytes(24).toString('base64url');
const url=`sqlserver://localhost:1434;database=pcdex_functional;user=sa;password=${password};encrypt=true;trustServerCertificate=true`;
const text=`NODE_ENV=development\nHOST=127.0.0.1\nPORT=3000\nFRONTEND_ORIGIN=http://localhost:5173\nDATABASE_URL=${url}\nDOCKER_DATABASE_URL=${url.replace('localhost:1434','pcdex-db:1433')}\nMSSQL_SA_PASSWORD=${password}\nSESSION_SECRET=${randomBytes(48).toString('base64url')}\nTOTP_ENCRYPTION_KEY=${randomBytes(48).toString('base64url')}\n`;
await writeFile(new URL('../.env.functional',import.meta.url),text,{flag:'wx'});
console.log('Variables locales creadas en backend/.env.functional. No se muestran secretos.');
