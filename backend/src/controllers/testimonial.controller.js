const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const testimonialController = {
  async getAll(req, res, next) {
    try {
      const { published } = req.query;
      const where = { deletedAt: null };
      if (published !== undefined) where.isPublished = published === 'true';

      const testimonials = await prisma.testimonial.findMany({
        where,
        include: { client: { select: { id: true, name: true, logoUrl: true, slug: true } } },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });
      res.json(testimonials);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const testimonial = await prisma.testimonial.findUnique({
        where: { id: req.params.id },
        include: { client: { select: { id: true, name: true, logoUrl: true, slug: true } } }
      });

      if (!testimonial || testimonial.deletedAt) {
        throw new AppError('Testimonial not found', 404);
      }

      res.json({ testimonial });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Testimonial not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { clientId, authorName, authorPosition, company, content, rating, photoUrl, isPublished, isFeatured, order } = req.body;
      if (!authorName || !content) throw new AppError('authorName and content are required', 400);

      const testimonial = await prisma.testimonial.create({
        data: {
          clientId, authorName, authorPosition, company, content,
          rating: rating !== undefined ? Number(rating) : undefined,
          photoUrl,
          isPublished: isPublished !== undefined ? !!isPublished : true,
          isFeatured: !!isFeatured,
          order: order !== undefined ? Number(order) : 0
        },
        include: { client: { select: { id: true, name: true, logoUrl: true, slug: true } } }
      });

      res.status(201).json({ testimonial });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Testimonial not found', 404);
      }

      const { clientId, authorName, authorPosition, company, content, rating, photoUrl, isPublished, isFeatured, order } = req.body;
      const data = {};

      if (clientId !== undefined) data.clientId = clientId;
      if (authorName !== undefined) data.authorName = authorName;
      if (authorPosition !== undefined) data.authorPosition = authorPosition;
      if (company !== undefined) data.company = company;
      if (content !== undefined) data.content = content;
      if (rating !== undefined) data.rating = Number(rating);
      if (photoUrl !== undefined) data.photoUrl = photoUrl;
      if (isPublished !== undefined) data.isPublished = !!isPublished;
      if (isFeatured !== undefined) data.isFeatured = !!isFeatured;
      if (order !== undefined) data.order = Number(order);

      const testimonial = await prisma.testimonial.update({
        where: { id: existing.id },
        data,
        include: { client: { select: { id: true, name: true, logoUrl: true, slug: true } } }
      });

      res.json({ testimonial });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Testimonial not found', 404));
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) {
        throw new AppError('Testimonial not found', 404);
      }

      await prisma.testimonial.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Testimonial not found', 404));
      next(error);
    }
  }
};

module.exports = testimonialController;
