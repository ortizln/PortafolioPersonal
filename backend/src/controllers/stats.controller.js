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
  }
};

module.exports = statsController;
