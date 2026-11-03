import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env.js';

const handler: Options['handler'] = (_req, res) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a little and try again.' },
  });
};

const make = (windowMs: number, limit: number, extra: Partial<Options> = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler,
    skip: () => !env.RATE_LIMIT_ENABLED,
    ...extra,
  });

/** Applies to the whole API. In-memory store: per-instance limits (see docs/DEPLOYMENT.md). */
export const apiLimiter = make(15 * 60 * 1000, 600);

/** Brute-force protection for login/register. */
export const authLimiter = make(15 * 60 * 1000, 20, { skipSuccessfulRequests: true });

/** AI explanations cost money — limit per signed-in user. */
export const aiLimiter = make(60 * 1000, 6, {
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : `ip:${req.ip}`),
});
export const aiDailyLimiter = make(24 * 60 * 60 * 1000, 60, {
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : `ip:${req.ip}`),
});
