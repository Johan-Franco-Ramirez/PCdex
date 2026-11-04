import { Router } from 'express';
import { validar } from './compatibility.controller.js';
export const compatibilityRouter=Router();
compatibilityRouter.post('/',validar);
