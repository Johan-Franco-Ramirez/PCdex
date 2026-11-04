import session, { Store, type SessionData } from 'express-session';
import { prisma, requiredSecret } from '../../config/database.js';
declare module 'express-session' {
    interface SessionData {
        userId?: string;
        pendingUserId?: string;
        pendingUntil?: number;
        csrf?: string;
        mfa?: boolean;
    }
}
export class SqlSessionStore extends Store {
    override get(sid: string, callback: (error: unknown, data?: SessionData | null) => void) {
        prisma.session.findUnique({
            where: {
                id: sid
            }
        }).then(async (row) => {
            if (!row || row.expiresAt.getTime() <= Date.now()) {
                if (row)
                    await prisma.session.deleteMany({
                        where: {
                            id: sid
                        }
                    });
                callback(null, null);
            }
            else
                callback(null, JSON.parse(row.data) as SessionData);
        }).catch(callback);
    }
    override set(sid: string, data: SessionData, callback?: (error?: unknown) => void) {
        const expiresAt = data.cookie.expires ? new Date(data.cookie.expires) : new Date(Date.now() + 8 * 3600000);
        prisma.session.upsert({
            where: {
                id: sid
            }, create: {
                id: sid, data: JSON.stringify(data), expiresAt
            }, update: {
                data: JSON.stringify(data), expiresAt
            }
        }).then(() => callback?.()).catch(error => callback?.(error));
    }
    override destroy(sid: string, callback?: (error?: unknown) => void) {
        prisma.session.deleteMany({
            where: {
                id: sid
            }
        }).then(() => callback?.()).catch(error => callback?.(error));
    }
    override touch(sid: string, data: SessionData, callback?: (error?: unknown) => void) {
        prisma.session.updateMany({
            where: {
                id: sid
            }, data: {
                expiresAt: data.cookie.expires ? new Date(data.cookie.expires) : new Date(Date.now() + 8 * 3600000)
            }
        }).then(() => callback?.()).catch(error => callback?.(error));
    }
}
export function sessions() {
    return session({
        name: 'pcdex.sid', secret: requiredSecret('SESSION_SECRET'), store: new SqlSessionStore(), resave: false, saveUninitialized: false, cookie: {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 3600000
        }
    });
}
