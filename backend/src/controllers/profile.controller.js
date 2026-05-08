const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const profileController = {
  async getProfile(req, res, next) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id }
      });

      if (!profile) throw new AppError('Profile not found', 404);

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: req.body,
        create: { userId: req.user.id, ...req.body }
      });

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },

  async uploadPhoto(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { profileImage: req.file.path },
        create: { userId: req.user.id, fullName: '', professionalTitle: '', profileImage: req.file.path }
      });

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },

  async uploadBanner(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { bannerImage: req.file.path },
        create: { userId: req.user.id, fullName: '', professionalTitle: '', bannerImage: req.file.path }
      });

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  },

  async uploadCV(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { cvFile: req.file.path },
        create: { userId: req.user.id, fullName: '', professionalTitle: '', cvFile: req.file.path }
      });

      res.json({ profile });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = profileController;
