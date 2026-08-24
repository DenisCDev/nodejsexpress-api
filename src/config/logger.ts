import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'rpg-character-api' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-api-key"]'],
    censor: '[redacted]',
  },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
    },
  }),
});
