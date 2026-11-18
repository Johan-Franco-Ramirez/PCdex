import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

// Cabeceras para la API JSON; el frontend necesita su propia politica CSP.
export const securityHeaders: RequestHandler = (req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (process.env.NODE_ENV === 'production' && req.secure)
        res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
};

export function apiRateLimiter() {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, error: { message: 'Demasiadas solicitudes. Intenta mas tarde.' } },
    });
}
