import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { prisma } from '../src/config/database.js';
import { component, object, id as validateId } from '../src/validation.js';
import { createComponent } from '../src/modules/catalog/catalog.repository.js';
import { saveBuild } from '../src/modules/builds/builds.service.js';
import { seed } from '../src/seed.js';
try {
    const source = process.argv[2];
    if (!source)
        throw new Error('Uso: npm run import:json -- ruta/pcdex.json');
    const data = object(JSON.parse(await readFile(source, 'utf8')));
    await seed();
    if (!Array.isArray(data.components))
        throw new Error('Catálogo JSON inválido.');
    for (const raw of data.components) {
        const v = object(raw), item = component(v, validateId(v.id));
        if (await prisma.component.findUnique({
            where: {
                id: item.id
            }
        })) {
            console.log('Conservado ID existente; revisar conflicto:', item.id);
            continue;
        }
        await createComponent(item);
    }
    if (Array.isArray(data.builds) && data.builds.length) {
        const email = process.env.IMPORT_OWNER_EMAIL?.toLowerCase(), owner = email ? await prisma.user.findUnique({
            where: {
                email
            }
        }) : null;
        if (!owner)
            throw new Error('Los builds JSON sin propietario requieren IMPORT_OWNER_EMAIL de una cuenta existente. No se ha borrado el archivo original.');
        for (const raw of data.builds) {
            const v = object(raw), id = validateId(v.id);
            if (await prisma.pcBuild.findUnique({
                where: {
                    id
                }
            })) {
                console.log('Build ya importado:', id);
                continue;
            }
            const { ownerId: _, visibility: __, ...input } = v;
            await saveBuild(input, owner.id, undefined, id);
        }
    }
    console.log('Importación completada sin modificar el archivo original.');
}
finally {
    await prisma.$disconnect();
}
