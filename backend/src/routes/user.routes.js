const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', userController.getAll);
router.get('/:id', idParam, userController.getById);
router.put('/:id', idParam, userController.update);
router.delete('/:id', idParam, userController.delete);

module.exports = router;
