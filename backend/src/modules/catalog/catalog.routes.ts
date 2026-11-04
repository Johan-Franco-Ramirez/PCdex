import { Router } from 'express';
import { listar, detalle } from './catalog.controller.js';
export const catalogRouter = Router();
catalogRouter.get('/',listar);
catalogRouter.get('/:id',detalle);
