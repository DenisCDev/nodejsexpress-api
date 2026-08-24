import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { Conflict, Unauthorized, isDuplicateKeyError } from '../../lib/errors.js';
import { UserModel, type UserDocument } from './user.model.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

const BCRYPT_ROUNDS = 12;
const JWT_ISS = 'rpg-character-api';
const JWT_AUD = 'rpg-character-api';

// Precomputed bcrypt of a dummy string so unknown-email logins take the same time as known ones.
const DUMMY_PASSWORD_HASH = '$2a$12$2NBtTmKPteNZjEMSDhLg/uC/CQTEWz4gHtq9GvBQ/CGt4Hu2yPb5y';

const jwtPayloadSchema = z.object({
  sub: z.string().min(1),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export interface AuthResult {
  user: UserDocument;
  token: string;
}

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

function signToken(userId: string): string {
  // jwt.SignOptions.expiresIn is a template-literal union; Zod keeps a verified string.
  const expiresIn = env.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`;
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn,
    issuer: JWT_ISS,
    audience: JWT_AUD,
  });
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const user = await UserModel.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    return { user, token: signToken(user._id.toString()) };
  } catch (err) {
    if (isDuplicateKeyError(err)) throw Conflict('email already registered');
    throw err;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email });
  const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(input.password, hash);
  if (!user || !valid) throw Unauthorized('invalid credentials');

  return { user, token: signToken(user._id.toString()) };
}

export function verifyToken(token: string): JwtPayload {
  try {
    const raw = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISS,
      audience: JWT_AUD,
    });
    return jwtPayloadSchema.parse(raw);
  } catch (err) {
    logger.debug({ err }, 'token verification failed');
    throw Unauthorized('invalid or expired token');
  }
}
