import express, { type Express } from 'express';
import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pingDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middlewares/error.js';
import { authRouter } from './domain/auth/auth.routes.js';
import { characterRouter } from './domain/characters/character.routes.js';

const PROBE_PATHS = new Set(['/health', '/ready']);

function corsOrigin(): CorsOptions['origin'] {
  if (env.CORS_ORIGIN === '*') return true;
  return env.CORS_ORIGIN.split(',').map((s) => s.trim());
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: corsOrigin() }));
  app.use(express.json({ limit: '100kb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => PROBE_PATHS.has(req.url ?? '') },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/ready', async (_req, res) => {
    const mongo = await pingDB();
    if (!mongo) {
      res.status(503).json({ status: 'not_ready', checks: { mongo: 'down' } });
      return;
    }
    res.json({ status: 'ok', checks: { mongo: 'up' } });
  });

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.NODE_ENV === 'test' ? 10_000 : env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'too many requests' } },
    }),
  );

  app.use('/auth', authRouter);
  app.use('/characters', characterRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
