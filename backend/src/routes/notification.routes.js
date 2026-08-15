const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate, requirePermission('notifications.read', 'messages.read'));

router.get('/', notificationController.getAll);
router.put('/:id/read', idParam, notificationController.markRead);
router.put('/read-all', notificationController.markAllRead);

module.exports = router;
