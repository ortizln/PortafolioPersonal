const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const publicController = {
  async getPortfolio(req, res, next) {
    try {
      const [
        profile,
        experiences,
        education,
        certifications,
        skills,
        languages,
        socialLinks,
        featuredProjects,
        repositories
      ] = await Promise.all([
        prisma.profile.findFirst({
          where: { deletedAt: null }
        }),
        prisma.experience.findMany({
          where: { deletedAt: null },
          orderBy: [{ current: 'desc' }, { startDate: 'desc' }]
        }),
        prisma.education.findMany({
          where: { deletedAt: null },
          include: { certificates: { where: { deletedAt: null }, include: { files: true } } },
          orderBy: { startDate: 'desc' }
        }),
        prisma.certification.findMany({
          where: { deletedAt: null },
          include: { files: true },
          orderBy: { issueDate: 'desc' }
        }),
        prisma.skill.findMany({
          where: { deletedAt: null },
          orderBy: [{ category: 'asc' }, { order: 'asc' }]
        }),
        prisma.language.findMany({
          where: { deletedAt: null },
          orderBy: { percentage: 'desc' }
        }),
        prisma.socialLink.findMany({
          where: { deletedAt: null, isActive: true },
          orderBy: { order: 'asc' }
        }),
        prisma.project.findMany({
          where: { deletedAt: null, isFeatured: true },
          include: {
            images: true,
            technologies: { include: { technology: true } },
            categories: { include: { category: true } }
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
        }),
        prisma.repository.findMany({
          where: { deletedAt: null, isPrivate: false },
          orderBy: { stars: 'desc' },
          take: 6
        })
      ]);

      const skillsByCategory = skills.reduce((acc, skill) => {
        const category = skill.category || 'OTHER';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {});

      res.json({
        profile,
        experiences,
        education,
        certifications,
        skills: skillsByCategory,
        languages,
        socialLinks,
        featuredProjects,
        repositories
      });
    } catch (error) {
      next(error);
    }
  },

  async getProject(req, res, next) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        }
      });

      if (!project || project.deletedAt) {
        throw new AppError('Project not found', 404);
      }

      res.json({ project });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Project not found', 404));
      next(error);
    }
  },

  async getProjects(req, res, next) {
    try {
      const projects = await prisma.project.findMany({
        where: { deletedAt: null },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });

      res.json({ projects });
    } catch (error) {
      next(error);
    }
  },

  async getExperiences(req, res, next) {
    try {
      const experiences = await prisma.experience.findMany({
        where: { deletedAt: null },
        orderBy: [{ current: 'desc' }, { startDate: 'desc' }]
      });

      res.json({ experiences });
    } catch (error) {
      next(error);
    }
  },

  async getEducation(req, res, next) {
    try {
      const education = await prisma.education.findMany({
        where: { deletedAt: null },
        include: {
          certificates: {
            where: { deletedAt: null },
            include: { files: true }
          }
        },
        orderBy: { startDate: 'desc' }
      });

      res.json({ education });
    } catch (error) {
      next(error);
    }
  },

  async getCertifications(req, res, next) {
    try {
      const certifications = await prisma.certification.findMany({
        where: { deletedAt: null },
        include: { files: true },
        orderBy: { issueDate: 'desc' }
      });

      res.json({ certifications });
    } catch (error) {
      next(error);
    }
  },

  async getSkills(req, res, next) {
    try {
      const skills = await prisma.skill.findMany({
        where: { deletedAt: null },
        orderBy: [{ category: 'asc' }, { order: 'asc' }]
      });

      const skillsByCategory = skills.reduce((acc, skill) => {
        const category = skill.category || 'OTHER';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {});

      res.json({ skills: skillsByCategory });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = publicController;
