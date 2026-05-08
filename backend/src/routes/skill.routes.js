const { Router } = require('express');
const skillController = require('../controllers/skill.controller');
const { authenticate } = require('../middlewares/auth');
const { skillValidation, idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', skillController.getAll);
router.get('/:id', idParam, skillController.getById);
router.post('/', skillValidation, skillController.create);
router.put('/:id', idParam, skillController.update);
router.delete('/:id', idParam, skillController.delete);

module.exports = router;
