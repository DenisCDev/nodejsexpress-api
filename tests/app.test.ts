import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import './setup.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { createApp } from '../src/app.js';

describe('app', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await connectDB(process.env.MONGODB_URI!);
    app = createApp();
  });

  it('GET /health is live without auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toEqual(expect.any(Number));
  });

  it('GET /ready is ready when mongo is up', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', checks: { mongo: 'up' } });
  });

  it('unknown routes return the standard 404 shape', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({ code: 'NOT_FOUND', message: 'route not found' });
  });

  it('GET /ready is 503 when mongo is down', async () => {
    await disconnectDB();
    try {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(503);
      expect(res.body).toEqual({ status: 'not_ready', checks: { mongo: 'down' } });
    } finally {
      await connectDB(process.env.MONGODB_URI!);
    }
  });
});
