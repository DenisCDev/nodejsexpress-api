import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { validate } from '../../middlewares/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerHandler, loginHandler } from './auth.controller.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10_000 : 10,
  message: { error: { code: 'RATE_LIMITED', message: 'too many auth attempts' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), registerHandler);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), loginHandler);
