import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { seedData } from '../src/seed-data.js';
import { categories, type Component } from '../src/domain.js';
import { evaluarBuild } from '../src/modules/compatibility/compatibility.service.js';
import { catalogResponse } from '../src/modules/catalog/catalog.presenter.js';

const selection = ['cpu-1', 'gpu-1', 'motherboard-1', 'ram-1', 'storage-1', 'psu-1', 'case-1', 'cooler-1'];
const selected = () => seedData().components.filter(x => selection.includes(x.id));

test('los enlaces codifican el nombre y no alteran los datos guardados', () => {
    const original = { ...seedData().components[0], name: 'CPU X & Y / 100%' };
    const response = catalogResponse(original);
    assert.equal(new URL(response.links_tiendas.amazon).searchParams.get('k'), original.name);
    assert.equal(decodeURIComponent(new URL(response.links_tiendas.mercadolibre).pathname.slice(1)), original.name);
    assert.equal('links_tiendas' in original, false);
});

test('reglas: límite de potencia, errores y datos incompletos', () => {
    const items = selected();
    assert.equal(evaluarBuild(items).compatible, true);
    const cpu = items.find(x => x.category === 'cpu')!;
    const gpu = items.find(x => x.category === 'gpu')!;
    const psu = items.find(x => x.category === 'psu')!;
    const required = (cpu.specs.tdp! + gpu.specs.watts! + 100) / 0.8;
    psu.specs.watts = required;
    assert.equal(evaluarBuild(items).compatible, true);
    psu.specs.watts = required - 1;
    assert.ok(evaluarBuild(items).errores.some(e => e.includes('80 %')));
    psu.specs.watts = required;
    cpu.specs.socket = 'socket-incompatible';
    assert.equal(evaluarBuild(items).compatible, false);
    assert.ok(evaluarBuild(items).errores.length);
    cpu.specs.socket = 'AM5';
    const ram = items.find(x => x.category === 'ram')!;
    ram.specs.memoryType = 'DDR4';
    assert.ok(evaluarBuild(items).errores.some(e => e.includes('RAM')));
    assert.equal(evaluarBuild([]).compatible, false);
    assert.ok(evaluarBuild([]).advertencias.length);
    assert.equal(evaluarBuild([...items, cpu]).compatible, false);
});

function asRow(item: Component) {
    const details = Object.fromEntries(Object.entries(item.specs).map(([k, v]) => [k, Array.isArray(v) ? JSON.stringify(v) : v]));
    return { ...item, ...Object.fromEntries(categories.map(c => [c, c === item.category ? { componentId: item.id, ...details } : null])) };
}

test('endpoints v1: consultas, CSRF y generación con Prisma simulado', async () => {
    process.env.SESSION_SECRET = 'solo-para-pruebas-una-clave-de-mas-de-32-caracteres';
    const rows = seedData().components.map(asRow);
    rows[0].image = 'https://example.test/componente.png';
    const sessions = new Map<string, { id: string; data: string; expiresAt: Date }>();
    const originalComponent = prisma.component;
    const originalSession = prisma.session;
    const fakeComponent = {
    findMany: async (args: any) => rows.filter(row => {
        const where = args.where ?? {};
        return (where.active === undefined || row.active === where.active)
            && (!where.category || row.category === where.category)
            && (!where.id?.in || where.id.in.includes(row.id))
            && (!where.name?.contains || row.name.includes(where.name.contains))
            && (!where.estimatedPrice || (row.estimatedPrice !== null && row.estimatedPrice <= where.estimatedPrice.lte));
    }).slice(0, args.take),
    findFirst: async (args: any) => rows.find(row => row.id === args.where.id && row.active === args.where.active) ?? null,
    findUnique: async (args: any) => rows.find(row => row.id === args.where.id) ?? null
    };
    const fakeSession = {
        findUnique: async (args: any) => sessions.get(args.where.id) ?? null,
        upsert: async (args: any) => { sessions.set(args.where.id, { id: args.where.id, ...args.update }); return sessions.get(args.where.id); },
        updateMany: async () => ({ count: 1 })
    };
    Object.defineProperty(prisma, 'component', { value: fakeComponent, configurable: true });
    Object.defineProperty(prisma, 'session', { value: fakeSession, configurable: true });
    const server = createApp().listen(0, '127.0.0.1');
    try {
        await once(server, 'listening');
        const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const list = await fetch(`${base}/api/v1/components?category=cpu&q=Ryzen`);
        assert.equal(list.status, 200);
        const result: any = await list.json();
        assert.ok(result.data.length > 0 && result.data.every((x: Component) => x.category === 'cpu' && x.name.includes('Ryzen')));
        const detail = await fetch(`${base}/api/v1/components/cpu-1`);
        assert.equal(detail.status, 200);
        const item: any = (await detail.json() as any).data;
        assert.equal(item.image, 'https://example.test/componente.png');
        assert.equal(new URL(item.links_tiendas.amazon).searchParams.get('k'), item.name);
        assert.equal(decodeURIComponent(new URL(item.links_tiendas.mercadolibre).pathname.slice(1)), item.name);
        const withoutImage: any = await (await fetch(`${base}/api/v1/components/cpu-2`)).json();
        assert.equal(withoutImage.data.image, null);
        const oldList = await fetch(`${base}/api/components`);
        const oldItem: any = (await oldList.json() as any).data.find((x: Component) => x.id === 'cpu-1');
        assert.deepEqual(oldItem.links_tiendas, item.links_tiendas);
        assert.equal(oldItem.image, item.image);
        const oldDetail = await fetch(`${base}/api/components/cpu-1`);
        assert.deepEqual((await oldDetail.json() as any).data.links_tiendas, item.links_tiendas);
        assert.equal((await fetch(`${base}/api/v1/components/inexistente`)).status, 404);
        const post = (path: string, body: unknown, headers: Record<string, string> = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
        assert.equal((await post('/api/v1/compatibility/validate', { componente_ids: selection })).status, 403);
        const session = await fetch(`${base}/api/auth/session`);
        const cookie = session.headers.get('set-cookie')!.split(';')[0];
        const token = (await session.json() as any).data.csrfToken;
        const headers = { Cookie: cookie, 'X-CSRF-Token': token };
        const validation = await post('/api/v1/compatibility/validate', { componente_ids: selection }, headers);
        assert.equal(validation.status, 200);
        assert.equal((await validation.json() as any).data.compatible, true);
        assert.equal((await post('/api/v1/compatibility/validate', { componente_ids: ['no-existe'] }, headers)).status, 400);
        const generated = await post('/api/v1/builds/generate', { presupuesto: 6000000, uso: 'gaming' }, headers);
        assert.equal(generated.status, 200);
        const build: any = (await generated.json() as any).data;
        assert.equal(build.componente_ids.length, 8);
        assert.ok(build.compatibilidad.compatible && build.total <= 6000000);
        assert.equal((await post('/api/v1/builds/generate', { presupuesto: 1, uso: 'gaming' }, headers)).status, 422);
        assert.equal((await post('/api/v1/builds/generate', { presupuesto: -1, uso: 'gaming' }, headers)).status, 400);
    } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        Object.defineProperty(prisma, 'component', { value: originalComponent, configurable: true });
        Object.defineProperty(prisma, 'session', { value: originalSession, configurable: true });
    }
});
