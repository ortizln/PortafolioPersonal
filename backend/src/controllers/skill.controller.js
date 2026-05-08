const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const skillController = {
  async getAll(req, res, next) {
    try {
      const skills = await prisma.skill.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { order: 'asc' }
      });

      res.json(skills);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const skill = await prisma.skill.findUnique({
        where: { id: req.params.id }
      });

      if (!skill || skill.deletedAt || skill.userId !== req.user.id) {
        throw new AppError('Skill not found', 404);
      }

      res.json({ skill });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Skill not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, percentage, level, icon, color, order, category, technologyId } = req.body;

      const skill = await prisma.skill.create({
        data: {
          userId: req.user.id,
          name,
          percentage,
          level,
          icon,
          color,
          order: order || 0,
          category,
          technologyId: technologyId || null
        }
      });

      res.status(201).json({ skill });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.skill.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Skill not found', 404);
      }

      const { name, percentage, level, icon, color, order, category, technologyId } = req.body;

      const skill = await prisma.skill.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(percentage !== undefined && { percentage }),
          ...(level !== undefined && { level }),
          ...(icon !== undefined && { icon }),
          ...(color !== undefined && { color }),
          ...(order !== undefined && { order }),
          ...(category !== undefined && { category }),
          ...(technologyId !== undefined && { technologyId: technologyId || null })
        }
      });

      res.json({ skill });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Skill not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.skill.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Skill not found', 404);
      }

      await prisma.skill.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Skill not found', 404));
      next(error);
    }
  }
};

module.exports = skillController;
