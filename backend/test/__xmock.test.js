import { it, expect, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  const { createPrismaMock } = require('./helpers/prismaMock');
  return { PrismaClient: class { constructor() { return createPrismaMock(); } } };
});

it('config/database usa el mock al importarlo directo', async () => {
  const db = (await import('../src/config/database')).default;
  const r = await db.company.findFirst({});
  expect(r).toBeNull();
});

it('app importada dinámicamente usa el mock en /api/public/blog', async () => {
  const supertest = (await import('supertest')).default;
  const app = (await import('../src/app')).default;
  const res = await supertest(app).get('/api/public/blog');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.posts)).toBe(true);
});
