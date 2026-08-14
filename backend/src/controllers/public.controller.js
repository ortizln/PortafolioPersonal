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
  },

  async getCompany(req, res, next) {
    try {
      const company = await prisma.company.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      });
      res.json({ company });
    } catch (error) {
      next(error);
    }
  },

  async getServices(req, res, next) {
    try {
      const services = await prisma.service.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        include: {
          features: { orderBy: { order: 'asc' } },
          technologies: { include: { technology: true } }
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      });
      res.json({ services });
    } catch (error) {
      next(error);
    }
  },

  async getClients(req, res, next) {
    try {
      const clients = await prisma.client.findMany({
        where: { deletedAt: null, isPublic: true },
        orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { name: 'asc' }]
      });
      res.json({ clients });
    } catch (error) {
      next(error);
    }
  },

  async getTestimonials(req, res, next) {
    try {
      const testimonials = await prisma.testimonial.findMany({
        where: { deletedAt: null, isPublished: true },
        include: { client: { select: { id: true, name: true, logoUrl: true, slug: true } } },
        orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }]
      });
      res.json({ testimonials });
    } catch (error) {
      next(error);
    }
  },

  async getTeam(req, res, next) {
    try {
      const members = await prisma.teamMember.findMany({
        where: { deletedAt: null, isActive: true, isPublic: true },
        include: {
          skills: { where: { deletedAt: null }, include: { technology: true }, orderBy: { order: 'asc' } },
          languages: { where: { deletedAt: null }, orderBy: { percentage: 'desc' } },
          socialLinks: { where: { deletedAt: null, isActive: true }, orderBy: { order: 'asc' } },
          _count: { select: { experiences: true, educations: true, certifications: true } }
        },
        orderBy: [{ isFounder: 'desc' }, { order: 'asc' }, { fullName: 'asc' }]
      });
      res.json({ team: members });
    } catch (error) {
      next(error);
    }
  },

  async getTeamMember(req, res, next) {
    try {
      const member = await prisma.teamMember.findFirst({
        where: { slug: req.params.slug, deletedAt: null, isActive: true, isPublic: true },
        include: {
          experiences: { where: { deletedAt: null }, orderBy: [{ current: 'desc' }, { startDate: 'desc' }] },
          educations: { where: { deletedAt: null }, include: { certificates: { where: { deletedAt: null }, include: { files: true } } }, orderBy: { startDate: 'desc' } },
          certifications: { where: { deletedAt: null }, include: { files: true }, orderBy: { issueDate: 'desc' } },
          skills: { where: { deletedAt: null }, include: { technology: true }, orderBy: [{ category: 'asc' }, { order: 'asc' }] },
          languages: { where: { deletedAt: null }, orderBy: { percentage: 'desc' } },
          socialLinks: { where: { deletedAt: null, isActive: true }, orderBy: { order: 'asc' } }
        }
      });

      if (!member) {
        throw new AppError('Team member not found', 404);
      }

      const skillsByCategory = member.skills.reduce((acc, skill) => {
        const category = skill.category || 'OTHER';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {});

      res.json({ member: { ...member, skills: skillsByCategory } });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = publicController;
