const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const settingController = {
  async getAll(req, res, next) {
    try {
      const settings = await prisma.setting.findMany({
        orderBy: { key: 'asc' }
      });

      res.json(settings);
    } catch (error) {
      next(error);
    }
  },

  async getByKey(req, res, next) {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: req.params.key }
      });

      if (!setting) {
        throw new AppError('Setting not found', 404);
      }

      res.json({ setting });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { value, description } = req.body;

      const setting = await prisma.setting.upsert({
        where: { key: req.params.key },
        update: {
          ...(value !== undefined && { value }),
          ...(description !== undefined && { description })
        },
        create: {
          key: req.params.key,
          value: value || {},
          description: description || ''
        }
      });

      res.json({ setting });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingController;
