import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { app } from './app.js';
await prisma.$connect();
const server=app.listen(env.PORT,()=>console.log(`PCdex API escuchando en el puerto ${env.PORT}`));
let stopping=false;
async function shutdown(){if(stopping)return;stopping=true;const timer=setTimeout(()=>process.exit(1),10000);timer.unref();server.close(async()=>{await prisma.$disconnect();clearTimeout(timer);process.exit(0);});}
process.on('SIGTERM',()=>void shutdown());
process.on('SIGINT',()=>void shutdown());
