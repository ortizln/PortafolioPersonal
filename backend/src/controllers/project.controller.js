const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const projectController = {
  async getAll(req, res, next) {
    try {
      const projects = await prisma.project.findMany({
        where: { userId: req.user.id, deletedAt: null },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        },
        orderBy: { order: 'asc' }
      });

      res.json(projects);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        }
      });

      if (!project || project.deletedAt || project.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      res.json({ project });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, summary, client, status, startDate, endDate, demoUrl, githubUrl, gitlabUrl, videoUrl, bannerImage, architecture, features, isFeatured, order, technologyIds, categoryIds } = req.body;

      const project = await prisma.project.create({
        data: {
          userId: req.user.id,
          title,
          description,
          summary,
          client,
          status: status ? status.toUpperCase() : 'DRAFT',
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          demoUrl,
          githubUrl,
          gitlabUrl,
          videoUrl,
          bannerImage,
          architecture,
          features: features || [],
          isFeatured: isFeatured || false,
          order: order || 0,
          technologies: technologyIds?.length ? {
            create: technologyIds.map(technologyId => ({ technologyId }))
          } : undefined,
          categories: categoryIds?.length ? {
            create: categoryIds.map(catId => ({ categoryId: catId }))
          } : undefined
        },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        }
      });

      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      const { title, description, summary, client, status, startDate, endDate, demoUrl, githubUrl, gitlabUrl, videoUrl, bannerImage, architecture, features, isFeatured, order, technologyIds, categoryIds } = req.body;

      if (technologyIds !== undefined) {
        await prisma.projectTechnology.deleteMany({ where: { projectId: req.params.id } });
        if (technologyIds.length > 0) {
          await prisma.projectTechnology.createMany({
            data: technologyIds.map(techId => ({ projectId: req.params.id, technologyId: techId }))
          });
        }
      }

      if (categoryIds !== undefined) {
        await prisma.projectCategory.deleteMany({ where: { projectId: req.params.id } });
        if (categoryIds.length > 0) {
          await prisma.projectCategory.createMany({
            data: categoryIds.map(catId => ({ projectId: req.params.id, categoryId: catId }))
          });
        }
      }

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(summary !== undefined && { summary }),
          ...(client !== undefined && { client }),
          ...(status !== undefined && { status: status.toUpperCase() }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(demoUrl !== undefined && { demoUrl }),
          ...(githubUrl !== undefined && { githubUrl }),
          ...(gitlabUrl !== undefined && { gitlabUrl }),
          ...(videoUrl !== undefined && { videoUrl }),
          ...(bannerImage !== undefined && { bannerImage }),
          ...(architecture !== undefined && { architecture }),
          ...(features !== undefined && { features }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(order !== undefined && { order })
        },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        }
      });

      res.json({ project });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt || existing.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      await prisma.project.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async addImage(req, res, next) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!project || project.deletedAt || project.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const urlPath = `projects/${req.file.filename}`;

      const image = await prisma.projectImage.create({
        data: {
          projectId: req.params.id,
          url: urlPath,
          isPrimary: req.body.isPrimary === 'true',
        }
      });

      res.status(201).json(image);
    } catch (error) {
      next(error);
    }
  },

  async removeImage(req, res, next) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!project || project.deletedAt || project.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      const image = await prisma.projectImage.findUnique({
        where: { id: req.params.imageId }
      });

      if (!image || image.projectId !== req.params.id) {
        throw new AppError('Image not found', 404);
      }

      await prisma.projectImage.delete({
        where: { id: req.params.imageId }
      });

      res.json({ message: 'Image removed successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Image not found', 404));
      next(error);
    }
  }
};

module.exports = projectController;
