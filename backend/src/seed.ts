import 'dotenv/config';
import {prisma} from './config/database.js';
import {categories,labels} from './domain.js';
import {seedData} from './seed-data.js';
import {createComponent} from './modules/catalog/catalog.repository.js';
export async function seed(){for(const id of categories)await prisma.category.upsert({where:{id},create:{id,name:labels[id]},update:{}});for(const name of ['USER','ADMIN'])await prisma.role.upsert({where:{name},create:{name},update:{}});let added=0;for(const component of seedData().components){if(!await prisma.component.findUnique({where:{id:component.id}})){await createComponent(component);added++}}return {added,total:await prisma.component.count()}}
if(process.argv[1]?.endsWith('seed.ts')||process.argv[1]?.endsWith('seed.js')){try{console.log(await seed())}finally{await prisma.$disconnect()}}
