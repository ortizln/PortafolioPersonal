const { Router } = require('express');
const experienceController = require('../controllers/experience.controller');
const { authenticate } = require('../middlewares/auth');
const { experienceValidation, idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', experienceController.getAll);
router.get('/:id', idParam, experienceController.getById);
router.post('/', experienceValidation, experienceController.create);
router.put('/:id', idParam, experienceController.update);
router.delete('/:id', idParam, experienceController.delete);

module.exports = router;
