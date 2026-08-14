const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');

const clientController = {
  async getAll(req, res, next) {
    try {
      const clients = await prisma.client.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { testimonials: true } } },
        orderBy: [{ order: 'asc' }, { name: 'asc' }]
      });
      res.json(clients);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const client = await prisma.client.findUnique({
        where: { id: req.params.id },
        include: {
          testimonials: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
          _count: { select: { testimonials: true } }
        }
      });

      if (!client || client.deletedAt) {
        throw new AppError('Client not found', 404);
      }

      res.json({ client });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Client not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, logoUrl, website, industry, description, isPublic, isFeatured, order } = req.body;
      if (!name) throw new AppError('Name is required', 400);

      const client = await prisma.client.create({
        data: {
          name,
          slug: slugify(name, { lower: true, strict: true }),
          logoUrl, website, industry, description,
          isPublic: isPublic !== undefined ? !!isPublic : true,
          isFeatured: !!isFeatured,
          order: order !== undefined ? Number(order) : 0
        },
        include: { _count: { select: { testimonials: true } } }
      });

      res.status(201).json({ client });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Client not found', 404);
      }

      const { name, logoUrl, website, industry, description, isPublic, isFeatured, order } = req.body;
      const data = {};

      if (name !== undefined) {
        data.name = name;
        data.slug = slugify(name, { lower: true, strict: true });
      }
      if (logoUrl !== undefined) data.logoUrl = logoUrl;
      if (website !== undefined) data.website = website;
      if (industry !== undefined) data.industry = industry;
      if (description !== undefined) data.description = description;
      if (isPublic !== undefined) data.isPublic = !!isPublic;
      if (isFeatured !== undefined) data.isFeatured = !!isFeatured;
      if (order !== undefined) data.order = Number(order);

      const client = await prisma.client.update({
        where: { id: existing.id },
        data,
        include: { _count: { select: { testimonials: true } } }
      });

      res.json({ client });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Client not found', 404));
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Client not found', 404);
      }

      await prisma.client.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Client not found', 404));
      next(error);
    }
  }
};

module.exports = clientController;
