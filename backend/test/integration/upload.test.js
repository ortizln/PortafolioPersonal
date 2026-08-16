import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupApp, dbAvailable, createTestUser, login } from '../helpers/integration';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadBase = path.join(__dirname, '..', '..', 'uploads');

process.env.MAX_FILE_SIZE = '1024';

const suffix = Date.now().toString(36);
const email = `upload_${suffix}@test.local`;

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const available = await dbAvailable();
const describeIf = available ? describe : describe.skip;

describeIf('integración: uploads', () => {
  let request;
  let prisma;
  let token;
  let userId;
  const createdFiles = [];

  beforeAll(async () => {
    ({ request, prisma } = await setupApp());
    const user = await createTestUser(prisma, { email, roleName: `T_UP_${suffix}`, permissionNames: ['media.upload'] });
    userId = user.id;
    const res = await login(request, email);
    expect(res.status).toBe(200);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    for (const f of createdFiles) {
      const candidates = [
        path.join(uploadBase, f.fileName),
        path.join(uploadBase, f.path),
        path.join(uploadBase, 'thumbnails', `thumb_${f.fileName}`)
      ];
      for (const p of candidates) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {
          /* noop */
        }
      }
    }
    if (prisma) {
      await prisma.mediaFile.deleteMany({ where: { uploadedBy: userId } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
      await prisma.$disconnect();
    }
  });

  it('sube una imagen PNG válida (201, con dimensiones y thumbnail)', async () => {
    const res = await request
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', PNG_1X1, { filename: 'pixel.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.image).toBeDefined();
    expect(res.body.image.width).toBe(1);
    expect(res.body.image.height).toBe(1);
    expect(res.body.image.url).toContain('/images/');
    createdFiles.push(res.body.image);
  });

  it('rechaza un tipo de archivo no permitido (400)', async () => {
    const res = await request
      .post('/api/uploads/')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('Hola'), { filename: 'nota.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('rechaza un archivo que excede el límite (400)', async () => {
    const res = await request
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.alloc(2048, 1), { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('no permite subir sin token (401)', async () => {
    const res = await request
      .post('/api/uploads/image')
      .attach('image', PNG_1X1, { filename: 'pixel.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });
});
