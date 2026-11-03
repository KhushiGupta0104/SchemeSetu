import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { CSRF_COOKIE } from '../services/authTokens.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection (synchroniser token): the token lives in an HttpOnly cookie and is also
 * returned by GET /auth/csrf. Clients echo it in the X-CSRF-Token header on every
 * state-changing request. A cross-site attacker can neither read the token nor set the header.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get('x-csrf-token');
  if (
    typeof cookie !== 'string' ||
    typeof header !== 'string' ||
    cookie.length !== header.length ||
    !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))
  ) {
    return next(new ApiError(403, 'CSRF_INVALID', 'Security token missing or invalid. Please retry.'));
  }
  next();
}
