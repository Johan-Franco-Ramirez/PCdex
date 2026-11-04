import { z } from 'zod';
export const idsSchema = z.array(z.string().trim().min(1).max(100)).min(1).max(64);
export const validarBodySchema = z.object({ componente_ids: idsSchema }).strict();
