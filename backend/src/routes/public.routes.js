const { Router } = require('express');
const publicController = require('../controllers/public.controller');
const prisma = require('../config/database');

const router = Router();

async function trackPageView(path) {
  try {
    if (!path) return;
    await prisma.pageView.upsert({
      where: { path },
      update: { count: { increment: 1 } },
      create: { path }
    });
  } catch (error) {
    // no romper el flujo público por tracking
  }
}

function pageTracker(pathFn) {
  return async (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    if (!/bot|spider|crawler|slurp|bingpreview/i.test(userAgent)) {
      await trackPageView(pathFn(req));
    }
    next();
  };
}

router.get('/portfolio', pageTracker(() => '/'), publicController.getPortfolio);
router.get('/projects', pageTracker(() => '/portafolio'), publicController.getProjects);
router.get('/projects/slug/:slug', publicController.getProjectBySlug);
router.get('/projects/:id', publicController.getProject);
router.get('/experiences', pageTracker(() => '/experience'), publicController.getExperiences);
router.get('/education', pageTracker(() => '/experience'), publicController.getEducation);
router.get('/certifications', pageTracker(() => '/experience'), publicController.getCertifications);
router.get('/skills', pageTracker(() => '/skills'), publicController.getSkills);
router.get('/company', publicController.getCompany);
router.get('/services', pageTracker(() => '/servicios'), publicController.getServices);
router.get('/clients', pageTracker(() => '/clientes'), publicController.getClients);
router.get('/testimonials', pageTracker(() => '/'), publicController.getTestimonials);
router.get('/team', pageTracker(() => '/equipo'), publicController.getTeam);
router.get('/team/:slug', publicController.getTeamMember);
router.get('/blog', pageTracker(() => '/blog'), publicController.getPosts);
router.get('/blog/slug/:slug', publicController.getPostBySlug);
router.get('/seo', publicController.getSeoInfo);
router.get('/sitemap', publicController.getSitemap);
router.get('/robots', publicController.getRobots);

module.exports = router;
