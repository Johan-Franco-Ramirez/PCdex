import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

test('perfil y favoritos pertenecen a cada usuario y persisten', {skip:process.env.PCDEX_PROFILE_INTEGRATION!=='1'}, async()=>{
 const {app}=await import('../src/app.js'); const {prisma}=await import('../src/config/prisma.js');
 const unique=randomUUID(); const emails=[`perfil-a-${unique}@example.test`,`perfil-b-${unique}@example.test`]; const componentId=`test-${unique}`; let server:Server|undefined;
 try {
  await prisma.componente.create({data:{id:componentId,nombre:'Componente temporal',marca:'Prueba',categoria:'CPU'}});
  const external=process.env.PCDEX_PROFILE_BASE_URL;
  if(!external)server=await new Promise<Server>(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance))});
  const addr=server?.address();if(!external&&(!addr||typeof addr==='string'))throw Error('Sin puerto de prueba.');const base=external?`${external}/api/auth`:`http://127.0.0.1:${(addr as {port:number}).port}/api/auth`;
  async function call(path:string,method='GET',cookie='',body?:object,origin?:string){return fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),Origin:origin??new URL(base).origin},...(body?{body:JSON.stringify(body)}:{})})}
  async function register(email:string){const response=await call('/registro','POST','',{username:'perfil_test',email,password:'Prueba12345'});assert.equal(response.status,201);const cookie=response.headers.get('set-cookie');assert.ok(cookie);return cookie.split(';')[0]!}
  assert.equal((await call('/favoritos')).status,401);
  const a=await register(emails[0]!);const b=await register(emails[1]!);
  assert.equal((await call('/perfil','PATCH',a,{username:'Nuevo Nombre'})).status,200);
  const profile=await (await call('/sesion','GET',a)).json() as {user:{username:string}};assert.equal(profile.user.username,'Nuevo Nombre');
  assert.equal((await call('/perfil','PATCH',a,{username:'X'})).status,400);
  assert.equal((await call('/perfil','PATCH',a,{username:'Rechazado'},'http://sitio-no-autorizado.test')).status,403);
  const path=`/favoritos/${encodeURIComponent(componentId)}`;
  assert.equal((await call(path,'PUT',a)).status,200);assert.equal((await call(path,'PUT',a)).status,200);
  const fa=await (await call('/favoritos','GET',a)).json() as {data:{id:string}[]};assert.deepEqual(fa.data.map(i=>i.id),[componentId]);
  const fb=await (await call('/favoritos','GET',b)).json() as {data:unknown[]};assert.deepEqual(fb.data,[]);
  assert.equal((await call(path,'DELETE',b)).status,200);assert.equal(await prisma.favorito.count({where:{componente_id:componentId}}),1);
  assert.equal((await call('/favoritos/inexistente','PUT',a)).status,404);
  assert.equal((await call(path,'DELETE',a)).status,200);assert.equal(await prisma.favorito.count({where:{componente_id:componentId}}),0);
 } finally {
  await prisma.usuario.deleteMany({where:{email:{in:emails}}});await prisma.componente.deleteMany({where:{id:componentId}});
  if(server)await new Promise<void>((resolve,reject)=>server!.close(error=>error?reject(error):resolve()));await prisma.$disconnect();
 }
});
