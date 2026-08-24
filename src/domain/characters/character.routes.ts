import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createCharacterSchema,
  updateCharacterSchema,
  idParamSchema,
  listQuerySchema,
} from './character.schema.js';
import {
  createHandler,
  listHandler,
  getHandler,
  updateHandler,
  removeHandler,
} from './character.controller.js';

export const characterRouter = Router();

characterRouter.use(requireAuth);

characterRouter.post('/', validate({ body: createCharacterSchema }), createHandler);
characterRouter.get('/', validate({ query: listQuerySchema }), listHandler);
characterRouter.get('/:id', validate({ params: idParamSchema }), getHandler);
characterRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateCharacterSchema }),
  updateHandler,
);
characterRouter.delete('/:id', validate({ params: idParamSchema }), removeHandler);
