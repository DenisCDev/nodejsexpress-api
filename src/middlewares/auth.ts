import type { Request, Response, NextFunction } from 'express';
import { Unauthorized } from '../lib/errors.js';
import { verifyToken } from '../domain/auth/auth.service.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(Unauthorized('missing bearer token'));
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    next(Unauthorized('missing bearer token'));
    return;
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    next(err);
  }
}
