const { Router } = require('express');
const testimonialController = require('../controllers/testimonial.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', testimonialController.getAll);
router.get('/:id', testimonialController.getById);
router.post('/', testimonialController.create);
router.put('/:id', testimonialController.update);
router.delete('/:id', testimonialController.remove);

module.exports = router;
