import type { Request, RequestHandler } from 'express';
import { Unauthorized } from '../../lib/errors.js';
import { validated } from '../../middlewares/validate.js';
import * as service from './character.service.js';
import type { CreateCharacterInput, IdParams, ListQuery, UpdateCharacterInput } from './character.schema.js';

const ownerOf = (req: Request): string => {
  if (!req.userId) throw Unauthorized();
  return req.userId;
};

export const createHandler: RequestHandler = async (req, res) => {
  const doc = await service.create(ownerOf(req), validated<CreateCharacterInput>(res, 'body'));
  res.status(201).json(doc.toJSON());
};

export const listHandler: RequestHandler = async (req, res) => {
  const result = await service.list(ownerOf(req), validated<ListQuery>(res, 'query'));
  res.json({
    data: result.data.map((d) => d.toJSON()),
    pagination: result.pagination,
  });
};

export const getHandler: RequestHandler = async (req, res) => {
  const { id } = validated<IdParams>(res, 'params');
  const doc = await service.findById(ownerOf(req), id);
  res.json(doc.toJSON());
};

export const updateHandler: RequestHandler = async (req, res) => {
  const { id } = validated<IdParams>(res, 'params');
  const doc = await service.update(ownerOf(req), id, validated<UpdateCharacterInput>(res, 'body'));
  res.json(doc.toJSON());
};

export const removeHandler: RequestHandler = async (req, res) => {
  const { id } = validated<IdParams>(res, 'params');
  await service.remove(ownerOf(req), id);
  res.status(204).end();
};
