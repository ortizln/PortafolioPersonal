import { it, expect, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  const { createPrismaMock } = require('../helpers/prismaMock');
  return { PrismaClient: class { constructor() { return createPrismaMock(); } } };
});

it('dummyDb usa el mock', async () => {
  const db = (await import('./_x/dummyDb')).default;
  const r = await db.company.findFirst({});
  expect(r).toBeNull();
});
