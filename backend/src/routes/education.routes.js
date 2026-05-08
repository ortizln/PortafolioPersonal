const { Router } = require('express');
const educationController = require('../controllers/education.controller');
const { authenticate } = require('../middlewares/auth');
const { educationValidation, idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', educationController.getAll);
router.get('/:id', idParam, educationController.getById);
router.post('/', educationValidation, educationController.create);
router.put('/:id', idParam, educationController.update);
router.delete('/:id', idParam, educationController.delete);

module.exports = router;
