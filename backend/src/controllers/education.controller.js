const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const educationController = {
  async getAll(req, res, next) {
    try {
      const educations = await prisma.education.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { startDate: 'desc' }
      });

      res.json(educations);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const education = await prisma.education.findUnique({
        where: { id: req.params.id }
      });

      if (!education || education.deletedAt || education.userId !== req.user.id) {
        throw new AppError('Education not found', 404);
      }

      res.json({ education });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Education not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { institution, degree, field, level, startDate, endDate, current, grade, description } = req.body;

      const education = await prisma.education.create({
        data: {
          userId: req.user.id,
          institution,
          degree,
          field,
          level,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          current: current || false,
          grade,
          description
        }
      });

      res.status(201).json({ education });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.education.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Education not found', 404);
      }

      const { institution, degree, field, level, startDate, endDate, current, grade, description } = req.body;

      const education = await prisma.education.update({
        where: { id: req.params.id },
        data: {
          ...(institution !== undefined && { institution }),
          ...(degree !== undefined && { degree }),
          ...(field !== undefined && { field }),
          ...(level !== undefined && { level }),
          ...(startDate !== undefined && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(current !== undefined && { current }),
          ...(grade !== undefined && { grade }),
          ...(description !== undefined && { description })
        }
      });

      res.json({ education });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Education not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.education.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Education not found', 404);
      }

      await prisma.education.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Education deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Education not found', 404));
      next(error);
    }
  }
};

module.exports = educationController;
