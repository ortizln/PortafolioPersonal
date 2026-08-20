const { Router } = require('express');
const settingController = require('../controllers/setting.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('settings.manage'), settingController.getAll);
router.get('/:key', requirePermission('settings.manage'), settingController.getByKey);
router.put('/:key', requirePermission('settings.manage'), settingController.update);

module.exports = router;
