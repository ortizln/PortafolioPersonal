const { Router } = require('express');
const companyController = require('../controllers/company.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/', companyController.get);
router.put('/', authenticate, companyController.upsert);
router.delete('/', authenticate, companyController.delete);

module.exports = router;
