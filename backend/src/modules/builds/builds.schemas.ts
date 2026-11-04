import { z } from 'zod';
export const generarBodySchema=z.object({
 presupuesto:z.number().finite().positive().max(1000000000000).refine(n=>Math.abs(Math.round(n*100)-n*100)<0.01,'El presupuesto admite como máximo dos decimales.'),
 uso:z.enum(['gaming','trabajo','ofimatica']),
}).strict();
export type GenerarBody=z.infer<typeof generarBodySchema>;
