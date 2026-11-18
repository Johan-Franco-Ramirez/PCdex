import { Router } from 'express';
import * as validate from '../../validation.js';
import { listarComponentes, obtenerComponente } from './catalog.service.js';
import { catalogResponse } from './catalog.presenter.js';

export const catalogRoutes = Router();
catalogRoutes.get('/', async (req, res) => {
    const categoria = req.query.category === undefined ? undefined : validate.category(req.query.category);
    const nombre = req.query.q === undefined ? undefined : validate.text(req.query.q, 'q', 150);
    res.json({ success: true, data: (await listarComponentes(categoria, nombre)).map(catalogResponse) });
});
catalogRoutes.get('/:id', async (req, res) => {
    res.json({ success: true, data: catalogResponse(await obtenerComponente(validate.id(req.params.id))) });
});
