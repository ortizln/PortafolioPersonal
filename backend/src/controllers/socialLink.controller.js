const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const socialLinkController = {
  async getAll(req, res, next) {
    try {
      const socialLinks = await prisma.socialLink.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { order: 'asc' }
      });

      res.json(socialLinks);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const socialLink = await prisma.socialLink.findUnique({
        where: { id: req.params.id }
      });

      if (!socialLink || socialLink.deletedAt || socialLink.userId !== req.user.id) {
        throw new AppError('Social link not found', 404);
      }

      res.json({ socialLink });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Social link not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { platform, url, icon, order, isActive } = req.body;

      const socialLink = await prisma.socialLink.create({
        data: {
          userId: req.user.id,
          platform,
          url,
          icon: icon || null,
          order: order || 0,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      res.status(201).json({ socialLink });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.socialLink.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Social link not found', 404);
      }

      const { platform, url, icon, order, isActive } = req.body;

      const socialLink = await prisma.socialLink.update({
        where: { id: req.params.id },
        data: {
          ...(platform !== undefined && { platform }),
          ...(url !== undefined && { url }),
          ...(icon !== undefined && { icon: icon || null }),
          ...(order !== undefined && { order }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json({ socialLink });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Social link not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.socialLink.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Social link not found', 404);
      }

      await prisma.socialLink.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Social link deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Social link not found', 404));
      next(error);
    }
  }
};

module.exports = socialLinkController;
