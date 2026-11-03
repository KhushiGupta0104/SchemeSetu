import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Wraps an async route handler so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Consistent success envelope: { success: true, data, meta? } */
export function ok<T>(res: Response, data: T, status = 200, meta?: PageMeta | Record<string, unknown>) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function pageMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Escapes user input before using it inside a RegExp (prevents ReDoS / regex injection). */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
