const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const contactController = {
  async getAll(req, res, next) {
    try {
      const contacts = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' }
      });

      res.json(contacts);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const contact = await prisma.contactMessage.findUnique({
        where: { id: req.params.id }
      });

      if (!contact) {
        throw new AppError('Contact not found', 404);
      }

      res.json({ contact });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Contact not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, email, subject, message } = req.body;

      const contact = await prisma.contactMessage.create({
        data: { name, email, subject, message }
      });

      res.status(201).json({ contact });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.contactMessage.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        throw new AppError('Contact not found', 404);
      }

      await prisma.contactMessage.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Contact not found', 404));
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const existing = await prisma.contactMessage.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        throw new AppError('Contact not found', 404);
      }

      const contact = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: { isRead: true }
      });

      res.json({ contact });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Contact not found', 404));
      next(error);
    }
  }
};

module.exports = contactController;
