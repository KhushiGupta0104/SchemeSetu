import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../services/authTokens.js';

export interface AuthUser {
  id: string;
  role: 'user' | 'admin';
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

async function resolveUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return null;
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please refresh.');
    }
    throw ApiError.unauthenticated('Your session is invalid. Please log in again.');
  }
  // Re-load the user so deleted accounts and role changes take effect immediately.
  const user = await User.findById(payload.sub).select('name role').lean();
  if (!user) throw ApiError.unauthenticated('Your account no longer exists. Please log in again.');
  return { id: String(user._id), role: user.role as AuthUser['role'], name: user.name };
}

/** Requires a valid access token. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (!user) throw ApiError.unauthenticated();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches the user when a valid token is present; public endpoints still work without one. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (user) req.user = user;
    next();
  } catch (err) {
    // An expired token is surfaced so the client can refresh; other token problems are ignored.
    if (err instanceof ApiError && err.code === 'TOKEN_EXPIRED') return next(err);
    next();
  }
}

/** Server-side role-based access control. Must run after requireAuth. */
export function requireRole(role: AuthUser['role']) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthenticated());
    if (req.user.role !== role) return next(ApiError.forbidden());
    next();
  };
}
