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

module.exports = router;
