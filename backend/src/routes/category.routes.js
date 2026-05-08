const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', idParam, categoryController.getById);
router.post('/', categoryController.create);
router.put('/:id', idParam, categoryController.update);
router.delete('/:id', idParam, categoryController.delete);

module.exports = router;
