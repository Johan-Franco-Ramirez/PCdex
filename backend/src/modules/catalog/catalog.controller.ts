import type { RequestHandler } from 'express';
import { catalogQuerySchema, idSchema } from './catalog.schemas.js';
import { listarComponentes, obtenerComponente } from './catalog.service.js';
export const listar: RequestHandler = async (req,res) => { res.json(await listarComponentes(catalogQuerySchema.parse(req.query))); };
export const detalle: RequestHandler = async (req,res) => { res.json({data:await obtenerComponente(idSchema.parse(req.params.id))}); };
