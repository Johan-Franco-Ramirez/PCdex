import { Router } from 'express';
import { object, ids } from '../../validation.js';
import { validarBuild } from './compatibility.service.js';

export const compatibilityRoutes = Router();
compatibilityRoutes.post('/validate', async (req, res) => {
    const body = object(req.body);
    res.json({ success: true, data: await validarBuild(ids(body.componente_ids)) });
});
