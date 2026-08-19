const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const slugify = require('slugify');
const { audit } = require('../helpers/audit');

const projectInclude = {
  images: true,
  technologies: { include: { technology: true } },
  categories: { include: { category: true } },
  clientRel: true,
  service: true,
  members: { include: { teamMember: true }, orderBy: { isLead: 'desc' } }
};

function buildListWhere(req) {
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
    req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
  const where = {};

  if (!isAdmin) {
    where.userId = req.user.id;
  }

  const { search, status, visibility, caseStudy, category, deleted } = req.query;
  where.deletedAt = deleted === 'true' ? { not: null } : null;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) where.status = status.toUpperCase();
  if (visibility) where.visibility = visibility.toUpperCase();
  if (caseStudy !== undefined) where.isCaseStudy = caseStudy === 'true';
  if (category) {
    where.categories = { some: { category: { slug: category } } };
  }
  return where;
}

const projectController = {
  async getAll(req, res, next) {
    try {
      const projects = await prisma.project.findMany({
        where: buildListWhere(req),
        include: projectInclude,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
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
        include: projectInclude
      });

      if (!project || project.deletedAt) {
        throw new AppError('Project not found', 404);
      }
      const isProjectAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
        req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
      if (!isProjectAdmin && project.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      res.json({ project });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const project = await prisma.project.findFirst({
        where: { slug: req.params.slug, deletedAt: null },
        include: projectInclude
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      res.json({ project });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, summary, client, clientId, serviceId, status, projectType, visibility, startDate, endDate, demoUrl, githubUrl, gitlabUrl, videoUrl, bannerImage, architecture, challenge, solution, results, metrics, features, isFeatured, isCaseStudy, order, seoTitle, seoDescription, technologyIds, categoryIds, members } = req.body;

      const project = await prisma.project.create({
        data: {
          userId: req.user.id,
          title,
          slug: slugify(title, { lower: true, strict: true }),
          description,
          summary,
          client,
          clientId: clientId || null,
          serviceId: serviceId || null,
          status: status ? status.toUpperCase() : 'DRAFT',
          projectType,
          visibility: visibility ? visibility.toUpperCase() : 'PUBLIC',
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          demoUrl,
          githubUrl,
          gitlabUrl,
          videoUrl,
          bannerImage,
          architecture,
          challenge,
          solution,
          results,
          metrics: metrics || [],
          features: features || [],
          isFeatured: isFeatured || false,
          isCaseStudy: isCaseStudy || false,
          order: order || 0,
          seoTitle,
          seoDescription,
          technologies: technologyIds?.length ? {
            create: technologyIds.map(technologyId => ({ technologyId }))
          } : undefined,
          categories: categoryIds?.length ? {
            create: categoryIds.map(catId => ({ categoryId: catId }))
          } : undefined,
          members: members?.length ? {
            create: members.map((m) => ({
              teamMemberId: m.teamMemberId,
              role: m.role || null,
              description: m.description || null,
              isLead: !!m.isLead
            }))
          } : undefined
        },
        include: projectInclude
      });

      await audit({
        userId: req.user?.id,
        action: 'CREATE',
        entity: 'Project',
        entityId: project.id,
        description: `Proyecto creado: ${project.title}`,
        req
      });

      res.status(201).json({ project });
    } catch (error) {
      if (error.code === 'P2002') {
        return next(new AppError('Ya existe un proyecto con ese título', 409));
      }
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt) {
        throw new AppError('Project not found', 404);
      }
      const canEdit = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
        req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
      if (!canEdit && existing.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      const { title, description, summary, client, clientId, serviceId, status, projectType, visibility, startDate, endDate, demoUrl, githubUrl, gitlabUrl, videoUrl, bannerImage, architecture, challenge, solution, results, metrics, features, isFeatured, isCaseStudy, order, seoTitle, seoDescription, technologyIds, categoryIds, members } = req.body;

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

      if (members !== undefined) {
        await prisma.projectMember.deleteMany({ where: { projectId: req.params.id } });
        if (members.length > 0) {
          await prisma.projectMember.createMany({
            data: members.map((m) => ({
              projectId: req.params.id,
              teamMemberId: m.teamMemberId,
              role: m.role || null,
              description: m.description || null,
              isLead: !!m.isLead
            }))
          });
        }
      }

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(title !== undefined && { title, slug: slugify(title, { lower: true, strict: true }) }),
          ...(description !== undefined && { description }),
          ...(summary !== undefined && { summary }),
          ...(client !== undefined && { client }),
          ...(clientId !== undefined && { clientId: clientId || null }),
          ...(serviceId !== undefined && { serviceId: serviceId || null }),
          ...(status !== undefined && { status: status.toUpperCase() }),
          ...(projectType !== undefined && { projectType }),
          ...(visibility !== undefined && { visibility: visibility.toUpperCase() }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(demoUrl !== undefined && { demoUrl }),
          ...(githubUrl !== undefined && { githubUrl }),
          ...(gitlabUrl !== undefined && { gitlabUrl }),
          ...(videoUrl !== undefined && { videoUrl }),
          ...(bannerImage !== undefined && { bannerImage }),
          ...(architecture !== undefined && { architecture }),
          ...(challenge !== undefined && { challenge }),
          ...(solution !== undefined && { solution }),
          ...(results !== undefined && { results }),
          ...(metrics !== undefined && { metrics }),
          ...(features !== undefined && { features }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(isCaseStudy !== undefined && { isCaseStudy }),
          ...(order !== undefined && { order }),
          ...(seoTitle !== undefined && { seoTitle }),
          ...(seoDescription !== undefined && { seoDescription })
        },
        include: projectInclude
      });

      await audit({
        userId: req.user?.id,
        action: 'UPDATE',
        entity: 'Project',
        entityId: project.id,
        description: `Proyecto actualizado: ${project.title}`,
        req
      });

      res.json({ project });
    } catch (error) {
      if (error.code === 'P2002') {
        return next(new AppError('Ya existe un proyecto con ese título', 409));
      }
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!existing || existing.deletedAt) {
        throw new AppError('Project not found', 404);
      }
      const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
        req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
      if (!canDelete && existing.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      await prisma.project.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      });

      await audit({
        userId: req.user?.id,
        action: 'DELETE',
        entity: 'Project',
        entityId: existing.id,
        description: `Proyecto eliminado: ${existing.title}`,
        req
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async restore(req, res, next) {
    try {
      const existing = await prisma.project.findUnique({
        where: { id: req.params.id }
      });

      if (!existing) {
        throw new AppError('Project not found', 404);
      }
      if (!existing.deletedAt) {
        throw new AppError('Project is not deleted', 400);
      }
      const canRestore = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
        req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
      if (!canRestore && existing.userId !== req.user.id) {
        throw new AppError('Project not found', 404);
      }

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: { deletedAt: null },
        include: projectInclude
      });

      await audit({
        userId: req.user?.id,
        action: 'UPDATE',
        entity: 'Project',
        entityId: project.id,
        description: `Proyecto restaurado: ${project.title}`,
        req
      });

      res.json({ project });
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

      if (!project || project.deletedAt) {
        throw new AppError('Project not found', 404);
      }
      const canEditImage = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
        req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
      if (!canEditImage && project.userId !== req.user.id) {
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

      if (!project || project.deletedAt) {
        throw new AppError('Project not found', 404);
      }
      const canEditImage = ['SUPER_ADMIN', 'ADMIN'].includes(req.user?.rbacRole?.name) ||
        req.user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
      if (!canEditImage && project.userId !== req.user.id) {
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
