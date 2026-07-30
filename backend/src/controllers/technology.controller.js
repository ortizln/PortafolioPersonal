const prisma = require('../config/database');

const technologyController = {
  async getAll(req, res, next) {
    try {
      const technologies = await prisma.technology.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(technologies);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = technologyController;
