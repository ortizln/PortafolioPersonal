const { Router } = require('express');
const testimonialController = require('../controllers/testimonial.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', testimonialController.getAll);
router.get('/:id', testimonialController.getById);
router.post('/', requirePermission('testimonials.manage'), testimonialController.create);
router.put('/:id', requirePermission('testimonials.manage'), testimonialController.update);
router.delete('/:id', requirePermission('testimonials.manage'), testimonialController.remove);

module.exports = router;
