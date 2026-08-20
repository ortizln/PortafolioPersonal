const prisma = require('../config/database');

function isStatsAdmin(user) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(user?.rbacRole?.name) ||
    user?.userRoles?.some(ur => ['SUPER_ADMIN', 'ADMIN'].includes(ur.role?.name));
}

const statsController = {
  async getStats(req, res, next) {
    try {
      const admin = isStatsAdmin(req.user);
      const userFilter = admin ? {} : { userId: req.user.id };

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
          where: { ...userFilter, deletedAt: null }
        }),
        prisma.experience.count({
          where: { ...userFilter, deletedAt: null }
        }),
        prisma.education.count({
          where: { ...userFilter, deletedAt: null }
        }),
        prisma.certification.count({
          where: { ...userFilter, deletedAt: null }
        }),
        prisma.skill.count({
          where: { ...userFilter, deletedAt: null }
        }),
        prisma.language.count({
          where: { ...userFilter, deletedAt: null }
        }),
        prisma.contactMessage.count({
          where: admin ? { isRead: false } : { userId: req.user.id, isRead: false }
        }),
        prisma.repository.count({
          where: { ...userFilter, deletedAt: null }
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
      const admin = isStatsAdmin(req.user);
      const userFilter = admin ? {} : { userId: req.user.id };

      const allProjects = await prisma.project.findMany({
        where: { ...userFilter, deletedAt: null },
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
        testimonialsCount,
        leadsByStatus,
        categoriesByProject,
        techByProject,
        topProjects,
        topPages,
        recentAudit,
        recentPosts,
        postsByStatus,
        postsByCategory,
        recentContacts
      ] = await Promise.all([
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.project.count({ where: { deletedAt: null, visibility: 'PUBLIC' } }),
        prisma.teamMember.count({ where: { deletedAt: null } }),
        prisma.service.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
        prisma.client.count({ where: { deletedAt: null } }),
        prisma.contactMessage.count({ where: { isRead: false } }),
        prisma.testimonial.count({ where: { deletedAt: null, isPublished: true } }),
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
        }),
        prisma.post.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: { id: true, title: true, slug: true, publishedAt: true, excerpt: true }
        }),
        prisma.post.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
        prisma.postCategory.findMany({
          select: { id: true, name: true, _count: { select: { posts: true } } },
          orderBy: { name: 'asc' }
        }),
        prisma.contactMessage.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, email: true, subject: true, status: true, createdAt: true, isRead: true }
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

      const postStatusCounts = {};
      postsByStatus.forEach((s) => { postStatusCounts[s.status] = s._count._all; });

      const postCategoryCounts = {};
      postsByCategory.forEach((c) => { postCategoryCounts[c.name] = c._count.posts; });

      res.json({
        stats: {
          projects: projectsCount,
          publishedProjects,
          projectsByStatus: null,
          teamMembers: teamCount,
          services: servicesCount,
          clients: clientsCount,
          testimonials: testimonialsCount,
          unreadMessages,
          leadsByStatus: leadCounts,
          projectsByCategory: categoryCounts,
          projectsByTechnology: technologyCounts,
          postsByStatus: postStatusCounts,
          postsByCategory: postCategoryCounts,
          topProjects,
          topPages,
          messagesByMonth: monthCounts,
          recentAudit,
          recentPosts,
          recentContacts
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = statsController;
