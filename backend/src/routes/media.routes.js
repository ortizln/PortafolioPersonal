const { Router } = require('express');
const mediaController = require('../controllers/media.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('media.manage', 'media.upload'), mediaController.getAll);
router.get('/:id', requirePermission('media.manage', 'media.upload'), idParam, mediaController.getById);
router.put('/:id', requirePermission('media.manage'), idParam, mediaController.update);
router.delete('/:id', requirePermission('media.manage'), idParam, mediaController.remove);

module.exports = router;
