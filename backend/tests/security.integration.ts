import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { securityHeaders, apiRateLimiter } from '../src/middlewares/security.js';

test('API limita solicitudes y envia cabeceras defensivas sin bloquear health', async () => {
    const app = express();
    app.use(securityHeaders);
    app.use('/api', apiRateLimiter());
    app.get('/api/probe', (_req, res) => res.json({ ok: true }));
    app.get('/health', (_req, res) => res.json({ ok: true }));
    const server = app.listen(0, '127.0.0.1');
    try {
        await once(server, 'listening');
        const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        for (let i = 0; i < 300; i++) {
            const response = await fetch(`${base}/api/probe`);
            assert.equal(response.status, 200);
            await response.arrayBuffer();
        }
        const blocked = await fetch(`${base}/api/probe`);
        assert.equal(blocked.status, 429);
        assert.ok(blocked.headers.get('retry-after'));
        assert.equal(blocked.headers.get('x-content-type-options'), 'nosniff');
        assert.equal(blocked.headers.get('x-frame-options'), 'DENY');
        assert.ok(blocked.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
        assert.equal(blocked.headers.get('strict-transport-security'), null);
        assert.deepEqual(await blocked.json(), {
            success: false, error: { message: 'Demasiadas solicitudes. Intenta mas tarde.' },
        });
        const health = await fetch(`${base}/health`);
        assert.equal(health.status, 200);
        await health.arrayBuffer();
    } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
