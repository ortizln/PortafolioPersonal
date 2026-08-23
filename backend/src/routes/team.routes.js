const { Router } = require('express');
const teamController = require('../controllers/team.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { upload } = require('../helpers/upload');

const router = Router();

router.use(authenticate);

router.get('/', teamController.getAll);
router.get('/:id', teamController.getById);
router.post('/', requirePermission('team.update'), teamController.create);
router.post('/:id/photo', requirePermission('team.update'), upload.single('photo'), teamController.uploadPhoto);
router.put('/:id', requirePermission('team.update'), teamController.update);
router.delete('/:id', requirePermission('team.update'), teamController.remove);

module.exports = router;
