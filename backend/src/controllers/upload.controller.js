const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const path = require('path');
const fs = require('fs');

const uploadBase = path.join(__dirname, '..', '..', 'uploads');

const resolveDiskPath = (storedPath) => {
  if (!storedPath) return null;
  return path.join(uploadBase, storedPath);
};

const uploadController = {
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const fieldname = req.file.fieldname;
      const urlPath = `${fieldname}s/${req.file.filename}`;

      const file = await prisma.mediaFile.create({
        data: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: urlPath,
          url: `/${urlPath}`,
          fieldname,
          folder: `${fieldname}s`,
          uploadedBy: req.user?.id || null
        }
      });

      res.status(201).json({ file });
    } catch (error) {
      next(error);
    }
  },

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      let thumbnailPath = null;
      let thumbUrlPath = null;
      let width = null;
      let height = null;

      const sharp = require('sharp');
      try {
        const metadata = await sharp(req.file.path).metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        const thumbDir = path.join(uploadBase, 'thumbnails');
        if (!fs.existsSync(thumbDir)) {
          fs.mkdirSync(thumbDir, { recursive: true });
        }
        const thumbFilename = `thumb_${req.file.filename}`;
        await sharp(req.file.path)
          .resize(300, 300, { fit: 'cover' })
          .toFile(path.join(thumbDir, thumbFilename));
        thumbnailPath = path.join(thumbDir, thumbFilename);
        thumbUrlPath = `thumbnails/${thumbFilename}`;
      } catch {
        thumbnailPath = null;
      }

      const fieldname = req.file.fieldname || 'image';
      const urlPath = `${fieldname}s/${req.file.filename}`;

      const image = await prisma.mediaFile.create({
        data: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: urlPath,
          url: `/${urlPath}`,
          width,
          height,
          fieldname,
          folder: `${fieldname}s`,
          thumbnail: thumbUrlPath,
          uploadedBy: req.user?.id || null
        }
      });

      res.status(201).json({ image });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req, res, next) {
    try {
      const file = await prisma.mediaFile.findFirst({
        where: { fileName: req.params.filename, deletedAt: null }
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      try {
        const diskPath = resolveDiskPath(file.path);
        if (diskPath && fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
        const thumbPath = resolveDiskPath(file.thumbnail);
        if (thumbPath && fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      } catch {
        // ignore file system errors
      }

      await prisma.mediaFile.delete({
        where: { id: file.id }
      });

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('File not found', 404));
      next(error);
    }
  }
};

module.exports = uploadController;
