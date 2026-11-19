import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Role } from '@souk/shared';
import { env, isProd } from '../lib/env.js';
import { AppError } from '../lib/errors.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export const AUTH_COOKIE = 'souk_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: number;
  role: Role;
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProd || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
  path: '/',
});

export function setSessionCookie(res: Response, user: { id: number }) {
  const token = jwt.sign({ sub: String(user.id) }, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
}

/**
 * Verifies the session and loads the role from the database on every request,
 * so demoting an admin takes effect immediately rather than when the token expires.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next(AppError.unauthorized());
  let id: number;
  try {
    id = Number((jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload).sub);
  } catch {
    return next(AppError.unauthorized('Your session has expired. Sign in again.'));
  }
  try {
    const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id));
    if (!user) return next(AppError.unauthorized());
    res.locals.user = user satisfies SessionUser;
    next();
  } catch (e) {
    next(e);
  }
};

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if ((res.locals.user as SessionUser | undefined)?.role !== 'ADMIN') return next(AppError.forbidden('Only shop staff can do that'));
  next();
};

export const userId = (res: Response) => (res.locals.user as SessionUser).id;
