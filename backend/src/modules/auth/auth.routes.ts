import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Prisma } from '@prisma/client';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors.js';

const scrypt = promisify(scryptCallback);
const COOKIE = 'pcdex_session';
const LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: env.COOKIE_SECURE, path: '/' };
const email = z.string().trim().email().max(191).transform(value => value.toLowerCase());
const loginSchema = z.object({ email, password: z.string().min(8).max(128) }).strict();
const registerSchema = loginSchema.extend({ username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/), password: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/[0-9]/) }).strict();
const publicUser = (user: { nombre:string; email:string; rol:string }) => ({ username:user.nombre, email:user.email, role:user.rol });
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
function readToken(req:Request) {
 const pair = (req.headers.cookie ?? '').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${COOKIE}=`));
 const value = pair?.slice(COOKIE.length + 1);
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
 if(!user || !valid) throw new AppError(401,'CREDENCIALES_INVALIDAS','Correo o contraseña incorrectos.');
 const session=newSession();
 await prisma.sesion.create({data:{usuario_id:user.id,token_hash:session.token_hash,expira_en:session.expira_en}});
 setSession(res,session.token); res.json({user:publicUser(user)});
});
authRouter.get('/sesion', async(req,res)=>{
 const token=readToken(req);
 if(!token) throw new AppError(401,'SIN_SESION','No hay una sesión activa.');
 const session=await prisma.sesion.findUnique({where:{token_hash:digest(token)},include:{usuario:true}});
 if(!session || session.expira_en<=new Date()) { clearSession(res); throw new AppError(401,'SIN_SESION','La sesión ha terminado.'); }
 res.set('Cache-Control','no-store'); res.json({user:publicUser(session.usuario)});
});
authRouter.post('/logout', requireOrigin, async(req,res)=>{
 const token=readToken(req);
 if(token) await prisma.sesion.deleteMany({where:{token_hash:digest(token)}});
 clearSession(res); res.json({ok:true});
});
