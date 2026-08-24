import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import './setup.js';
import { connectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('characters', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  const sampleCharacter = {
    nome: 'Aragorn',
    idade: 87,
    classe: 'patrulheiro',
    nivel: 10,
    raca: 'humano',
    antecedente: 'Herdeiro de Isildur',
    alinhamento: 'leal-bom',
  };

  async function register(name = 'U'): Promise<string> {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: `user-${randomUUID()}@x.me`, password: 'longpassword', name });
    return res.body.token as string;
  }

  beforeAll(async () => {
    await connectDB(process.env.MONGODB_URI!);
    app = createApp();
  });

  beforeEach(async () => {
    token = await register();
  });

  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/characters');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects missing bearer token', async () => {
    const res = await request(app).get('/characters').set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid jwt', async () => {
    const res = await request(app).get('/characters').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('rejects an expired jwt', async () => {
    const expired = jwt.sign({ sub: '000000000000000000000000' }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: 0,
      issuer: 'rpg-character-api',
      audience: 'rpg-character-api',
    });
    const res = await request(app).get('/characters').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('creates a character', async () => {
    const res = await request(app).post('/characters').set(auth()).send(sampleCharacter);
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Aragorn');
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.ownerId).toEqual(expect.any(String));
  });

  it('gets a character by id', async () => {
    const created = await request(app).post('/characters').set(auth()).send(sampleCharacter);
    const res = await request(app).get(`/characters/${created.body.id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Aragorn');
  });

  it('rejects a malformed id', async () => {
    const res = await request(app).get('/characters/not-an-id').set(auth());
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 404 for a well-formed missing id', async () => {
    const res = await request(app).get('/characters/000000000000000000000000').set(auth());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('lists only owner characters with pagination', async () => {
    await request(app).post('/characters').set(auth()).send(sampleCharacter);

    const res = await request(app).get('/characters').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('filters by classe', async () => {
    await request(app).post('/characters').set(auth()).send(sampleCharacter);
    await request(app)
      .post('/characters')
      .set(auth())
      .send({ ...sampleCharacter, nome: 'Gandalf', classe: 'mago' });

    const res = await request(app).get('/characters?classe=mago').set(auth());
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].classe).toBe('mago');
  });

  it('escapes regex metacharacters in search', async () => {
    await request(app)
      .post('/characters')
      .set(auth())
      .send({ ...sampleCharacter, nome: 'Aragorn' });

    const res = await request(app).get('/characters?search=Ara.').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('updates a character', async () => {
    const created = await request(app).post('/characters').set(auth()).send(sampleCharacter);

    const res = await request(app)
      .patch(`/characters/${created.body.id}`)
      .set(auth())
      .send({ nivel: 20 });

    expect(res.status).toBe(200);
    expect(res.body.nivel).toBe(20);
  });

  it('deletes a character', async () => {
    const created = await request(app).post('/characters').set(auth()).send(sampleCharacter);
    const del = await request(app).delete(`/characters/${created.body.id}`).set(auth());
    expect(del.status).toBe(204);

    const get = await request(app).get(`/characters/${created.body.id}`).set(auth());
    expect(get.status).toBe(404);
  });

  it('does not leak characters across owners on list', async () => {
    await request(app).post('/characters').set(auth()).send(sampleCharacter);
    const other = await register('O');

    const res = await request(app).get('/characters').set(auth(other));
    expect(res.body.data).toHaveLength(0);
  });

  it('does not allow another owner to get, patch, or delete', async () => {
    const created = await request(app).post('/characters').set(auth()).send(sampleCharacter);
    const id = created.body.id as string;
    const other = await register('O');

    const get = await request(app).get(`/characters/${id}`).set(auth(other));
    const patch = await request(app).patch(`/characters/${id}`).set(auth(other)).send({ nivel: 1 });
    const del = await request(app).delete(`/characters/${id}`).set(auth(other));

    expect(get.status).toBe(404);
    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);

    const stillThere = await request(app).get(`/characters/${id}`).set(auth());
    expect(stillThere.status).toBe(200);
  });

  it('rejects a page past the cap', async () => {
    const res = await request(app).get('/characters?page=1001').set(auth());
    expect(res.status).toBe(400);
  });

  it('rejects invalid classe', async () => {
    const res = await request(app)
      .post('/characters')
      .set(auth())
      .send({ ...sampleCharacter, classe: 'jedi' });
    expect(res.status).toBe(400);
  });
});
