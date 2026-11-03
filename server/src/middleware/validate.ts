import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/** Validates and replaces req[source] with the parsed (typed, stripped) value. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    } else {
      (req as unknown as Record<Source, unknown>)[source] = result.data;
    }
    next();
  };
}
