import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import './setup.js';
import { connectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

describe('auth', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await connectDB(process.env.MONGODB_URI!);
    app = createApp();
  });

  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'frodo@shire.me', password: 'precious-ring', name: 'Frodo' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('frodo@shire.me');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('normalizes email to lowercase', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'Pippin@Shire.ME', password: 'longpassword', name: 'Pippin' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('pippin@shire.me');
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'sam@shire.me', password: 'po-ta-toes', name: 'Sam' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'sam@shire.me', password: 'po-ta-toes', name: 'Sam' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('logs in with valid credentials', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'gandalf@valinor.me', password: 'you-shall-not', name: 'Gandalf' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'gandalf@valinor.me', password: 'you-shall-not' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@nowhere.me', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects wrong password for an existing user', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'boromir@gondor.me', password: 'longpassword', name: 'Boromir' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'boromir@gondor.me', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'longpassword', name: 'X' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects short passwords', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'short@shire.me', password: 'short', name: 'X' });

    expect(res.status).toBe(400);
  });

  it('rejects a password over 72 bytes even if it is under 72 characters', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'bytes@shire.me', password: 'á'.repeat(40), name: 'X' });

    expect(res.status).toBe(400);
  });

  it('rejects malformed json', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects a token with the wrong issuer', async () => {
    const forged = jwt.sign({ sub: '000000000000000000000000' }, env.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'not-this-api',
      audience: 'rpg-character-api',
    });

    const res = await request(app).get('/characters').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});
