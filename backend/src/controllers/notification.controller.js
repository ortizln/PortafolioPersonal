const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const notificationController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, unreadOnly } = req.query;
      const skip = (Math.max(parseInt(page) - 1, 0)) * parseInt(limit);
      const where = { userId: req.user.id };
      if (unreadOnly === 'true') where.readAt = null;

      const [notifications, total, unread] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId: req.user.id, readAt: null } })
      ]);

      res.json({ notifications, total, unread, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req, res, next) {
    try {
      const notification = await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user.id },
        data: { readAt: new Date() }
      });
      if (notification.count === 0) throw new AppError('Notification not found', 404);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  },

  async markAllRead(req, res, next) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, readAt: null },
        data: { readAt: new Date() }
      });
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;
