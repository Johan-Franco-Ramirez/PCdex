import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

test('registro, sesión, credenciales y cierre con MySQL', {skip:process.env.PCDEX_AUTH_INTEGRATION !== '1'}, async()=>{
 const {app}=await import('../src/app.js');
 const {prisma}=await import('../src/config/prisma.js');
 const email=`pcdex-test-${randomUUID()}@example.test`;
 const password='PruebaSegura123';
 let server:Server|undefined;
 try {
  const external=process.env.PCDEX_AUTH_BASE_URL;
  if(!external) server=await new Promise<Server>(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
  const address=server?.address(); if(!external && (!address || typeof address==='string')) throw Error('No se pudo abrir el puerto.');
  const base=external ? `${external}/api/auth` : `http://127.0.0.1:${(address as {port:number}).port}/api/auth`;
  const post=(path:string,body:object,extra:Record<string,string>={})=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(base).origin,...extra},body:JSON.stringify(body)});
  const created=await post('/registro',{username:'prueba_pc',email,password});
  assert.equal(created.status,201);
  const cookie=created.headers.get('set-cookie'); assert.ok(cookie); assert.match(cookie,/HttpOnly/i); assert.match(cookie,/SameSite=Lax/i);
  const token=cookie.split(';')[0]; assert.ok(token);
  const saved=await prisma.usuario.findUnique({where:{email},include:{sesiones:true}}); assert.ok(saved);
  assert.ok(saved.password_hash); assert.notEqual(saved.password_hash,password); assert.match(saved.password_hash,/^scrypt:/); assert.equal(saved.sesiones.length,1); assert.ok(!cookie.includes(saved.sesiones[0]!.token_hash));
  assert.equal((await fetch(base+'/sesion',{headers:{Cookie:token}})).status,200);
  assert.equal((await post('/registro',{username:'prueba_pc',email,password})).status,409);
  assert.equal((await post('/login',{email,password:'Incorrecta123'})).status,401);
  assert.equal((await post('/login',{email,password},{Origin:'http://sitio-no-autorizado.test'})).status,403);
  assert.equal((await post('/logout',{}, {Cookie:token})).status,200);
  assert.equal((await fetch(base+'/sesion',{headers:{Cookie:token}})).status,401);
  const loggedIn=await post('/login',{email,password}); assert.equal(loggedIn.status,200);
  const secondCookie=loggedIn.headers.get('set-cookie'); assert.ok(secondCookie);
  assert.equal((await fetch(base+'/sesion',{headers:{Cookie:secondCookie.split(';')[0]!}})).status,200);
 } finally {
  await prisma.usuario.deleteMany({where:{email}});
  if(server) await new Promise<void>((resolve,reject)=>server!.close(error=>error?reject(error):resolve()));
  await prisma.$disconnect();
 }
});
