const { Router } = require('express');
const technologyController = require('../controllers/technology.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', technologyController.getAll);
router.post('/', requirePermission('technologies.manage'), technologyController.create);
router.put('/:id', requirePermission('technologies.manage'), technologyController.update);
router.delete('/:id', requirePermission('technologies.manage'), technologyController.remove);

module.exports = router;
