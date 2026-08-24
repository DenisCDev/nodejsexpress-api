import type { RequestHandler } from 'express';
import { validated } from '../../middlewares/validate.js';
import * as service from './auth.service.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export const registerHandler: RequestHandler = async (_req, res) => {
  const input = validated<RegisterInput>(res, 'body');
  const { user, token } = await service.register(input);
  res.status(201).json({ user: user.toJSON(), token });
};

export const loginHandler: RequestHandler = async (_req, res) => {
  const input = validated<LoginInput>(res, 'body');
  const { user, token } = await service.login(input);
  res.json({ user: user.toJSON(), token });
};
