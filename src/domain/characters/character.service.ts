import { CharacterModel, type CharacterDocument } from './character.model.js';
import type { CreateCharacterInput, UpdateCharacterInput, ListQuery } from './character.schema.js';
import { NotFound } from '../../lib/errors.js';

const QUERY_TIMEOUT_MS = 5_000;

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function create(
  ownerId: string,
  input: CreateCharacterInput,
): Promise<CharacterDocument> {
  return CharacterModel.create({ ...input, ownerId });
}

export async function findById(ownerId: string, id: string): Promise<CharacterDocument> {
  const doc = await CharacterModel.findOne({ _id: id, ownerId }).maxTimeMS(QUERY_TIMEOUT_MS);
  if (!doc) throw NotFound('character');
  return doc;
}

export async function list(
  ownerId: string,
  query: ListQuery,
): Promise<PaginatedResult<CharacterDocument>> {
  const filter: Record<string, unknown> = { ownerId };
  if (query.classe) filter.classe = query.classe;
  if (query.raca) filter.raca = query.raca;
  if (query.search) filter.nome = { $regex: escapeRegex(query.search), $options: 'i' };

  const skip = (query.page - 1) * query.limit;
  const [data, total] = await Promise.all([
    CharacterModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).maxTimeMS(QUERY_TIMEOUT_MS),
    CharacterModel.countDocuments(filter).maxTimeMS(QUERY_TIMEOUT_MS),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function update(
  ownerId: string,
  id: string,
  input: UpdateCharacterInput,
): Promise<CharacterDocument> {
  const doc = await CharacterModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: input },
    { new: true, runValidators: true, maxTimeMS: QUERY_TIMEOUT_MS },
  );
  if (!doc) throw NotFound('character');
  return doc;
}

export async function remove(ownerId: string, id: string): Promise<void> {
  const result = await CharacterModel.deleteOne({ _id: id, ownerId }).maxTimeMS(QUERY_TIMEOUT_MS);
  if (result.deletedCount === 0) throw NotFound('character');
}
