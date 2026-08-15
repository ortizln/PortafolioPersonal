import { describe, it, expect, beforeEach } from 'vitest';
import { createPrismaMock } from './helpers/prismaMock';

describe('prisma mock (base para smoke)', () => {
  let db;
  beforeEach(() => {
    db = createPrismaMock();
  });

  it('resuelve findFirst como null', async () => {
    await expect(db.company.findFirst({ where: {} })).resolves.toBeNull();
  });

  it('resuelve findMany como array vacío', async () => {
    await expect(db.post.findMany({ where: {} })).resolves.toEqual([]);
  });

  it('resuelve count como 0', async () => {
    await expect(db.post.count({ where: {} })).resolves.toBe(0);
  });

  it('soporta $transaction con callback', async () => {
    const result = await db.$transaction(async (tx) => {
      const profile = await tx.profile.findFirst({});
      return { profile, total: await tx.experience.count({}) };
    });
    expect(result.profile).toBeNull();
    expect(result.total).toBe(0);
  });
});
