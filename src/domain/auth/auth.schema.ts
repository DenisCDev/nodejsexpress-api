import { z } from 'zod';

const password = z
  .string()
  .min(8)
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'password must be at most 72 bytes');

export const registerSchema = z.object({
  email: z.string().email().max(254).trim().toLowerCase(),
  // bcryptjs silently truncates at 72 bytes; count bytes, not JS characters.
  password,
  name: z.string().min(1).max(100).trim(),
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z
    .string()
    .min(1)
    .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'password must be at most 72 bytes'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
