import { beforeAll, it, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.RATE_LIMIT_WINDOW = '1';
process.env.RATE_LIMIT_MAX = '1000000';
process.env.CORS_ORIGIN = '*';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

vi.mock('@prisma/client', () => {
  const { createPrismaMock } = require('./helpers/prismaMock');
  return { PrismaClient: class { constructor() { return createPrismaMock(); } } };
});

let request;
beforeAll(async () => {
  const supertest = (await import('supertest')).default;
  const app = (await import('../../src/app')).default;
  request = supertest(app);
});

it('debug blog', async () => {
  const res = await request.get('/api/public/blog');
  console.log('BLOG', res.status, JSON.stringify(res.body).slice(0, 600));
});
