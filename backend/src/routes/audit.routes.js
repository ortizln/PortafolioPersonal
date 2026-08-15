const { Router } = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, requirePermission('audit.read'));

router.get('/', auditController.getAll);

module.exports = router;
