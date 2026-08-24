import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z
    .string()
    .min(1)
    .refine(
      (v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    ),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^[0-9]+[smhd]$/, 'JWT_EXPIRES_IN must look like 15m or 7d')
    .default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  CORS_ORIGIN: z.string().default('*'),
  // Only enable behind a reverse proxy; otherwise clients can spoof X-Forwarded-For and bypass rate limits.
  TRUST_PROXY: z
    .enum(['0', '1', 'true', 'false'])
    .default('false')
    .transform((v) => v === '1' || v === 'true'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.CORS_ORIGIN === '*') {
  console.error('CORS_ORIGIN=* is not allowed in production. Set an explicit origin or comma-separated allowlist.');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
