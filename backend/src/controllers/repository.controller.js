const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const repositoryController = {
  async getAll(req, res, next) {
    try {
      const repositories = await prisma.repository.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { stars: 'desc' }
      });

      res.json(repositories);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const repository = await prisma.repository.findUnique({
        where: { id: req.params.id }
      });

      if (!repository || repository.deletedAt || repository.userId !== req.user.id) {
        throw new AppError('Repository not found', 404);
      }

      res.json({ repository });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Repository not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, fullName, description, url, platform, language, stars, forks, isPrivate, lastPushed, topics } = req.body;

      const repository = await prisma.repository.create({
        data: {
          userId: req.user.id,
          name,
          fullName,
          description: description || null,
          url,
          platform,
          language: language || null,
          stars: stars || 0,
          forks: forks || 0,
          isPrivate: isPrivate || false,
          lastPushed: lastPushed ? new Date(lastPushed) : null,
          topics: topics || []
        }
      });

      res.status(201).json({ repository });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.repository.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Repository not found', 404);
      }

      const { name, fullName, description, url, platform, language, stars, forks, isPrivate, lastPushed, topics } = req.body;

      const repository = await prisma.repository.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(fullName !== undefined && { fullName }),
          ...(description !== undefined && { description: description || null }),
          ...(url !== undefined && { url }),
          ...(platform !== undefined && { platform }),
          ...(language !== undefined && { language: language || null }),
          ...(stars !== undefined && { stars }),
          ...(forks !== undefined && { forks }),
          ...(isPrivate !== undefined && { isPrivate }),
          ...(lastPushed !== undefined && { lastPushed: lastPushed ? new Date(lastPushed) : null }),
          ...(topics !== undefined && { topics })
        }
      });

      res.json({ repository });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Repository not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.repository.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Repository not found', 404);
      }

      await prisma.repository.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Repository deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Repository not found', 404));
      next(error);
    }
  },

  async syncFromGithub(req, res, next) {
    try {
      res.json({ message: 'GitHub sync endpoint ready' });
    } catch (error) {
      next(error);
    }
  },

  async syncFromGitlab(req, res, next) {
    try {
      res.json({ message: 'GitLab sync endpoint ready' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = repositoryController;
