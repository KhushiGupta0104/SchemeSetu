import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'ss_at';
export const REFRESH_COOKIE = 'ss_rt';
export const CSRF_COOKIE = 'ss_csrf';

export interface AccessPayload {
  sub: string;
  role: 'user' | 'admin';
}
export interface RefreshPayload {
  sub: string;
  v: number;
}

const baseCookie = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
});

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    algorithm: 'HS256',
  });
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as RefreshPayload;
}

/** Issues a short-lived access token and a longer-lived refresh token as HttpOnly cookies. */
export function setAuthCookies(
  res: Response,
  user: { id: string; role: 'user' | 'admin'; tokenVersion: number },
): void {
  res.cookie(ACCESS_COOKIE, signAccessToken({ sub: user.id, role: user.role }), {
    ...baseCookie(),
    path: '/api',
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, signRefreshToken({ sub: user.id, v: user.tokenVersion }), {
    ...baseCookie(),
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie(), path: '/api' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: '/api/v1/auth' });
}

/** Returns the existing CSRF token or issues a new one (synchroniser token kept in an HttpOnly cookie). */
export function ensureCsrfToken(existing: string | undefined, res: Response): string {
  const token = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, { ...baseCookie(), path: '/', maxAge: 24 * 60 * 60 * 1000 });
  return token;
}
