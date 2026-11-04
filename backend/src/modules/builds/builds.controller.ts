import type { RequestHandler } from 'express';
import { generarBodySchema } from './builds.schemas.js';
import { generarBuild } from './builds.service.js';
export const generar:RequestHandler=async(req,res)=>{res.json(await generarBuild(generarBodySchema.parse(req.body)));};
