const { Router } = require('express');
const statsController = require('../controllers/stats.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', statsController.getStats);
router.get('/projects', statsController.getProjectStats);
router.get('/corporate', requirePermission('settings.manage'), statsController.getCorporateStats);

module.exports = router;
