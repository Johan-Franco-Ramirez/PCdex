import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma, frontendOrigin } from './config/database.js';
import { ApiError, categories, labels } from './domain.js';
import * as validate from './validation.js';
import { compatibility } from './compatibility.js';
import { select, recommend, totals } from './services.js';
import { sessions } from './modules/auth/session.js';
import { auth, requireAdmin, requireUser, userFor } from './modules/auth/auth.routes.js';
import * as catalog from './modules/catalog/catalog.repository.js';
import * as builds from './modules/builds/builds.service.js';
import { catalogRouter as catalogoOriginal } from './modules/catalog/catalog.routes.js';
import { compatibilityRouter as validacionOriginal } from './modules/compatibility/compatibility.routes.js';
import { generar as generarOriginal } from './modules/builds/builds.controller.js';
import { AppError } from './shared/errors.js';
import { ZodError } from 'zod';
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    if (process.env.TRUST_PROXY === '1')
        app.set('trust proxy', 1);
    app.use(cors({
        origin: frontendOrigin, credentials: true
    }));
    app.use(express.json({
        limit: '128kb'
    }));
    // Rutas de consulta y cálculo puras del contrato original; no alteran datos.
    app.use('/api/componentes', catalogoOriginal);
    app.use('/api/builds/validar', validacionOriginal);
    app.post('/api/builds/generar', generarOriginal);
    app.use(sessions());
    app.use((req, _res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method))
            return next();
        const origin = req.get('Origin');
        if (origin && origin !== frontendOrigin)
            throw new ApiError(403, 'Origen no autorizado.');
        const expected = req.session.csrf, actual = req.get('X-CSRF-Token');
        if (!expected || !actual || !/^[a-f0-9]{64}$/.test(actual) || expected.length !== actual.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(actual)))
            throw new ApiError(403, 'Token CSRF inválido; actualiza la sesión.');
        next();
    });
    const ok = (data: unknown) => ({
        success: true, data
    });
    app.get('/health', (_req, res) => res.json({ status: 'ok', success: true, data: { project: 'PCdex API' } }));
    app.get('/health/ready', async (_req, res) => { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ready', success: true }); });
    app.use('/api/auth', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth);
    app.get('/api/categories', (_req, res) => res.json(ok(categories.map(id => ({
        id, name: labels[id]
    })))));
    app.get(['/api/components', '/api/components/category/:category'], async (req, res) => {
        const c = req.params.category ?? req.query.category;
        if (c !== undefined)
            validate.category(c);
        const q = req.query.q === undefined ? '' : validate.text(req.query.q, 'q', 150).toLowerCase();
        const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 50);
        if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100)
            throw new ApiError(400, 'Paginación inválida.');
        if (req.query.active !== undefined && !['true', 'false'].includes(String(req.query.active)))
            throw new ApiError(400, 'active debe ser true o false.');
        const result = await catalog.buscarComponentes({ category: c === undefined ? undefined : validate.category(c), q: q || undefined, active: req.query.active !== 'false', page, limit });
        res.json({ ...ok(result.data), meta: result.meta });
    });
    app.get('/api/components/:id', async (req, res) => res.json(ok(await catalog.getComponent(validate.componentId(req.params.id)))));
    app.post('/api/components', requireAdmin, async (req, res) => {
        const body = validate.object(req.body);
        res.status(201).json(ok(await catalog.createComponent(validate.component(body, body.id === undefined ? randomUUID() : validate.componentId(body.id)))));
    });
    app.put('/api/components/:id', requireAdmin, async (req, res) => res.json(ok(await catalog.updateComponent(validate.component(req.body, validate.componentId(req.params.id))))));
    app.delete('/api/components/:id', requireAdmin, async (req, res) => res.json(ok(await catalog.deactivateComponent(validate.componentId(req.params.id)))));
    app.use('/api/builds', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, requireUser);
    app.get('/api/builds', async (req, res) => res.json(ok(await builds.listBuilds((await userFor(req))!.id))));
    app.get('/api/builds/:id', async (req, res) => res.json(ok(await builds.getBuild(validate.id(req.params.id), (await userFor(req))!.id))));
    app.post('/api/builds', async (req, res) => res.status(201).json(ok(await builds.saveBuild(req.body, (await userFor(req))!.id))));
    app.put('/api/builds/:id', async (req, res) => res.json(ok(await builds.saveBuild(req.body, (await userFor(req))!.id, validate.id(req.params.id)))));
    app.delete('/api/builds/:id', async (req, res) => res.json(ok(await builds.deleteBuild(validate.id(req.params.id), (await userFor(req))!.id))));
    app.post('/api/compatibility/check', async (req, res) => {
        const v = validate.object(req.body), data = {
            version: 1 as const, components: await catalog.listComponents(), builds: []
        };
        let retained: string[] = [];
        if (v.buildId !== undefined) {
            const user = await userFor(req);
            if (!user)
                throw new ApiError(401, 'Inicia sesión para revisar un borrador privado.');
            retained = (await builds.getBuild(validate.id(v.buildId), user.id)).componentIds;
        }
        const items = select({
            ...data, components: data.components.map(x => !x.active && retained.includes(x.id) ? {
                ...x, active: true
            } : x)
        }, validate.ids(v.componentIds));
        const checks = compatibility(items), inactive = items.filter(x => data.components.some(c => c.id === x.id && !c.active));
        if (inactive.length) {
            checks.checks.push({
                rule: 'Disponibilidad', status: 'UNVERIFIED', componentIds: inactive.map(x => x.id), message: 'El borrador conserva piezas desactivadas. Puedes conservarlas o sustituirlas.'
            });
            if (checks.status === 'COMPATIBLE')
                checks.status = 'UNVERIFIED';
        }
        res.json(ok({
            compatibility: checks, ...totals(items, validate.money(v.budget, 'budget'))
        }));
    });
    app.post('/api/recommendations', async (req, res) => res.json(ok(recommend(req.body, {
        version: 1, components: await catalog.listComponents(), builds: []
    }))));
    app.use((_req, _res, next) => next(new ApiError(404, 'Ruta no encontrada.')));
    const errors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
        let status = error instanceof ZodError ? 400 : error instanceof AppError ? error.status : error instanceof ApiError ? error.status : typeof error === 'object' && error !== null && 'status' in error && [400, 413].includes(Number(error.status)) ? Number(error.status) : 500;
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            status = 409;
        if (status === 500)
            console.error(error instanceof Error ? error.name : 'InternalError');
        res.status(status).json({
            success: false, error: {
                codigo: error instanceof AppError ? error.code : error instanceof ZodError ? 'ENTRADA_INVALIDA' : error instanceof SyntaxError && 'body' in error ? 'JSON_INVALIDO' : undefined,
                message: status === 500 ? 'No se pudo completar la operación. Comprueba la conexión con SQL Server.' : status === 409 ? 'Conflicto: el registro ya existe.' : error instanceof Error ? error.message : 'Solicitud inválida.'
            }
        });
    };
    app.use(errors);
    return app;
}
