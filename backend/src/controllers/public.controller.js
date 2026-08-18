const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

async function trackPageView(req, path) {
  try {
    if (!path) return;
    const userAgent = req.get?.('user-agent') || '';
    if (/bot|spider|crawler|slurp|bingpreview/i.test(userAgent)) return;
    await prisma.pageView.upsert({
      where: { path },
      update: { count: { increment: 1 } },
      create: { path }
    });
  } catch (error) {
    // no romper el flujo público por tracking
  }
}

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
      const { slug } = req.params;
      const project = await prisma.project.findFirst({
        where: {
          deletedAt: null,
          OR: [{ id: slug }, { slug }]
        },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } },
          clientRel: true,
          service: true,
          members: { include: { teamMember: true }, orderBy: { isLead: 'desc' } }
        }
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      res.json({ project });
    } catch (error) {
      next(error);
    }
  },

  async getProjectBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const project = await prisma.project.findFirst({
        where: { slug, deletedAt: null },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } },
          clientRel: true,
          service: true,
          members: { include: { teamMember: true }, orderBy: { isLead: 'desc' } }
        }
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      await prisma.project.update({
        where: { id: project.id },
        data: { views: { increment: 1 } }
      });

      await trackPageView(req, `/proyectos/${project.slug}`);

      const related = await prisma.project.findMany({
        where: {
          deletedAt: null,
          id: { not: project.id },
          OR: [
            { categories: { some: { categoryId: { in: project.categories.map((c) => c.categoryId) } } } },
            { technologies: { some: { technologyId: { in: project.technologies.map((t) => t.technologyId) } } } }
          ]
        },
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } },
          clientRel: true
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      res.json({ project, related });
    } catch (error) {
      next(error);
    }
  },

  async getProjects(req, res, next) {
    try {
      const { search, category, technology, status } = req.query;
      const where = { deletedAt: null };
      if (status) where.status = status.toUpperCase();
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) {
        where.categories = { some: { category: { slug: category } } };
      }
      if (technology) {
        where.technologies = { some: { technology: { slug: technology } } };
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          images: true,
          technologies: { include: { technology: true } },
          categories: { include: { category: true } },
          clientRel: true,
          service: true,
          members: { include: { teamMember: true }, orderBy: { isLead: 'desc' } }
        },
        orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }]
      });

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

  async getServiceBySlug(req, res, next) {
    try {
      const service = await prisma.service.findFirst({
        where: { slug: req.params.slug, deletedAt: null, status: 'ACTIVE' },
        include: {
          features: { orderBy: { order: 'asc' } },
          technologies: { include: { technology: true } },
          projects: {
            where: { deletedAt: null, visibility: 'PUBLIC' },
            select: { id: true, title: true, slug: true, summary: true, bannerImage: true, isFeatured: true },
            orderBy: { createdAt: 'desc' },
            take: 4,
          },
        },
      });
      if (!service) {
        throw new AppError('Service not found', 404);
      }
      res.json({ service });
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

  async getTechnologies(req, res, next) {
    try {
      const technologies = await prisma.technology.findMany({
        include: { _count: { select: { projects: true, skills: true } } },
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
      });
      res.json({ technologies });
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
  },

  // ===== Blog público =====
  async getPosts(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
      const { search, category, tag } = req.query;

      const where = { deletedAt: null, status: 'PUBLISHED', publishedAt: { lte: new Date() } };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) where.categories = { some: { category: { slug: category } } };
      if (tag) where.tags = { some: { tag: { slug: tag } } };

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: { select: { id: true, name: true } },
            categories: { include: { category: true } },
            tags: { include: { tag: true } }
          },
          orderBy: { publishedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.post.count({ where })
      ]);

      const categories = await prisma.postCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } }
      });

      res.json({
        posts: posts.map((p) => ({
          ...p,
          categories: p.categories.map((c) => c.category),
          tags: p.tags.map((t) => t.tag)
        })),
        categories,
        total,
        page,
        limit
      });
    } catch (error) {
      next(error);
    }
  },

  async getPostBySlug(req, res, next) {
    try {
      const post = await prisma.post.findFirst({
        where: { slug: req.params.slug, deletedAt: null, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        include: {
          author: { select: { id: true, name: true, email: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } }
        }
      });

      if (!post) {
        throw new AppError('Post no encontrado', 404);
      }

      await prisma.post.update({
        where: { id: post.id },
        data: { views: { increment: 1 } }
      });
      await trackPageView(req, `/blog/${post.slug}`);

      const related = await prisma.post.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          publishedAt: { lte: new Date() },
          id: { not: post.id },
          OR: [
            { categories: { some: { categoryId: { in: post.categories.map((c) => c.categoryId) } } } },
            { tags: { some: { tagId: { in: post.tags.map((t) => t.tagId) } } } }
          ]
        },
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { publishedAt: 'desc' },
        take: 3
      });

      res.json({
        post: {
          ...post,
          categories: post.categories.map((c) => c.category),
          tags: post.tags.map((t) => t.tag)
        },
        related: related.map((p) => ({
          ...p,
          categories: p.categories.map((c) => c.category),
          tags: p.tags.map((t) => t.tag)
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  // ===== SEO =====
  async getSeoInfo(req, res, next) {
    try {
      const path = req.query.path || '/';
      const [company, settings, meta] = await Promise.all([
        prisma.company.findFirst({ where: { isActive: true } }),
        prisma.setting.findMany({ where: { key: { in: ['seo_title', 'seo_description', 'seo_image', 'seo_default_robots'] } } }),
        prisma.seoMetadata.findFirst({ where: { entityType: 'PAGE', entityId: path } })
      ]);

      const settingMap = {};
      settings.forEach((s) => (settingMap[s.key] = s.value));

      res.json({
        seo: {
          title: meta?.title || settingMap.seo_title || (company?.slogan ? `${company.name} — ${company.slogan}` : company?.name || 'ALANTEK'),
          description: meta?.description || settingMap.seo_description || company?.shortDescription || company?.description || '',
          image: meta?.ogImage || settingMap.seo_image || company?.logoUrl || null,
          ogTitle: meta?.ogTitle || meta?.title || null,
          ogDescription: meta?.ogDescription || meta?.description || null,
          twitterTitle: meta?.twitterTitle || meta?.title || null,
          twitterDescription: meta?.twitterDescription || meta?.description || null,
          twitterImage: meta?.twitterImage || meta?.ogImage || null,
          canonical: meta?.canonical || null,
          robots: meta?.robots || settingMap.seo_default_robots || 'index,follow'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async getSitemap(req, res, next) {
    try {
      const company = await prisma.company.findFirst({ where: { isActive: true } });
      const baseUrl = company?.website || `${req.protocol}://${req.get('host')}`;

      const [projects, posts, team, pages] = await Promise.all([
        prisma.project.findMany({ where: { deletedAt: null, visibility: 'PUBLIC' }, select: { slug: true, updatedAt: true } }),
        prisma.post.findMany({ where: { deletedAt: null, status: 'PUBLISHED', publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
        prisma.teamMember.findMany({ where: { deletedAt: null, isActive: true, isPublic: true }, select: { slug: true, updatedAt: true } }),
        ['', 'nosotros', 'servicios', 'equipo', 'clientes', 'portafolio', 'contacto', 'blog', 'skills']
      ]);

      const url = (loc, lastmod) =>
        `  <url>\n    <loc>${baseUrl}${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`;

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...pages.map((p) => url(p === '' ? '/' : `/${p}`)),
        ...projects.map((p) => url(`/proyectos/${p.slug}`, p.updatedAt.toISOString())),
        ...posts.map((p) => url(`/blog/${p.slug}`, p.updatedAt.toISOString())),
        ...team.map((m) => url(`/equipo/${m.slug}`, m.updatedAt.toISOString())),
        '</urlset>'
      ].join('\n');

      res.type('application/xml').send(xml);
    } catch (error) {
      next(error);
    }
  },

  async getRobots(req, res, next) {
    try {
      const company = await prisma.company.findFirst({ where: { isActive: true } });
      const baseUrl = company?.website || `${req.protocol}://${req.get('host')}`;
      const robots = [
        'User-agent: *',
        'Allow: /',
        `Disallow: /admin`,
        `Disallow: /api`,
        '',
        `Sitemap: ${baseUrl}/sitemap.xml`
      ].join('\n');
      res.type('text/plain').send(robots);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = publicController;
