import 'dotenv/config';
import { prisma } from './config/database.js';
import { categories, labels } from './domain.js';
/** Registros estructurales; el catálogo se importa de una fuente real por separado. */
export async function seed() {
 for (const id of categories) await prisma.category.upsert({ where:{id}, create:{id,name:labels[id]}, update:{name:labels[id]} });
 for (const name of ['USER','ADMIN']) await prisma.role.upsert({ where:{name}, create:{name}, update:{} });
 return { categories:categories.length, roles:2, componentes_insertados:0 };
}
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
 try { console.log(await seed()); } finally { await prisma.$disconnect(); }
}
