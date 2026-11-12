import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Prisma } from '@prisma/client';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors.js';
import { detalleInclude, serializarComponente } from '../catalog/catalog.types.js';

const scrypt = promisify(scryptCallback);
const COOKIE = 'pcdex_session';
const SETUP_COOKIE = 'pcdex_google_setup';
const LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: env.COOKIE_SECURE, path: '/' };
const setupCookieOptions = { ...cookieOptions, path:'/api/auth/perfil' };
const email = z.string().trim().email().max(191).transform(value => value.toLowerCase());
const loginSchema = z.object({ email, password: z.string().min(8).max(128) }).strict();
const registerSchema = loginSchema.extend({ username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/), password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/) }).strict();
const publicUser = (user: { nombre:string; email:string; rol:string; password_hash:string|null }) => ({ username:user.nombre, email:user.email, role:user.rol, hasPassword:!!user.password_hash });
const digest = (value:string) => createHash('sha256').update(value).digest('hex');
async function hashPassword(password:string) {
 const salt = randomBytes(16).toString('hex');
 const key = await scrypt(password, salt, 64) as Buffer;
 return `scrypt:${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password:string, stored:string) {
 const [algorithm,salt,hex] = stored.split(':');
 if (algorithm !== 'scrypt' || !salt || !hex || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hex)) return false;
 const expected = Buffer.from(hex, 'hex');
 const actual = await scrypt(password, salt, expected.length) as Buffer;
 return timingSafeEqual(actual, expected);
}
function readCookie(req:Request,name:string) {
 const pair = (req.headers.cookie ?? '').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${name}=`));
 return pair?.slice(name.length+1);
}
function readToken(req:Request) {
 const value = readCookie(req,COOKIE);
 return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
function requireOrigin(req:Request, _res:Response, next:NextFunction) {
 const origin = req.get('origin');
 const ownOrigin = `${req.protocol}://${req.get('host')}`;
 if ((origin && origin !== ownOrigin && origin !== env.CORS_ORIGIN) || req.get('sec-fetch-site') === 'cross-site') return next(new AppError(403,'ORIGEN_INVALIDO','Origen de solicitud no permitido.'));
 next();
}
const attempts = new Map<string,{count:number;until:number}>();
function limitAttempts(req:Request, _res:Response, next:NextFunction) {
 const now=Date.now();
 for (const [key,value] of attempts) if(value.until<=now) attempts.delete(key);
 const key=req.ip ?? 'unknown';
 const entry=attempts.get(key) ?? {count:0,until:now+60_000};
 if(entry.count>=10) return next(new AppError(429,'DEMASIADOS_INTENTOS','Demasiados intentos. Espera un minuto e inténtalo de nuevo.'));
 entry.count++; attempts.set(key,entry); next();
}
function newSession() { const token=randomBytes(32).toString('hex'); return {token, token_hash:digest(token), expira_en:new Date(Date.now()+LIFETIME_MS)}; }
function setSession(res:Response, token:string) { res.cookie(COOKIE,token,{...cookieOptions,maxAge:LIFETIME_MS}); }
function clearSession(res:Response) { res.clearCookie(COOKIE,cookieOptions); }
async function authenticatedUser(req:Request, res:Response) {
 const token=readToken(req);
 if(!token) throw new AppError(401,'SIN_SESION','No hay una sesión activa.');
 const session=await prisma.sesion.findUnique({where:{token_hash:digest(token)},include:{usuario:true}});
 if(!session || session.expira_en<=new Date()) { clearSession(res); throw new AppError(401,'SIN_SESION','La sesión ha terminado.'); }
 return session.usuario;
}
export const authRouter=Router();
authRouter.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
authRouter.post('/registro', requireOrigin, limitAttempts, async(req,res)=>{
 const data=registerSchema.parse(req.body);
 const password_hash=await hashPassword(data.password);
 const session=newSession();
 try {
  const user=await prisma.usuario.create({data:{nombre:data.username,email:data.email,password_hash,sesiones:{create:{token_hash:session.token_hash,expira_en:session.expira_en}}}});
  setSession(res,session.token); res.status(201).json({user:publicUser(user)});
 } catch(error) {
  if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') throw new AppError(409,'CORREO_REGISTRADO','Este correo ya tiene una cuenta.');
  throw error;
 }
});
authRouter.post('/login', requireOrigin, limitAttempts, async(req,res)=>{
 const data=loginSchema.parse(req.body);
 const user=await prisma.usuario.findUnique({where:{email:data.email}});
 const passwordHash=user?.password_hash ?? await hashPassword('comparacion-invalida-01');
 const valid=await verifyPassword(data.password,passwordHash);
 if(!user || !user.password_hash || !valid) throw new AppError(401,'CREDENCIALES_INVALIDAS','Correo o contraseña incorrectos.');
 const session=newSession();
 await prisma.$transaction(async tx=>{
  const current=await tx.usuario.findUnique({where:{id:user.id},select:{password_hash:true,email:true}});
  if(!current || current.password_hash!==user.password_hash || current.email!==data.email) throw new AppError(401,'CREDENCIALES_INVALIDAS','Correo o contraseña incorrectos.');
  await tx.sesion.create({data:{usuario_id:user.id,token_hash:session.token_hash,expira_en:session.expira_en}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 setSession(res,session.token); res.json({user:publicUser(user)});
});
authRouter.get('/sesion', async(req,res)=>{
 const user=await authenticatedUser(req,res);
 res.json({user:publicUser(user)});
});
authRouter.patch('/perfil',requireOrigin,async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const {username}=z.object({username:z.string().trim().min(2).max(120)}).strict().parse(req.body);
 const updated=await prisma.usuario.update({where:{id:user.id},data:{nombre:username}});
 res.json({user:publicUser(updated)});
});
const currentPasswordSchema=z.string().min(1).max(128);
async function confirmPassword(user:{password_hash:string|null},password:string) {
 if(!user.password_hash) throw new AppError(403,'SIN_CONTRASENA','Tu cuenta usa Google y no tiene una contraseña de PCdex.');
 if(!await verifyPassword(password,user.password_hash)) throw new AppError(401,'CONTRASENA_INCORRECTA','La contraseña actual es incorrecta.');
 return user.password_hash;
}
authRouter.patch('/perfil/correo',requireOrigin,limitAttempts,async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const data=z.object({email,currentPassword:currentPasswordSchema}).strict().parse(req.body);
 const oldHash=await confirmPassword(user,data.currentPassword);
 if(data.email===user.email) throw new AppError(400,'CORREO_SIN_CAMBIOS','El correo es igual al actual.');
 const token=readToken(req);
 if(!token) throw new AppError(401,'SIN_SESION','No hay una sesión activa.');
 try {
  const updated=await prisma.$transaction(async tx=>{
   const session=await tx.sesion.findUnique({where:{token_hash:digest(token)}});
   if(!session || session.usuario_id!==user.id || session.expira_en<=new Date()) throw new AppError(401,'SIN_SESION','La sesión ha terminado.');
   const changed=await tx.usuario.updateMany({where:{id:user.id,password_hash:oldHash,email:user.email},data:{email:data.email}});
   if(changed.count!==1) throw new AppError(409,'CUENTA_ACTUALIZADA','La cuenta cambió. Vuelve a intentarlo.');
   return tx.usuario.findUniqueOrThrow({where:{id:user.id}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  res.json({user:publicUser(updated)});
 } catch(error) {
  if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') throw new AppError(409,'CORREO_REGISTRADO','Este correo ya tiene una cuenta.');
  throw error;
 }
});
authRouter.patch('/perfil/contrasena',requireOrigin,limitAttempts,async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const data=z.object({currentPassword:currentPasswordSchema,newPassword:z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/)}).strict().parse(req.body);
 const oldHash=await confirmPassword(user,data.currentPassword);
 if(data.newPassword===data.currentPassword) throw new AppError(400,'CONTRASENA_SIN_CAMBIOS','La nueva contraseña debe ser distinta.');
 const password_hash=await hashPassword(data.newPassword);
 const token=readToken(req);
 if(!token) throw new AppError(401,'SIN_SESION','No hay una sesión activa.');
 const tokenHash=digest(token);
 await prisma.$transaction(async tx=>{
  const session=await tx.sesion.findUnique({where:{token_hash:tokenHash}});
  if(!session || session.usuario_id!==user.id || session.expira_en<=new Date()) throw new AppError(401,'SIN_SESION','La sesión ha terminado.');
  const changed=await tx.usuario.updateMany({where:{id:user.id,password_hash:oldHash},data:{password_hash}});
  if(changed.count!==1) throw new AppError(409,'CUENTA_ACTUALIZADA','La cuenta cambió. Vuelve a intentarlo.');
  await tx.sesion.deleteMany({where:{usuario_id:user.id,token_hash:{not:tokenHash}}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 res.json({ok:true});
});
authRouter.post('/perfil/contrasena/crear',requireOrigin,limitAttempts,async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const {newPassword}=z.object({newPassword:z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/)}).strict().parse(req.body);
 const proof=readCookie(req,SETUP_COOKIE),token=readToken(req);
 if(!proof || !/^[a-f0-9]{64}$/.test(proof) || !token) throw new AppError(403,'VERIFICACION_REQUERIDA','Confirma tu cuenta con Google antes de crear una contraseña.');
 const password_hash=await hashPassword(newPassword),tokenHash=digest(token);
 const updated=await prisma.$transaction(async tx=>{
  const session=await tx.sesion.findUnique({where:{token_hash:tokenHash}});
  if(!session || session.usuario_id!==user.id || session.expira_en<=new Date()) throw new AppError(401,'SIN_SESION','La sesión ha terminado.');
  const proofUsed=await tx.verificacionGoogle.deleteMany({where:{token_hash:digest(proof),sesion_id:session.id,expira_en:{gt:new Date()}}});
  if(proofUsed.count!==1) throw new AppError(403,'VERIFICACION_REQUERIDA','La verificación ha caducado. Confirma tu cuenta con Google de nuevo.');
  const changed=await tx.usuario.updateMany({where:{id:user.id,password_hash:null,google_sub:{not:null}},data:{password_hash}});
  if(changed.count!==1) throw new AppError(409,'CUENTA_ACTUALIZADA','La cuenta ya tiene contraseña. Actualiza la página.');
  await tx.sesion.deleteMany({where:{usuario_id:user.id,token_hash:{not:tokenHash}}});
  return tx.usuario.findUniqueOrThrow({where:{id:user.id}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 res.clearCookie(SETUP_COOKIE,setupCookieOptions);res.json({user:publicUser(updated)});
});
authRouter.get('/favoritos',async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const favoritos=await prisma.favorito.findMany({where:{usuario_id:user.id},include:{componente:{include:detalleInclude}},orderBy:{creado_en:'desc'}});
 res.json({data:favoritos.map(item=>serializarComponente(item.componente))});
});
authRouter.put('/favoritos/:id',requireOrigin,async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const id=z.string().trim().min(1).max(100).parse(req.params.id);
 if(!await prisma.componente.findUnique({where:{id},select:{id:true}})) throw new AppError(404,'COMPONENTE_NO_ENCONTRADO','No existe el componente solicitado.');
 await prisma.favorito.upsert({where:{usuario_id_componente_id:{usuario_id:user.id,componente_id:id}},create:{usuario_id:user.id,componente_id:id},update:{}});
 res.json({ok:true});
});
authRouter.delete('/favoritos/:id',requireOrigin,async(req,res)=>{
 const user=await authenticatedUser(req,res);
 const id=z.string().trim().min(1).max(100).parse(req.params.id);
 await prisma.favorito.deleteMany({where:{usuario_id:user.id,componente_id:id}});
 res.json({ok:true});
});
authRouter.post('/logout', requireOrigin, async(req,res)=>{
 const token=readToken(req);
 if(token) await prisma.sesion.deleteMany({where:{token_hash:digest(token)}});
 clearSession(res); res.clearCookie(SETUP_COOKIE,setupCookieOptions); res.json({ok:true});
});

const GOOGLE_COOKIE = 'pcdex_google_oauth';
const googleCookieOptions = { ...cookieOptions, path:'/api/auth/google' };
const googleConfigured = () => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const frontend = (fragment:string) => `${env.FRONTEND_URL.replace(/\/$/,'')}/#/${fragment}`;
const googleClient = () => new OAuth2Client({clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET,redirectUri:env.GOOGLE_REDIRECT_URI});
const googleError = (res:Response, code:string) => res.redirect(303,frontend(`login?google_error=${code}`));
authRouter.get('/google', async(req,res)=>{
 if(!googleConfigured()) return googleError(res,'no_configurado');
 const setup=req.query.intent==='crear_contrasena';
 if(setup){
  const user=await authenticatedUser(req,res);
  if(!user.google_sub || user.password_hash) throw new AppError(403,'OPERACION_NO_DISPONIBLE','La cuenta no necesita crear una contraseña.');
 }
 const state=randomBytes(32).toString('hex');
 const nonce=randomBytes(32).toString('hex');
 const verifier=randomBytes(32).toString('base64url');
 const challenge=createHash('sha256').update(verifier).digest('base64url');
 res.cookie(GOOGLE_COOKIE,`${state}.${nonce}.${verifier}.${setup?'setup':'login'}`,{...googleCookieOptions,maxAge:10*60*1000});
 const url=googleClient().generateAuthUrl({response_type:'code',scope:['openid','email','profile'],state,nonce,code_challenge:challenge,code_challenge_method:CodeChallengeMethod.S256,...(setup?{prompt:'login'}:{})});
 return res.redirect(302,url);
});
authRouter.get('/google/callback', async(req,res)=>{
 const raw=(req.headers.cookie??'').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${GOOGLE_COOKIE}=`))?.slice(GOOGLE_COOKIE.length+1);
 res.clearCookie(GOOGLE_COOKIE,googleCookieOptions);
 if(!googleConfigured()) return googleError(res,'no_configurado');
 const [state,nonce,verifier,mode='login']=(raw??'').split('.');
 const failure=(code:string)=>mode==='setup'?res.redirect(303,frontend(`profile?google_setup_error=${code}`)):googleError(res,code);
 if(!state || !nonce || !verifier || !['login','setup'].includes(mode) || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(verifier) || typeof req.query.state!=='string' || req.query.state!==state) return failure('solicitud_invalida');
 if(typeof req.query.code!=='string' || !req.query.code || req.query.code.length>4096) return failure('cancelado');
 try {
  const client=googleClient();
  const {tokens}=await client.getToken({code:req.query.code,codeVerifier:verifier});
  if(!tokens.id_token) return failure('fallo');
  const ticket=await client.verifyIdToken({idToken:tokens.id_token,audience:env.GOOGLE_CLIENT_ID});
  const profile=ticket.getPayload();
  if(!profile || profile.nonce!==nonce || !profile.sub || profile.sub.length>255 || !profile.email || profile.email_verified!==true) return failure('fallo');
  if(mode==='setup'){
   const user=await authenticatedUser(req,res),token=readToken(req);
   if(!token || user.google_sub!==profile.sub || user.password_hash) return failure('cuenta_distinta');
   const proof=randomBytes(32).toString('hex');
   await prisma.$transaction(async tx=>{
    const session=await tx.sesion.findUnique({where:{token_hash:digest(token)}});
    if(!session || session.usuario_id!==user.id || session.expira_en<=new Date()) throw new Error('Sesión terminada.');
    await tx.verificacionGoogle.deleteMany({where:{OR:[{sesion_id:session.id},{expira_en:{lte:new Date()}}]}});
    await tx.verificacionGoogle.create({data:{token_hash:digest(proof),sesion_id:session.id,expira_en:new Date(Date.now()+5*60*1000)}});
   });
   res.cookie(SETUP_COOKIE,proof,{...setupCookieOptions,maxAge:5*60*1000});
   return res.redirect(303,frontend('profile?google_setup=1'));
  }
  const parsedEmail=email.safeParse(profile.email);
  if(!parsedEmail.success) return failure('fallo');
  const session=newSession();
  const existing=await prisma.usuario.findUnique({where:{google_sub:profile.sub}});
  if(existing) {
   await prisma.sesion.create({data:{usuario_id:existing.id,token_hash:session.token_hash,expira_en:session.expira_en}});
  } else {
   if(await prisma.usuario.findUnique({where:{email:parsedEmail.data}})) return googleError(res,'cuenta_existente');
   const name=(profile.name?.trim() || parsedEmail.data.split('@')[0] || 'Usuario').slice(0,120);
   await prisma.usuario.create({data:{nombre:name,email:parsedEmail.data,google_sub:profile.sub,sesiones:{create:{token_hash:session.token_hash,expira_en:session.expira_en}}}});
  }
  setSession(res,session.token);
  return res.redirect(303,frontend('home'));
 } catch(error) {
  if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') return googleError(res,'cuenta_existente');
  console.error('No se pudo completar el acceso con Google.');
  return failure('fallo');
 }
});
