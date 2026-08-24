import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError, isDuplicateKeyError } from '../lib/errors.js';
import { logger } from '../config/logger.js';

function isClientJsonError(err: Error): boolean {
  return err instanceof SyntaxError && 'body' in err;
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) return;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (isClientJsonError(err)) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'invalid json' },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'validation failed', details: err.errors },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'invalid id' },
    });
    return;
  }

  if (isDuplicateKeyError(err)) {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'duplicate key' },
    });
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'internal server error' },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'route not found' } });
}
