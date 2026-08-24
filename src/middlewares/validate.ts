import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { BadRequest } from '../lib/errors.js';

interface Schemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

declare module 'express-serve-static-core' {
  interface Locals {
    validated?: { body?: unknown; params?: unknown; query?: unknown };
  }
}

export function validated<T>(res: Response, key: 'body' | 'params' | 'query'): T {
  const value = res.locals.validated?.[key];
  if (value === undefined) {
    throw new Error(`validated ${key} missing — validate() middleware was not applied`);
  }
  return value as T;
}

export const validate = (schemas: Schemas) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed: { body?: unknown; params?: unknown; query?: unknown } = {};
      if (schemas.body) {
        parsed.body = schemas.body.parse(req.body ?? {});
        req.body = parsed.body;
      }
      if (schemas.params) {
        parsed.params = schemas.params.parse(req.params);
        Object.assign(req.params, parsed.params);
      }
      if (schemas.query) {
        // Express 5 exposes req.query as a getter over the raw query string — do not assign it.
        parsed.query = schemas.query.parse(req.query);
      }
      res.locals.validated = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(BadRequest('validation failed', err.flatten().fieldErrors));
      }
      next(err);
    }
  };
