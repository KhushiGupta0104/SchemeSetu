import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found.`));
}

/** Centralised error handler — consistent shape, no internal details leaked. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let apiError: ApiError;

  if (err instanceof ApiError) apiError = err;
  else if (err instanceof ZodError) {
    apiError = ApiError.badRequest(
      'Some of the information provided is invalid.',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    apiError = ApiError.badRequest(`Invalid value for ${err.path}.`);
  } else if (err instanceof mongoose.Error.ValidationError) {
    apiError = ApiError.badRequest(
      'Some of the information provided is invalid.',
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    );
  } else if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    apiError = ApiError.conflict('A record with these details already exists.');
  } else if (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    apiError = ApiError.badRequest('Request body is not valid JSON.');
  } else if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.too.large') {
    apiError = new ApiError(413, 'VALIDATION_ERROR', 'Request body is too large.');
  } else if (
    err instanceof mongoose.Error.MongooseServerSelectionError ||
    (err instanceof Error && /buffering timed out|ECONNREFUSED|topology/i.test(err.message))
  ) {
    logger.error({ err }, 'Database unavailable');
    apiError = new ApiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again shortly.');
  } else {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
    apiError = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
  }

  res.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  });
}
