const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const publicController = {
  async getPortfolio(req, res, next) {
    try {
      // Find the most recently updated profile to determine the active user
      const profile = await prisma.profile.findFirst({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' }
      });

      if (!profile) {
        return res.json({ profile: null, experiences: [], education: [], certifications: [], skills: {}, languages: [], socialLinks: [], featuredProjects: [], repositories: [] });
      }

      const userId = profile.userId;

      const [
        experiences,
        education,
        certifications,
        skills,
        languages,
        socialLinks,
        featuredProjects,
        repositories
      ] = await Promise.all([
        prisma.experience.findMany({
          where: { deletedAt: null, userId },
          orderBy: [{ current: 'desc' }, { startDate: 'desc' }]
        }),
        prisma.education.findMany({
          where: { deletedAt: null, userId },
          include: { certificates: { where: { deletedAt: null }, include: { files: true } } },
          orderBy: { startDate: 'desc' }
        }),
        prisma.certification.findMany({
          where: { deletedAt: null, userId },
          include: { files: true },
          orderBy: { issueDate: 'desc' }
        }),
        prisma.skill.findMany({
          where: { deletedAt: null, userId },
          orderBy: [{ category: 'asc' }, { order: 'asc' }]
        }),
        prisma.language.findMany({
          where: { deletedAt: null, userId },
          orderBy: { percentage: 'desc' }
        }),
        prisma.socialLink.findMany({
          where: { deletedAt: null, userId, isActive: true },
          orderBy: { order: 'asc' }
        }),
        prisma.project.findMany({
          where: { deletedAt: null, userId, isFeatured: true },
          include: {
            images: true,
            technologies: { include: { technology: true } },
            categories: { include: { category: true } }
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
        }),
        prisma.repository.findMany({
          where: { deletedAt: null, userId, isPrivate: false },
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
      const profile = await prisma.profile.findFirst({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' }
      });
      const userId = profile?.userId;
      const projects = userId ? await prisma.project.findMany({
        where: { deletedAt: null, userId },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } }
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      }) : [];

      res.json({ projects });
    } catch (error) {
      next(error);
    }
  },

  async getExperiences(req, res, next) {
    try {
      const profile = await prisma.profile.findFirst({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' }
      });
      const userId = profile?.userId;
      const experiences = userId ? await prisma.experience.findMany({
        where: { deletedAt: null, userId },
        orderBy: [{ current: 'desc' }, { startDate: 'desc' }]
      }) : [];

      res.json({ experiences });
    } catch (error) {
      next(error);
    }
  },

  async getEducation(req, res, next) {
    try {
      const profile = await prisma.profile.findFirst({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' }
      });
      const userId = profile?.userId;
      const education = userId ? await prisma.education.findMany({
        where: { deletedAt: null, userId },
        include: {
          certificates: {
            where: { deletedAt: null },
            include: { files: true }
          }
        },
        orderBy: { startDate: 'desc' }
      }) : [];

      res.json({ education });
    } catch (error) {
      next(error);
    }
  },

  async getCertifications(req, res, next) {
    try {
      const profile = await prisma.profile.findFirst({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' }
      });
      const userId = profile?.userId;
      const certifications = userId ? await prisma.certification.findMany({
        where: { deletedAt: null, userId },
        include: { files: true },
        orderBy: { issueDate: 'desc' }
      }) : [];

      res.json({ certifications });
    } catch (error) {
      next(error);
    }
  },

  async getSkills(req, res, next) {
    try {
      const profile = await prisma.profile.findFirst({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' }
      });
      const userId = profile?.userId;
      const skills = userId ? await prisma.skill.findMany({
        where: { deletedAt: null, userId },
        orderBy: [{ category: 'asc' }, { order: 'asc' }]
      }) : [];

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
