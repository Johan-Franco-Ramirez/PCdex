import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
 DATABASE_URL: z.string().min(1).startsWith('mysql://'),
 PORT: z.coerce.number().int().min(1).max(65535).default(3000),
 CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
 COOKIE_SECURE: z.enum(['true','false']).default('false').transform(value=>value==='true'),
 GOOGLE_CLIENT_ID: z.string().default(''),
 GOOGLE_CLIENT_SECRET: z.string().default(''),
 GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:8081/api/auth/google/callback'),
 FRONTEND_URL: z.string().url().default('http://localhost:8081'),
 GENERATION_MAX_NODES: z.coerce.number().int().positive().max(2000000).default(250000),
 GENERATION_TIMEOUT_MS: z.coerce.number().int().min(50).max(30000).default(3000),
});
export const env = schema.parse(process.env);
