import { Router } from 'express';
import { compatibilityRouter } from '../compatibility/compatibility.routes.js';
import { generar } from './builds.controller.js';
export const buildsRouter=Router();
buildsRouter.use('/validar',compatibilityRouter);
buildsRouter.post('/generar',generar);
