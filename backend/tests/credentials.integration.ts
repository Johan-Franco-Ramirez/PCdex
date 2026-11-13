import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

test('cambios de correo y contraseña requieren contraseña y mantienen la cuenta', {skip:process.env.PCDEX_CREDENTIALS_INTEGRATION!=='1'}, async()=>{
 const {app}=await import('../src/app.js');const {prisma}=await import('../src/config/prisma.js');
 const suffix=randomUUID();const original=`cuenta-${suffix}@example.test`, replacement=`nueva-${suffix}@example.test`, taken=`usada-${suffix}@example.test`,googleEmail=`google-${suffix}@example.test`;const componentId=`test-${suffix}`;const emails=[original,replacement,taken,googleEmail];let server:Server|undefined;
 try{
  await prisma.componente.create({data:{id:componentId,nombre:'Prueba temporal',marca:'Prueba',categoria:'CPU'}});
  const external=process.env.PCDEX_CREDENTIALS_BASE_URL;
  if(!external)server=await new Promise<Server>(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance))});
  const addr=server?.address();if(!external&&(!addr||typeof addr==='string'))throw Error('Sin puerto de prueba.');const base=external?`${external}/api/auth`:`http://127.0.0.1:${(addr as {port:number}).port}/api/auth`;
  async function call(path:string,method='GET',cookie='',body?:object,origin?:string){return fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),Origin:origin??new URL(base).origin},...(body?{body:JSON.stringify(body)}:{})})}
  const first=await call('/registro','POST','',{username:'cuenta_test',email:original,password:'Original123'});assert.equal(first.status,201);const cookie=first.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
  const user=await prisma.usuario.findUniqueOrThrow({where:{email:original}});await prisma.usuario.create({data:{email:taken,nombre:'Otro',password_hash:user.password_hash}});
  const otherLogin=await call('/login','POST','',{email:original,password:'Original123'});assert.equal(otherLogin.status,200);const otherCookie=otherLogin.headers.get('set-cookie')?.split(';')[0];assert.ok(otherCookie);
  assert.equal((await call('/favoritos/'+componentId,'PUT',cookie)).status,200);
  assert.equal((await call('/perfil/correo','PATCH',cookie,{email:replacement,currentPassword:'incorrecta'})).status,401);
  assert.equal((await call('/perfil/correo','PATCH',cookie,{email:taken,currentPassword:'Original123'})).status,409);
  assert.equal((await call('/perfil/correo','PATCH',cookie,{email:replacement,currentPassword:'Original123'},'http://sitio-no-autorizado.test')).status,403);
  const changed=await call('/perfil/correo','PATCH',cookie,{email:replacement.toUpperCase(),currentPassword:'Original123'});assert.equal(changed.status,200);assert.equal(((await changed.json()) as {user:{email:string}}).user.email,replacement);
  assert.equal((await prisma.usuario.findUnique({where:{id:user.id}}))?.email,replacement);
  const favorites=await (await call('/favoritos','GET',cookie)).json() as {data:{id:string}[]};assert.equal(favorites.data[0]?.id,componentId);
  assert.equal((await call('/perfil/contrasena','PATCH',cookie,{currentPassword:'incorrecta',newPassword:'Nueva12345'})).status,401);
  assert.equal((await call('/perfil/contrasena','PATCH',cookie,{currentPassword:'Original123',newPassword:'Nueva12345'})).status,200);
  assert.equal((await call('/sesion','GET',cookie)).status,200);assert.equal((await call('/sesion','GET',otherCookie)).status,401);
  assert.equal((await call('/login','POST','',{email:replacement,password:'Original123'})).status,401);
  assert.equal((await call('/login','POST','',{email:replacement,password:'Nueva12345'})).status,200);
  const google=await prisma.usuario.create({data:{email:googleEmail,nombre:'Google',google_sub:`test-${suffix}`}});
  const token=randomBytes(32).toString('hex');await prisma.sesion.create({data:{usuario_id:google.id,token_hash:createHash('sha256').update(token).digest('hex'),expira_en:new Date(Date.now()+60000)}});
  const googleCookie=`pcdex_session=${token}`;
  const googleProfile=await (await call('/sesion','GET',googleCookie)).json() as {user:{hasPassword:boolean}};assert.equal(googleProfile.user.hasPassword,false);
  assert.equal((await call('/perfil/correo','PATCH',googleCookie,{email:original,currentPassword:'cualquier123'})).status,403);
 }finally{
  await prisma.usuario.deleteMany({where:{email:{in:emails}}});await prisma.componente.deleteMany({where:{id:componentId}});
  if(server)await new Promise<void>((resolve,reject)=>server!.close(error=>error?reject(error):resolve()));await prisma.$disconnect();
 }
});
