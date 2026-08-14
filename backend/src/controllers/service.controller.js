const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');

const serviceController = {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const where = { deletedAt: null };
      if (status) where.status = status;

      const services = await prisma.service.findMany({
        where,
        include: {
          features: { orderBy: { order: 'asc' } },
          technologies: { include: { technology: true } },
          _count: { select: { features: true, technologies: true } }
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });

      res.json(services);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: req.params.id },
        include: {
          features: { orderBy: { order: 'asc' } },
          technologies: { include: { technology: true } },
          _count: { select: { features: true, technologies: true } }
        }
      });

      if (!service || service.deletedAt) {
        throw new AppError('Service not found', 404);
      }

      res.json({ service });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Service not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, shortDescription, description, icon, coverImage, status, order, isFeatured, seoTitle, seoDescription, features, technologyIds } = req.body;
      if (!name) throw new AppError('Name is required', 400);

      const slug = slugify(name, { lower: true, strict: true });

      const service = await prisma.service.create({
        data: {
          name, slug, shortDescription, description, icon, coverImage,
          status, order: order !== undefined ? Number(order) : 0,
          isFeatured: !!isFeatured, seoTitle, seoDescription,
          features: features?.length ? {
            create: features.map((f, i) => ({
              name: f.name, description: f.description, icon: f.icon, order: f.order ?? i
            }))
          } : undefined,
          technologies: technologyIds?.length ? {
            create: technologyIds.map((id) => ({ technologyId: id }))
          } : undefined
        },
        include: {
          features: { orderBy: { order: 'asc' } },
          technologies: { include: { technology: true } }
        }
      });

      res.status(201).json({ service });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Service not found', 404);
      }

      const { name, shortDescription, description, icon, coverImage, status, order, isFeatured, seoTitle, seoDescription, features, technologyIds } = req.body;
      const data = {};

      if (name !== undefined) {
        data.name = name;
        data.slug = slugify(name, { lower: true, strict: true });
      }
      if (shortDescription !== undefined) data.shortDescription = shortDescription;
      if (description !== undefined) data.description = description;
      if (icon !== undefined) data.icon = icon;
      if (coverImage !== undefined) data.coverImage = coverImage;
      if (status !== undefined) data.status = status;
      if (order !== undefined) data.order = Number(order);
      if (isFeatured !== undefined) data.isFeatured = !!isFeatured;
      if (seoTitle !== undefined) data.seoTitle = seoTitle;
      if (seoDescription !== undefined) data.seoDescription = seoDescription;

      if (features) {
        await prisma.serviceFeature.deleteMany({ where: { serviceId: existing.id } });
        if (features.length) {
          await prisma.serviceFeature.createMany({
            data: features.map((f, i) => ({
              serviceId: existing.id,
              name: f.name,
              description: f.description,
              icon: f.icon,
              order: f.order ?? i
            }))
          });
        }
      }

      if (technologyIds) {
        await prisma.serviceTechnology.deleteMany({ where: { serviceId: existing.id } });
        if (technologyIds.length) {
          await prisma.serviceTechnology.createMany({
            data: technologyIds.map((id) => ({ serviceId: existing.id, technologyId: id }))
          });
        }
      }

      const service = await prisma.service.update({
        where: { id: existing.id },
        data,
        include: {
          features: { orderBy: { order: 'asc' } },
          technologies: { include: { technology: true } }
        }
      });

      res.json({ service });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Service not found', 404));
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Service not found', 404);
      }

      await prisma.service.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Service not found', 404));
      next(error);
    }
  }
};

module.exports = serviceController;
