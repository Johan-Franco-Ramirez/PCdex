import type { RequestHandler } from 'express';
import { validarBodySchema } from './compatibility.schemas.js';
import { validarBuild } from './compatibility.service.js';
export const validar: RequestHandler = async(req,res)=>{const body=validarBodySchema.parse(req.body);res.json(await validarBuild(body.componente_ids));};
