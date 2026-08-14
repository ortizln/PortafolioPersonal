const { Router } = require('express');
const publicController = require('../controllers/public.controller');

const router = Router();

router.get('/portfolio', publicController.getPortfolio);
router.get('/projects', publicController.getProjects);
router.get('/projects/:id', publicController.getProject);
router.get('/experiences', publicController.getExperiences);
router.get('/education', publicController.getEducation);
router.get('/certifications', publicController.getCertifications);
router.get('/skills', publicController.getSkills);
router.get('/company', publicController.getCompany);
router.get('/services', publicController.getServices);
router.get('/clients', publicController.getClients);
router.get('/testimonials', publicController.getTestimonials);
router.get('/team', publicController.getTeam);
router.get('/team/:slug', publicController.getTeamMember);

module.exports = router;
