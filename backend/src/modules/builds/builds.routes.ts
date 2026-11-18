import { Router } from 'express';
import { object, money, profile } from '../../validation.js';
import { generarBuild } from './builds.service.js';

export const buildsRoutes = Router();
buildsRoutes.post('/generate', async (req, res) => {
    const body = object(req.body);
    res.json({ success: true, data: await generarBuild(money(body.presupuesto, 'presupuesto'), profile(body.uso)) });
});
