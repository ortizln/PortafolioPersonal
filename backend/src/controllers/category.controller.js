const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');

const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { projects: true } } },
        orderBy: { name: 'asc' }
      });

      res.json(categories);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { projects: true } } }
      });

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      res.json({ category });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Category not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const slug = slugify(name, { lower: true, strict: true });

      const category = await prisma.category.create({
        data: { name, description, slug },
        include: { _count: { select: { projects: true } } }
      });

      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.category.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        throw new AppError('Category not found', 404);
      }

      const { name, description } = req.body;
      const data = {};

      if (name !== undefined) {
        data.name = name;
        data.slug = slugify(name, { lower: true, strict: true });
      }
      if (description !== undefined) {
        data.description = description;
      }

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data,
        include: { _count: { select: { projects: true } } }
      });

      res.json({ category });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Category not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.category.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        throw new AppError('Category not found', 404);
      }

      await prisma.category.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Category not found', 404));
      next(error);
    }
  }
};

module.exports = categoryController;
