const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const userController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const skip = (page - 1) * limit;

      const where = { deletedAt: null };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: { id: true, email: true, name: true, role: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      res.json({ users, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true, email: true, name: true, role: true, isActive: true,
          lastLogin: true, createdAt: true, updatedAt: true,
          profile: true
        }
      });

      if (!user || user.deletedAt) throw new AppError('User not found', 404);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { password, ...data } = req.body;

      if (password) {
        data.password = await bcrypt.hash(password, 12);
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true }
      });

      res.json({ user });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('User not found', 404));
      if (error.code === 'P2002') return next(new AppError('Email already in use', 409));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      if (req.params.id === req.user.id) {
        throw new AppError('Cannot delete yourself', 403);
      }

      await prisma.user.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false }
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('User not found', 404));
      next(error);
    }
  }
};

module.exports = userController;
