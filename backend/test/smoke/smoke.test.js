import { describe, it, expect, beforeAll, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.RATE_LIMIT_WINDOW = '1';
process.env.RATE_LIMIT_MAX = '1000000';
process.env.CORS_ORIGIN = '*';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

vi.mock('@prisma/client', () => {
  const { createPrismaMock } = require('../helpers/prismaMock');
  return { PrismaClient: class { constructor() { return createPrismaMock(); } } };
});

let request;

beforeAll(async () => {
  const supertest = (await import('supertest')).default;
  const app = (await import('../../src/app')).default;
  request = supertest(app);
});

describe('smoke: rutas públicas y protección', () => {
  it('GET /api/health responde ok', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/public/company responde 200', async () => {
    const res = await request.get('/api/public/company');
    expect(res.status).toBe(200);
  });

  it('GET /api/public/services responde 200 con array', async () => {
    const res = await request.get('/api/public/services');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.services)).toBe(true);
  });

  it('GET /api/public/blog responde 200 con posts, categorías y total', async () => {
    const res = await request.get('/api/public/blog');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(Array.isArray(res.body.categories)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('GET /api/public/seo responde 200', async () => {
    const res = await request.get('/api/public/seo');
    expect(res.status).toBe(200);
  });

  it('GET /api/posts sin token responde 401', async () => {
    const res = await request.get('/api/posts');
    expect(res.status).toBe(401);
  });

  it('GET /api/users sin token responde 401', async () => {
    const res = await request.get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('smoke: SEO (sitemap y robots)', () => {
  it('GET /sitemap.xml responde XML con urlset', async () => {
    const res = await request.get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('xml');
    expect(res.text).toContain('<urlset');
    expect(res.text).toContain('/blog');
  });

  it('GET /robots.txt responde texto con Sitemap', async () => {
    const res = await request.get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('User-agent: *');
    expect(res.text).toContain('Sitemap:');
  });

  it('GET /api-docs responde la UI de Swagger', async () => {
    const res = await request.get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});
