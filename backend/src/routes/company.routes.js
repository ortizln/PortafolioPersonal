const { Router } = require('express');
const companyController = require('../controllers/company.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.get('/', companyController.get);
router.put('/', authenticate, requirePermission('company.update'), companyController.upsert);
router.delete('/', authenticate, requirePermission('company.update'), companyController.delete);

module.exports = router;
