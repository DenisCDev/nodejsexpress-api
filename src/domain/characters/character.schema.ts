import { z } from 'zod';
import { CHARACTER_CLASSES, CHARACTER_RACES, ALIGNMENTS } from './character.model.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'invalid id');

export const createCharacterSchema = z.object({
  nome: z.string().min(1).max(100).trim(),
  idade: z.number().int().min(0).max(10_000),
  classe: z.enum(CHARACTER_CLASSES),
  nivel: z.number().int().min(1).max(20).default(1),
  raca: z.enum(CHARACTER_RACES),
  antecedente: z.string().min(1).max(100).trim(),
  alinhamento: z.enum(ALIGNMENTS),
  imagemPersonagem: z.string().url().max(2048).optional(),
});

export const updateCharacterSchema = createCharacterSchema.partial();

export const idParamSchema = z.object({ id: objectId });

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  classe: z.enum(CHARACTER_CLASSES).optional(),
  raca: z.enum(CHARACTER_RACES).optional(),
  search: z.string().min(1).max(100).optional(),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type IdParams = z.infer<typeof idParamSchema>;
