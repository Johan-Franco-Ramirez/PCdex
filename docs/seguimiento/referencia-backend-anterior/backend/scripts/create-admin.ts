import 'dotenv/config';
import { prisma } from '../src/config/database.js';
import { hashPassword } from '../src/modules/auth/crypto.js';
import { seed } from '../src/seed.js';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(), password = process.env.ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password || password.length < 12 || password.length > 128)
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) solo para este comando.');
try {
    await seed();
    if (await prisma.user.findUnique({
        where: {
            email
        }
    }))
        throw new Error('La cuenta ya existe: no se cambian credenciales ni privilegios automáticamente.');
    await prisma.user.create({
        data: {
            email, username: process.env.ADMIN_NAME ?? 'Administrador', passwordHash: await hashPassword(password), roles: {
                create: [{
                        roleName: 'USER'
                    }, {
                        roleName: 'ADMIN'
                    }]
            }
        }
    });
    console.log('Administrador creado. Configura TOTP desde la pantalla de acceso.');
}
finally {
    await prisma.$disconnect();
}
