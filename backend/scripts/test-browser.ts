import 'dotenv/config';
import {randomUUID,randomBytes} from 'node:crypto';
import {spawn,spawnSync,type ChildProcess} from 'node:child_process';
import {createServer as createNetServer} from 'node:net';
import {createServer} from 'node:http';
import {once} from 'node:events';
import path from 'node:path';
import {PrismaClient} from '@prisma/client';

const source=process.env.DATABASE_URL;
if(!source)throw new Error('DATABASE_URL requerida.');
const name='pcdex_test_browser_'+randomUUID().replaceAll('-','');
const url=source.replace(/database=[^;]+/i,`database=${name}`);
if(url===source)throw new Error('La cadena debe incluir database.');
const root=path.resolve('..'),frontend=path.join(root,'frontend');
async function freePort(){const server=createNetServer().listen(0,'127.0.0.1');await once(server,'listening');const port=(server.address() as {port:number}).port;await new Promise<void>(resolve=>server.close(()=>resolve()));return port}
const apiPort=await freePort(),uiPort=await freePort();
const origin=`http://127.0.0.1:${uiPort}`,apiBase=`http://127.0.0.1:${apiPort}`;
const adminEmail='browser-admin@example.invalid',adminPassword=randomBytes(24).toString('base64url');
const env={...process.env,DATABASE_URL:url,TEST_DATABASE_URL:url,SESSION_SECRET:randomBytes(48).toString('hex'),TOTP_ENCRYPTION_KEY:randomBytes(48).toString('hex'),NODE_ENV:'test',PORT:String(apiPort),HOST:'127.0.0.1',FRONTEND_ORIGIN:origin,API_PROXY_TARGET:apiBase,E2E_BASE_URL:origin,E2E_ADMIN_EMAIL:adminEmail,E2E_ADMIN_PASSWORD:adminPassword};
const master=new PrismaClient({datasourceUrl:source.replace(/database=[^;]+/i,'database=master')});
try{await master.$executeRawUnsafe(`CREATE DATABASE [${name}]`)}finally{await master.$disconnect()}
console.log('Base aislada del navegador creada: '+name+'. Se conserva para inspección.');
for(const args of [['node_modules/prisma/build/index.js','migrate','deploy'],['node_modules/tsx/dist/cli.mjs','src/seed.ts']]){const result=spawnSync(process.execPath,args,{env,stdio:'inherit'});if(result.status!==0)process.exit(result.status??1)}
const createdAdmin=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/create-admin.ts'],{env:{...env,ADMIN_EMAIL:adminEmail,ADMIN_PASSWORD:adminPassword,ADMIN_NAME:'Administrador de pruebas'},stdio:'inherit'});
if(createdAdmin.status!==0)process.exit(createdAdmin.status??1);
let backend:ChildProcess|undefined,ui:ChildProcess|undefined;
async function waitReady(target:string,child:ChildProcess){const deadline=Date.now()+60000;while(Date.now()<deadline){if(child.exitCode!==null)throw new Error('El servidor terminó antes de estar disponible.');try{const response=await fetch(target,{signal:AbortSignal.timeout(2000)});if(response.ok)return}catch{}await new Promise(resolve=>setTimeout(resolve,250))}throw new Error('No respondió '+target)}
async function stop(child:ChildProcess|undefined){if(child&&child.exitCode===null&&child.signalCode===null){const exit=once(child,'exit');child.kill();await exit}}
async function startBackend(){backend=spawn(process.execPath,['--import','tsx','src/server.ts'],{env,stdio:'inherit'});await waitReady(apiBase+'/health',backend)}
const nonce=randomBytes(32).toString('hex');let restarting=false;
const control=createServer(async(req,res)=>{if(req.method!=='POST'||req.url!=='/'+nonce){res.writeHead(404).end();return}if(restarting){res.writeHead(409).end();return}restarting=true;try{await stop(backend);await startBackend();console.log('Proceso backend reiniciado con la misma base y las mismas claves.');res.writeHead(200).end('restarted')}catch{res.writeHead(500).end('restart failed')}finally{restarting=false}});
try{
 await startBackend();
 ui=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(uiPort),'--strictPort'],{cwd:frontend,env,stdio:'inherit'});await waitReady(origin,ui);
 control.listen(0,'127.0.0.1');await once(control,'listening');
 const restartUrl=`http://127.0.0.1:${(control.address() as {port:number}).port}/${nonce}`;
 const test=spawn(process.execPath,['node_modules/playwright/cli.js','test'],{cwd:frontend,env:{...env,E2E_RESTART_URL:restartUrl,E2E_ADMIN_TOTP_SECRET:''},stdio:'inherit'});
 const [code]=await once(test,'exit');process.exitCode=Number(code??1);
}finally{await new Promise<void>(resolve=>control.close(()=>resolve()));await stop(ui);await stop(backend)}
