const { Router } = require('express');
const statsController = require('../controllers/stats.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', statsController.getStats);
router.get('/projects', statsController.getProjectStats);
router.get('/corporate', statsController.getCorporateStats);

module.exports = router;
