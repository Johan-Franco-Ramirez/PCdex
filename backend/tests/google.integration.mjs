import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

process.env.GOOGLE_CLIENT_ID='fake-client';
process.env.GOOGLE_CLIENT_SECRET='fake-secret';
process.env.GOOGLE_REDIRECT_URI='http://localhost:8081/api/auth/google/callback';
process.env.FRONTEND_URL='http://localhost:8081';

test('Google valida state y nonce, crea sesión y protege cuentas existentes', async()=>{
 const {app}=await import('../src/app.js');
 const {prisma}=await import('../src/config/prisma.js');
 const suffix=randomUUID(); const googleEmail=`google-${suffix}@example.test`; const localEmail=`local-${suffix}@example.test`; const sub=`google-${suffix}`;
 let profile={}; let exchanges=0;
 mock.method(OAuth2Client.prototype,'getToken',async()=>{exchanges++;return {tokens:{id_token:'token-ficticio'}}});
 mock.method(OAuth2Client.prototype,'verifyIdToken',async()=>({getPayload:()=>profile}));
 const server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener))});
 const base=`http://127.0.0.1:${server.address().port}/api/auth`;
 const begin=async(setup=false,session='')=>{const response=await fetch(base+'/google'+(setup?'?intent=crear_contrasena':''),{redirect:'manual',headers:session?{cookie:session}:{}});assert.equal(response.status,302);const location=new URL(response.headers.get('location'));const cookie=response.headers.get('set-cookie').split(';')[0]+(session?`; ${session}`:'');assert.equal(location.searchParams.get('code_challenge_method'),'S256');if(setup)assert.equal(location.searchParams.get('prompt'),'login');return {cookie,state:location.searchParams.get('state'),nonce:location.searchParams.get('nonce')}};
 const callback=({cookie,state})=>fetch(`${base}/google/callback?code=falso&state=${state}`,{redirect:'manual',headers:{cookie}});
 try {
  const invalid=await begin(); const blocked=await callback({...invalid,state:'falso'});assert.match(blocked.headers.get('location'),/solicitud_invalida/);assert.equal(exchanges,0);
  const first=await begin();profile={sub,email:googleEmail,email_verified:true,name:'Prueba Google',nonce:'otro'};
  const wrongNonce=await callback(first);assert.match(wrongNonce.headers.get('location'),/google_error=fallo/);assert.equal(await prisma.usuario.count({where:{email:googleEmail}}),0);
  const second=await begin();profile.nonce=second.nonce;const ok=await callback(second);assert.match(ok.headers.get('location'),/#\/home$/);
  const created=await prisma.usuario.findUnique({where:{email:googleEmail}});assert.ok(created);assert.equal(created.google_sub,sub);assert.equal(created.password_hash,null);
  const setCookie=ok.headers.getSetCookie().find(c=>c.startsWith('pcdex_session='));assert.ok(setCookie);const session=setCookie.split(';')[0];assert.equal((await fetch(base+'/sesion',{headers:{cookie:session}})).status,200);
  const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:googleEmail,password:'comparacion-invalida-01'})});assert.equal(login.status,401);
  const third=await begin();profile.nonce=third.nonce;const repeated=await callback(third);assert.match(repeated.headers.get('location'),/#\/home$/);assert.equal(await prisma.usuario.count({where:{email:googleEmail}}),1);
  const otherSession=repeated.headers.getSetCookie().find(c=>c.startsWith('pcdex_session='))?.split(';')[0];assert.ok(otherSession);
  const mismatch=await begin(true,session);profile={sub:`other-${suffix}`,email:googleEmail,email_verified:true,name:'Otra cuenta',nonce:mismatch.nonce};
  const mismatchResponse=await callback(mismatch);assert.match(mismatchResponse.headers.get('location'),/google_setup_error=cuenta_distinta/);
  const verification=await begin(true,session);profile={sub,email:googleEmail,email_verified:true,name:'Prueba Google',nonce:verification.nonce};
  const verified=await callback(verification);assert.match(verified.headers.get('location'),/google_setup=1/);
  const proof=verified.headers.getSetCookie().find(c=>c.startsWith('pcdex_google_setup='))?.split(';')[0];assert.ok(proof);
  const setup=(cookie)=>fetch(base+'/perfil/contrasena/crear',{method:'POST',headers:{'Content-Type':'application/json',cookie},body:JSON.stringify({newPassword:'NuevaGoogle123'})});
  assert.equal((await setup(`${otherSession}; ${proof}`)).status,403);
  assert.equal((await setup(`${session}; ${proof}`)).status,200);
  assert.equal((await setup(`${session}; ${proof}`)).status,403);
  assert.equal((await fetch(base+'/sesion',{headers:{cookie:otherSession}})).status,401);
  const passwordLogin=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:googleEmail,password:'NuevaGoogle123'})});assert.equal(passwordLogin.status,200);
  await prisma.usuario.create({data:{email:localEmail,nombre:'Existente',password_hash:'local-hash'}});
  const collision=await begin();profile={sub:`other-${suffix}`,email:localEmail,email_verified:true,name:'Otro',nonce:collision.nonce};
  const denied=await callback(collision);assert.match(denied.headers.get('location'),/cuenta_existente/);assert.equal((await prisma.usuario.findUnique({where:{email:localEmail}})).google_sub,null);
 } finally { mock.restoreAll();await prisma.usuario.deleteMany({where:{email:{in:[googleEmail,localEmail]}}});await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));await prisma.$disconnect(); }
});
