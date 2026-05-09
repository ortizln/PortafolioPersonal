const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const profileController = {
  async getProfile(req, res, next) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id }
      });

      if (!profile) throw new AppError('Profile not found', 404);

      res.json(profile);
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

      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  async uploadPhoto(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const urlPath = `images/${req.file.filename}`;

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { profileImage: urlPath },
        create: { userId: req.user.id, fullName: '', professionalTitle: '', profileImage: urlPath }
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  async uploadBanner(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const urlPath = `banners/${req.file.filename}`;

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { bannerImage: urlPath },
        create: { userId: req.user.id, fullName: '', professionalTitle: '', bannerImage: urlPath }
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  async uploadCV(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);

      const urlPath = `resumes/${req.file.filename}`;

      const profile = await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: { cvFile: urlPath },
        create: { userId: req.user.id, fullName: '', professionalTitle: '', cvFile: urlPath }
      });

      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = profileController;
