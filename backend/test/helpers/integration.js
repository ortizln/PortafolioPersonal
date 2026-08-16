import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export function applyTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';
  process.env.RATE_LIMIT_WINDOW = '1';
  process.env.RATE_LIMIT_MAX = '1000000';
  process.env.CORS_ORIGIN = '*';
  process.env.JWT_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
}

export async function setupApp() {
  applyTestEnv();
  const { default: supertest } = await import('supertest');
  const { default: app } = await import('../../src/app');
  const prisma = new PrismaClient();
  return { request: supertest(app), prisma };
}

export async function dbAvailable() {
  const probe = new PrismaClient();
  try {
    await probe.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await probe.$disconnect();
  }
}

export async function ensurePermission(prisma, name) {
  return prisma.permission.upsert({
    where: { name },
    update: {},
    create: { name, module: 'test', description: `Permiso de prueba ${name}` }
  });
}

export async function ensureRole(prisma, name, permissionNames = []) {
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) return existing;
  const role = await prisma.role.create({
    data: { name, description: `Rol de prueba ${name}`, isSystem: name === 'SUPER_ADMIN' }
  });
  for (const p of permissionNames) {
    const permission = await ensurePermission(prisma, p);
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id }
    });
  }
  return role;
}

export async function createTestUser(prisma, { email, roleName, permissionNames = [] }) {
  const role = await ensureRole(prisma, roleName, permissionNames);
  return prisma.user.create({
    data: {
      email,
      password: bcrypt.hashSync('Test1234!', 10),
      name: email,
      role: 'USER',
      roleId: role.id,
      userRoles: { create: [{ roleId: role.id }] }
    }
  });
}

export async function login(request, email, password = 'Test1234!') {
  const res = await request.post('/api/auth/login').send({ email, password });
  return res;
}

export const TEST_PASSWORD = 'Test1234!';
