const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize, requirePermission } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', requirePermission('users.manage'), userController.getAll);
router.post('/', requirePermission('users.manage'), userController.create);
router.get('/:id', requirePermission('users.manage'), idParam, userController.getById);
router.put('/:id', requirePermission('users.manage'), idParam, userController.update);
router.put('/:id/role', requirePermission('users.manage', 'roles.manage'), idParam, userController.updateRole);
router.delete('/:id', requirePermission('users.manage'), idParam, userController.delete);

module.exports = router;
