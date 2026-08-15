const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const path = require('path');
const fs = require('fs');

const uploadBase = path.join(__dirname, '..', '..', 'uploads');

const resolveDiskPath = (storedPath) => {
  if (!storedPath) return null;
  return path.join(uploadBase, storedPath);
};

const mediaController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 24, search, folder, mimeType } = req.query;
      const skip = (Math.max(parseInt(page) - 1, 0)) * parseInt(limit);

      const where = { deletedAt: null };
      if (search) {
        where.OR = [
          { originalName: { contains: search, mode: 'insensitive' } },
          { fileName: { contains: search, mode: 'insensitive' } },
          { altText: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (folder) where.folder = folder;
      if (mimeType) where.mimeType = { startsWith: mimeType };

      const [files, total] = await Promise.all([
        prisma.mediaFile.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.mediaFile.count({ where })
      ]);

      const folders = await prisma.mediaFile.groupBy({
        by: ['folder'],
        where: { deletedAt: null, folder: { not: null } },
        _count: { _all: true }
      });

      res.json({ files, total, page: parseInt(page), limit: parseInt(limit), folders });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
      if (!file) throw new AppError('File not found', 404);
      res.json({ file });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { altText, folder } = req.body;
      const existing = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError('File not found', 404);

      const data = {};
      if (altText !== undefined) data.altText = altText;
      if (folder !== undefined && folder) data.folder = folder;

      const file = await prisma.mediaFile.update({ where: { id: req.params.id }, data });
      res.json({ file });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('File not found', 404));
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
      if (!file) throw new AppError('File not found', 404);

      try {
        const diskPath = resolveDiskPath(file.path);
        if (diskPath && fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
        const thumbPath = resolveDiskPath(file.thumbnail);
        if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      } catch {
        // ignorar errores de filesystem
      }

      await prisma.mediaFile.delete({ where: { id: file.id } });
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('File not found', 404));
      next(error);
    }
  }
};

module.exports = mediaController;
