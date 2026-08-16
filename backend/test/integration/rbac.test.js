import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupApp, dbAvailable, createTestUser, login } from '../helpers/integration';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadBase = path.join(__dirname, '..', '..', 'uploads');

const suffix = Date.now().toString(36);
const viewerEmail = `viewer_${suffix}@test.local`;
const adminEmail = `admin_${suffix}@test.local`;
const uploaderEmail = `uploader_${suffix}@test.local`;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const available = await dbAvailable();
const describeIf = available ? describe : describe.skip;

describeIf('integración: RBAC y permisos', () => {
  let request;
  let prisma;
  let viewerToken;
  let adminToken;
  let uploaderToken;
  const userIds = [];

  beforeAll(async () => {
    ({ request, prisma } = await setupApp());
    const viewer = await createTestUser(prisma, { email: viewerEmail, roleName: `T_VIEWER_${suffix}` });
    const admin = await createTestUser(prisma, { email: adminEmail, roleName: 'SUPER_ADMIN' });
    const uploader = await createTestUser(prisma, { email: uploaderEmail, roleName: `T_UPLOADER_${suffix}`, permissionNames: ['media.upload'] });
    userIds.push(viewer.id, admin.id, uploader.id);

    const loginRes = await login(request, viewerEmail);
    expect(loginRes.status).toBe(200);
    viewerToken = loginRes.body.accessToken;

    const adminRes = await login(request, adminEmail);
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.accessToken;

    const upRes = await login(request, uploaderEmail);
    expect(upRes.status).toBe(200);
    uploaderToken = upRes.body.accessToken;
  });

  afterAll(async () => {
    if (!prisma) return;
    for (const id of userIds) {
      await prisma.user.deleteMany({ where: { id } }).catch(() => {});
    }
    try {
      if (fs.existsSync(path.join(uploadBase, uploadedFileName))) fs.unlinkSync(path.join(uploadBase, uploadedFileName));
    } catch {
      /* noop */
    }
    await prisma.$disconnect();
  });

  let uploadedFileName = '';
  it('VIEWER no puede listar usuarios (403)', async () => {
    const res = await request.get('/api/users').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('VIEWER no puede listar posts (403 por posts.manage)', async () => {
    const res = await request.get('/api/posts').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('VIEWER no puede crear posts (403)', async () => {
    const res = await request.post('/api/posts').set('Authorization', `Bearer ${viewerToken}`).send({ title: 'x' });
    expect(res.status).toBe(403);
  });

  it('VIEWER no puede subir archivos (403 por media.upload)', async () => {
    const res = await request
      .post('/api/uploads/')
      .set('Authorization', `Bearer ${viewerToken}`)
      .attach('file', Buffer.from('no'), { filename: 'x.png', contentType: 'image/png' });
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN puede listar usuarios (200)', async () => {
    const res = await request.get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('SUPER_ADMIN puede listar posts (200)', async () => {
    const res = await request.get('/api/posts').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBe(true);
  });

  it('usuario con media.upload puede subir archivos (201)', async () => {
    const res = await request
      .post('/api/uploads/')
      .set('Authorization', `Bearer ${uploaderToken}`)
      .attach('file', PNG_1X1, { filename: 'pixel.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.file).toBeDefined();
    expect(res.body.file.url).toContain('/files/');
    uploadedFileName = res.body.file.fileName;
  });

  it('sin token responde 401', async () => {
    const res = await request.get('/api/users');
    expect(res.status).toBe(401);
  });
});
