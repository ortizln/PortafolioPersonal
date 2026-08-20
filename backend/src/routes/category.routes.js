const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', idParam, categoryController.getById);
router.post('/', requirePermission('categories.manage'), categoryController.create);
router.put('/:id', idParam, requirePermission('categories.manage'), categoryController.update);
router.delete('/:id', idParam, requirePermission('categories.manage'), categoryController.delete);

module.exports = router;
