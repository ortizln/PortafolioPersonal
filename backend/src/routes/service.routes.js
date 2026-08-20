const { Router } = require('express');
const serviceController = require('../controllers/service.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', serviceController.getAll);
router.get('/:id', serviceController.getById);
router.post('/', requirePermission('services.manage'), serviceController.create);
router.put('/:id', requirePermission('services.manage'), serviceController.update);
router.delete('/:id', requirePermission('services.manage'), serviceController.remove);

module.exports = router;
