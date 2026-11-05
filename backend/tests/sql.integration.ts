import type { Compatibility } from '../src/domain.js';
interface TestData {
    csrfToken?: string;
    needsSetup?: boolean;
    secret?: string;
    name: string;
    id: string;
    total: number;
    warnings: string[];
    compatibility: Compatibility;
    changes: string[];
    user: {
        email: string;
    };
    budget: number;
}
interface TestBody {
    data: TestData;
    error?: {
        message: string;
    };
}
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { seed } from '../src/seed.js';
import { hashPassword } from '../src/modules/auth/crypto.js';
import { seedData } from './fixtures.remote.js';
import { createComponent } from '../src/modules/catalog/catalog.repository.js';
import * as OTPAuth from 'otpauth';
if (!process.env.TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL || !process.env.DATABASE_URL.includes('database=pcdex_test_'))
    throw new Error('Ejecuta npm run test:sql para aislar la base de datos.');
test('recorrido SQL Server: sesiones, MFA, catálogo, propiedad, snapshots y reinicio', async () => {
    await seed();
    assert.equal((await seed()).componentes_insertados, 0);
    for (const item of seedData().components) await createComponent(item);
    assert.equal(await prisma.componente.count(), 40);
    await prisma.user.create({
        data: {
            email: 'admin@example.invalid', username: 'Admin', passwordHash: await hashPassword('Admin test password 123!'), roles: {
                create: [{
                        roleName: 'USER'
                    }, {
                        roleName: 'ADMIN'
                    }]
            }
        }
    });
    let server = createApp().listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = () => `http://127.0.0.1:${(server.address() as {
        port: number;
    }).port}`;
    const stop = () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    function client() {
        let cookie = '', csrf = '';
        return {
            async request(route: string, method = 'GET', body?: unknown, token = true, origin = 'http://localhost:5173') {
                const response = await fetch(base() + route, {
                    method, headers: {
                        'Content-Type': 'application/json', Origin: origin, ...(cookie ? {
                            Cookie: cookie
                        } : {}), ...(method !== 'GET' && token ? {
                            'X-CSRF-Token': csrf
                        } : {})
                    }, ...(body === undefined ? {} : {
                        body: JSON.stringify(body)
                    })
                });
                const setCookie = response.headers.get('set-cookie');
                if (setCookie)
                    cookie = setCookie.split(';')[0] ?? '';
                const json = await response.json() as TestBody;
                if (json.data?.csrfToken)
                    csrf = json.data.csrfToken;
                return {
                    status: response.status, json
                };
            }
        };
    }
    const admin = client(), user = client(), other = client(), guest = client();
    try {
        assert.equal((await guest.request('/health')).status, 200);
        const original = await fetch(base() + '/api/componentes/cpu-1');
        assert.equal(original.status, 200);
        const unified = await fetch(base() + '/api/components/cpu-1');
        assert.equal(unified.status, 200);
        const spanish = await original.json() as { data: { nombre: string } };
        const english = await unified.json() as { data: { name: string } };
        assert.equal(spanish.data.nombre, english.data.name);
        for (const c of [admin, user, other, guest])
            await c.request('/api/auth/session');
        assert.equal((await guest.request('/api/builds')).status, 401);
        assert.equal((await guest.request('/api/components', 'POST', {})).status, 401);
        assert.equal((await user.request('/api/auth/register', 'POST', {
            email: 'user@example.invalid', username: 'User', password: 'User test password 123!', role: 'ADMIN'
        })).status, 400);
        assert.equal((await user.request('/api/auth/register', 'POST', {
            email: 'user@example.invalid', username: 'User', password: 'User test password 123!'
        })).status, 201);
        assert.equal((await other.request('/api/auth/register', 'POST', {
            email: 'other@example.invalid', username: 'Other', password: 'Other test password 123!'
        })).status, 201);
        assert.equal((await user.request('/api/components', 'POST', {})).status, 403);
        const login = await admin.request('/api/auth/login', 'POST', {
            email: 'admin@example.invalid', password: 'Admin test password 123!'
        });
        assert.equal(login.json.data.needsSetup, true);
        assert.equal((await admin.request('/api/components', 'POST', {})).status, 401);
        const setup = await admin.request('/api/auth/totp/setup', 'POST', {});
        assert.equal(setup.status, 200);
        const secret = setup.json.data.secret as string;
        const invalid = (await admin.request('/api/auth/totp/verify', 'POST', {
            code: 'abcdef'
        }));
        assert.equal(invalid.status, 400);
        const otp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(secret)
        });
        const token = otp.generate();
        assert.equal((await admin.request('/api/auth/totp/verify', 'POST', {
            code: token
        })).status, 200);
        const demo = seedData().components[0];
        assert.equal((await admin.request('/api/components', 'POST', {
            ...demo, id: 'sql-custom'
        })).status, 201);
        assert.equal((await admin.request('/api/components/sql-custom', 'PUT', {
            ...demo, name: 'Editado por administrador'
        })).status, 200);
        assert.equal((await user.request('/api/components/sql-custom')).json.data.name, 'Editado por administrador');
        const selected = ['cpu-1', 'gpu-1', 'motherboard-1', 'ram-1', 'storage-1', 'psu-1', 'case-1', 'cooler-1'];
        assert.equal((await user.request('/api/compatibility/check', 'POST', {
            componentIds: selected, budget: 1
        })).json.data.compatibility.status, 'COMPATIBLE');
        assert.equal((await user.request('/api/compatibility/check', 'POST', {
            componentIds: ['cpu-4', 'motherboard-1'], budget: 1
        })).json.data.compatibility.status, 'INCOMPATIBLE');
        assert.equal((await user.request('/api/compatibility/check', 'POST', {
            componentIds: [], budget: 1
        })).json.data.compatibility.status, 'UNVERIFIED');
        const input = {
            name: 'Mi configuración privada', mode: 'manual', budget: 1, profile: 'gaming', componentIds: selected
        };
        assert.equal((await user.request('/api/builds', 'POST', {
            ...input, ownerId: 'manipulated'
        })).status, 400);
        assert.equal((await user.request('/api/builds', 'POST', input, false)).status, 403);
        assert.equal((await user.request('/api/builds', 'POST', input, true, 'http://attacker.invalid')).status, 403);
        const saved = await user.request('/api/builds', 'POST', input);
        assert.equal(saved.status, 201);
        const id = saved.json.data.id;
        assert.equal(saved.json.data.total, 3710000);
        assert.ok(saved.json.data.warnings.some((x: string) => x.includes('supera')));
        for (const method of ['GET', 'PUT', 'DELETE'])
            assert.equal((await other.request('/api/builds/' + id, method, method === 'PUT' ? input : undefined)).status, 404);
        const snapshotTotal = saved.json.data.total;
        await admin.request('/api/components/cpu-1', 'PUT', {
            ...demo, estimatedPrice: 900000
        });
        const changed = await user.request('/api/builds/' + id);
        assert.equal(changed.json.data.total, snapshotTotal);
        assert.ok(changed.json.data.changes.length > 0);
        await admin.request('/api/components/cpu-1', 'DELETE');
        assert.equal((await user.request('/api/builds', 'POST', input)).status, 400);
        assert.equal((await user.request('/api/builds/' + id, 'PUT', {
            ...input, budget: 5000000
        })).status, 200);
        await stop();
        server = createApp().listen(0, '127.0.0.1');
        await once(server, 'listening');
        assert.equal((await user.request('/api/auth/session')).json.data.user.email, 'user@example.invalid');
        assert.equal((await user.request('/api/builds/' + id)).json.data.budget, 5000000);
        assert.equal((await admin.request('/api/components/sql-custom')).json.data.name, 'Editado por administrador');
        await admin.request('/api/auth/logout', 'POST', {});
        await admin.request('/api/auth/session');
        await admin.request('/api/auth/login', 'POST', {
            email: 'admin@example.invalid', password: 'Admin test password 123!'
        });
        assert.equal((await admin.request('/api/auth/totp/verify', 'POST', {
            code: token
        })).status, 401);
        await user.request('/api/auth/logout', 'POST', {});
        assert.equal((await user.request('/api/builds')).status, 401);
        await user.request('/api/auth/session');
        assert.equal((await user.request('/api/auth/login', 'POST', {
            email: 'USER@example.invalid', password: 'User test password 123!'
        })).status, 200);
        assert.equal((await user.request('/api/builds/' + id, 'DELETE')).status, 200);
        assert.equal((await user.request('/api/builds/' + id)).status, 404);
    }
    finally {
        await stop();
        await prisma.$disconnect();
    }
});
