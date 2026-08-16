const prisma = require('../config/database');

const statsController = {
  async getStats(req, res, next) {
    try {
      const [
        projectsCount,
        experiencesCount,
        educationCount,
        certificationsCount,
        skillsCount,
        languagesCount,
        unreadMessagesCount,
        reposCount
      ] = await Promise.all([
        prisma.project.count({
          where: { userId: req.user.id, deletedAt: null }
        }),
        prisma.experience.count({
          where: { userId: req.user.id, deletedAt: null }
        }),
        prisma.education.count({
          where: { userId: req.user.id, deletedAt: null }
        }),
        prisma.certification.count({
          where: { userId: req.user.id, deletedAt: null }
        }),
        prisma.skill.count({
          where: { userId: req.user.id, deletedAt: null }
        }),
        prisma.language.count({
          where: { userId: req.user.id, deletedAt: null }
        }),
        prisma.contactMessage.count({
          where: { userId: req.user.id, isRead: false }
        }),
        prisma.repository.count({
          where: { userId: req.user.id, deletedAt: null }
        })
      ]);

      res.json({
        stats: {
          projects: projectsCount,
          experiences: experiencesCount,
          education: educationCount,
          certifications: certificationsCount,
          skills: skillsCount,
          languages: languagesCount,
          unreadMessages: unreadMessagesCount,
          repositories: reposCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getProjectStats(req, res, next) {
    try {
      const allProjects = await prisma.project.findMany({
        where: { userId: req.user.id, deletedAt: null },
        include: {
          technologies: {
            include: { technology: true }
          }
        }
      });

      const projectsByStatus = allProjects.reduce((acc, project) => {
        const status = project.status || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const techCounts = {};
      allProjects.forEach(project => {
        project.technologies?.forEach(pt => {
          const techName = pt.technology?.name;
          if (techName) {
            techCounts[techName] = (techCounts[techName] || 0) + 1;
          }
        });
      });

      const sortedTechCounts = Object.fromEntries(
        Object.entries(techCounts).sort((a, b) => b[1] - a[1])
      );

      res.json({
        stats: {
          total: allProjects.length,
          byStatus: projectsByStatus,
          technologyCounts: sortedTechCounts
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getCorporateStats(req, res, next) {
    try {
      const [
        projectsCount,
        publishedProjects,
        teamCount,
        servicesCount,
        clientsCount,
        unreadMessages,
        leadsByStatus,
        categoriesByProject,
        techByProject,
        topProjects,
        topPages,
        recentAudit
      ] = await Promise.all([
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.project.count({ where: { deletedAt: null, visibility: 'PUBLIC' } }),
        prisma.teamMember.count({ where: { deletedAt: null } }),
        prisma.service.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        prisma.client.count({ where: { deletedAt: null } }),
        prisma.contactMessage.count({ where: { isRead: false } }),
        prisma.contactMessage.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.projectCategory.groupBy({ by: ['categoryId'], _count: { _all: true } }),
        prisma.projectTechnology.groupBy({ by: ['technologyId'], _count: { _all: true } }),
        prisma.project.findMany({
          where: { deletedAt: null },
          orderBy: { views: 'desc' },
          take: 5,
          select: { id: true, title: true, views: true, slug: true }
        }),
        prisma.pageView.findMany({ orderBy: { count: 'desc' }, take: 5 }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { name: true, email: true } } }
        })
      ]);

      const [categories, technologies] = await Promise.all([
        prisma.category.findMany({ select: { id: true, name: true } }),
        prisma.technology.findMany({ select: { id: true, name: true } })
      ]);

      const categoryCounts = {};
      const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
      categoriesByProject.forEach((c) => {
        categoryCounts[categoryMap[c.categoryId] || c.categoryId] = c._count._all;
      });

      const technologyCounts = {};
      const techMap = Object.fromEntries(technologies.map((t) => [t.id, t.name]));
      techByProject.forEach((t) => {
        technologyCounts[techMap[t.technologyId] || t.technologyId] = t._count._all;
      });

      const leadCounts = {};
      leadsByStatus.forEach((s) => {
        leadCounts[s.status] = s._count._all;
      });

      const messagesByMonth = await prisma.contactMessage.groupBy({
        by: ['createdAt'],
        _count: { _all: true },
        where: { createdAt: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } }
      });
      const monthCounts = {};
      messagesByMonth.forEach((m) => {
        const key = m.createdAt.toISOString().slice(0, 7);
        monthCounts[key] = (monthCounts[key] || 0) + m._count._all;
      });

      res.json({
        stats: {
          projects: projectsCount,
          publishedProjects,
          projectsByStatus: null,
          teamMembers: teamCount,
          services: servicesCount,
          clients: clientsCount,
          unreadMessages,
          leadsByStatus: leadCounts,
          projectsByCategory: categoryCounts,
          projectsByTechnology: technologyCounts,
          topProjects,
          topPages,
          messagesByMonth: monthCounts,
          recentAudit
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = statsController;
