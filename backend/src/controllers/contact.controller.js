const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'CLOSED'];

async function notifyAdmins(title, message, link) {
  try {
    const admins = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
      take: 50
    });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({ userId: a.id, title, message, link, type: 'MESSAGE' }))
    });
  } catch (error) {
    // no romper el flujo
  }
}

const contactController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, status, search, unreadOnly } = req.query;
      const skip = (Math.max(parseInt(page) - 1, 0)) * parseInt(limit);

      const where = {};
      if (status && status !== 'ALL') where.status = status;
      if (unreadOnly === 'true') where.isRead = false;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [contacts, total, byStatus] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            assignedUser: { select: { id: true, name: true, email: true } }
          }
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.groupBy({ by: ['status'], _count: { _all: true } })
      ]);

      const statusCounts = {};
      byStatus.forEach((s) => {
        statusCounts[s.status] = s._count._all;
      });

      res.json({
        contacts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        statusCounts,
        statuses: LEAD_STATUSES
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const contact = await prisma.contactMessage.findUnique({
        where: { id: req.params.id },
        include: { assignedUser: { select: { id: true, name: true, email: true } } }
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
      const { name, email, subject, message, source } = req.body;

      const contact = await prisma.contactMessage.create({
        data: { name, email, subject, message, source: source || 'website' }
      });

      await notifyAdmins(`Nuevo mensaje de ${name}`, email, '/admin/leads');

      res.status(201).json({ contact });
    } catch (error) {
      next(error);
    }
  },

  async updateLead(req, res, next) {
    try {
      const { status, notes, assignedToId, isRead } = req.body;

      const existing = await prisma.contactMessage.findUnique({
        where: { id: req.params.id }
      });
      if (!existing) throw new AppError('Contact not found', 404);

      if (status && !LEAD_STATUSES.includes(status)) {
        throw new AppError('Invalid lead status', 400);
      }

      const data = {};
      if (status) data.status = status;
      if (notes !== undefined) data.notes = notes;
      if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
      if (isRead !== undefined) data.isRead = isRead;

      const contact = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data,
        include: { assignedUser: { select: { id: true, name: true, email: true } } }
      });

      res.json({ contact });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Contact not found', 404));
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
