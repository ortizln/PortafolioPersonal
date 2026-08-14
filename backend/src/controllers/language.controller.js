const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { buildProfileWhere, canManage, memberIdFromBody } = require('../utils/memberScope');

const languageController = {
  async getAll(req, res, next) {
    try {
      const languages = await prisma.language.findMany({
        where: buildProfileWhere(req, { deletedAt: null }),
        orderBy: { percentage: 'desc' }
      });

      res.json(languages);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const language = await prisma.language.findUnique({
        where: { id: req.params.id }
      });

      if (!language || language.deletedAt || !canManage(req, language)) {
        throw new AppError('Language not found', 404);
      }

      res.json({ language });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Language not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, level, percentage, certification } = req.body;

      const language = await prisma.language.create({
        data: {
          userId: req.user.id,
          memberId: memberIdFromBody(req),
          name,
          level,
          percentage,
          certification: certification || null
        }
      });

      res.status(201).json({ language });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.language.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || !canManage(req, existing)) {
        throw new AppError('Language not found', 404);
      }

      const { name, level, percentage, certification } = req.body;
      const memberId = memberIdFromBody(req);

      const language = await prisma.language.update({
        where: { id: req.params.id },
        data: {
          ...(memberId !== undefined && { memberId }),
          ...(name !== undefined && { name }),
          ...(level !== undefined && { level }),
          ...(percentage !== undefined && { percentage }),
          ...(certification !== undefined && { certification: certification || null })
        }
      });

      res.json({ language });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Language not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.language.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || !canManage(req, existing)) {
        throw new AppError('Language not found', 404);
      }

      await prisma.language.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Language deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Language not found', 404));
      next(error);
    }
  }
};

module.exports = languageController;
