import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './config/database.js';
await prisma.$connect();
const server = createApp().listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => console.log('PCdex API lista en el puerto ' + (process.env.PORT ?? 3000)));
// Limites para recibir solicitudes; no sustituyen los limites del proxy.
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.on(signal, () => server.close(() => {
        void prisma.$disconnect().then(() => process.exit(0));
    }));
