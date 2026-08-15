const { Router } = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/permissions', requirePermission('roles.manage', 'audit.read'), roleController.getPermissions);
router.get('/', requirePermission('roles.manage'), roleController.getAll);
router.put('/:roleId/permissions', requirePermission('roles.manage'), roleController.updateRolePermissions);
router.post('/', requirePermission('roles.manage'), roleController.create);
router.put('/:roleId', requirePermission('roles.manage'), idParam, roleController.update);
router.delete('/:roleId', requirePermission('roles.manage'), idParam, roleController.delete);

module.exports = router;
