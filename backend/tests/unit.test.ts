import test from 'node:test';
import assert from 'node:assert/strict';
import { seedData } from '../src/seed-data.js';
import { compatibility } from '../src/compatibility.js';
import { categories } from '../src/domain.js';
import { recommend, totals } from '../src/services.js';
import { component, positive } from '../src/validation.js';
import { hashPassword, checkPassword, newTotp, encrypt, decrypt, totpStep } from '../src/modules/auth/crypto.js';
const selection = ['cpu-1', 'gpu-1', 'motherboard-1', 'ram-1', 'storage-1', 'psu-1', 'case-1', 'cooler-1'];
test('catálogo, reglas y presupuestos', () => {
    const data = seedData();
    for (const c of categories)
        assert.equal(data.components.filter(x => x.category === c).length, 5);
    const items = data.components.filter(x => selection.includes(x.id));
    assert.equal(compatibility(items).status, 'COMPATIBLE');
    assert.equal(compatibility(items.map(x => x.category === 'cpu' ? data.components.find(c => c.id === 'cpu-4')! : x)).status, 'INCOMPATIBLE');
    assert.equal(compatibility([]).status, 'UNVERIFIED');
    assert.equal(totals(items, 1).total, 3710000);
    assert.ok(totals(items, 1).warnings.some(x => x.includes('supera')));
    assert.throws(() => positive(-1, 'budget'));
    assert.throws(() => component({
        ...data.components[0], specs: {
            watts: 10
        }
    }, 'invalid'));
    items.find(x => x.category === 'cpu')!.specs = {};
    assert.equal(compatibility(items).status, 'UNVERIFIED');
});
test('recomendador conserva componentes fijados y advierte presupuesto insuficiente', () => {
    for (const profile of ['gaming', 'estudio', 'trabajo', 'oficina', 'diseño']) {
        const result = recommend({
            budget: 6000000, profile, componentIds: ['cpu-4']
        }, seedData());
        assert.ok(result.componentIds.includes('cpu-4'));
        assert.equal(result.compatibility.status, 'COMPATIBLE');
        assert.ok(result.total <= 6000000);
    }
    assert.equal(recommend({
        budget: 1, profile: 'oficina'
    }, seedData()).withinBudget, false);
});
test('hash de contraseña, cifrado autenticado y TOTP', async () => {
    process.env.TOTP_ENCRYPTION_KEY = 'test-only-encryption-key-with-more-than-32-chars';
    const hash = await hashPassword('Una contraseña de prueba');
    assert.ok(await checkPassword('Una contraseña de prueba', hash));
    assert.equal(await checkPassword('Otra contraseña de prueba', hash), false);
    const otp = newTotp('test@example.invalid'), encoded = encrypt(otp.secret.base32);
    assert.equal(decrypt(encoded), otp.secret.base32);
    const parts = encoded.split('.');
    parts[1] = Buffer.alloc(16).toString('base64url');
    assert.throws(() => decrypt(parts.join('.')));
    assert.ok(totpStep(otp.secret.base32, otp.generate()) >= 0n);
    assert.throws(() => totpStep(otp.secret.base32, 'no'));
});
