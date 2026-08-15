const prisma = require('../config/database');

const auditController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, entity, action, search } = req.query;
      const skip = (Math.max(parseInt(page) - 1, 0)) * parseInt(limit);

      const where = {};
      if (entity) where.entity = entity;
      if (action) where.action = action;
      if (search) {
        where.description = { contains: search, mode: 'insensitive' };
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            user: { select: { id: true, email: true, name: true } }
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = auditController;
