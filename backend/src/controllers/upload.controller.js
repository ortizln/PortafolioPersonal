const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const path = require('path');
const fs = require('fs');

const uploadController = {
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const fieldname = req.file.fieldname;
      const urlPath = `${fieldname}s/${req.file.filename}`;

      const file = await prisma.uploadedFile.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: urlPath,
          fieldname
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

      if (typeof sharp !== 'undefined') {
        try {
          const sharp = require('sharp');
          const thumbDir = path.join(__dirname, '..', '..', 'uploads', 'thumbnails');
          if (!fs.existsSync(thumbDir)) {
            fs.mkdirSync(thumbDir, { recursive: true });
          }
          const thumbFilename = `thumb_${req.file.filename}`;
          await sharp(req.file.path)
            .resize(300, 300, { fit: 'cover' })
            .toFile(path.join(thumbDir, thumbFilename));
          thumbnailPath = path.join(thumbDir, thumbFilename);
        } catch {
          thumbnailPath = req.file.path;
        }
      }

      const urlPath = `${req.file.fieldname || 'image'}s/${req.file.filename}`;
      const thumbUrlPath = thumbnailPath ? `thumbnails/thumb_${req.file.filename}` : null;

      const image = await prisma.uploadedFile.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: urlPath,
          fieldname: req.file.fieldname || 'image',
          thumbnail: thumbUrlPath
        }
      });

      res.status(201).json({ image });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req, res, next) {
    try {
      const file = await prisma.uploadedFile.findFirst({
        where: { filename: req.params.filename }
      });

      if (!file) {
        throw new AppError('File not found', 404);
      }

      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        if (file.thumbnail && fs.existsSync(file.thumbnail)) {
          fs.unlinkSync(file.thumbnail);
        }
      } catch {
        // ignore file system errors
      }

      await prisma.uploadedFile.delete({
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
