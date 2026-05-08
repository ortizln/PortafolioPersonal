const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const experienceController = {
  async getAll(req, res, next) {
    try {
      const experiences = await prisma.experience.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { startDate: 'desc' }
      });

      res.json(experiences);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const experience = await prisma.experience.findUnique({
        where: { id: req.params.id }
      });

      if (!experience || experience.deletedAt || experience.userId !== req.user.id) {
        throw new AppError('Experience not found', 404);
      }

      res.json({ experience });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Experience not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { company, position, description, startDate, endDate, current, location, achievements, technologies, companyLogo } = req.body;

      const experience = await prisma.experience.create({
        data: {
          userId: req.user.id,
          company,
          position,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          current: current || false,
          location,
          achievements: achievements || [],
          technologies: technologies || [],
          companyLogo
        }
      });

      res.status(201).json({ experience });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.experience.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Experience not found', 404);
      }

      const { company, position, description, startDate, endDate, current, location, achievements, technologies, companyLogo } = req.body;

      const experience = await prisma.experience.update({
        where: { id: req.params.id },
        data: {
          ...(company !== undefined && { company }),
          ...(position !== undefined && { position }),
          ...(description !== undefined && { description }),
          ...(startDate !== undefined && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(current !== undefined && { current }),
          ...(location !== undefined && { location }),
          ...(achievements !== undefined && { achievements }),
          ...(technologies !== undefined && { technologies }),
          ...(companyLogo !== undefined && { companyLogo })
        }
      });

      res.json({ experience });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Experience not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.experience.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Experience not found', 404);
      }

      await prisma.experience.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Experience deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Experience not found', 404));
      next(error);
    }
  }
};

module.exports = experienceController;
