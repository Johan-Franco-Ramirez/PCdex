import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const source = process.env.DATABASE_URL;
if (!source?.startsWith('mysql://')) throw new Error('DATABASE_URL debe ser una URL MySQL.');
const prisma = new PrismaClient();
try {
    const database = await prisma.$queryRaw<Array<{ databaseName: string | null }>>`SELECT DATABASE() AS databaseName`;
    const users = await prisma.user.count();
    const builds = await prisma.pcBuild.count();
    console.log(JSON.stringify({ database: database[0]?.databaseName, users, builds }, null, 2));
} finally {
    await prisma.$disconnect();
}
