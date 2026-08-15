const { Router } = require('express');
const contactController = require('../controllers/contact.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { contactValidation, idParam } = require('../validations');

const router = Router();

router.post('/', contactValidation, contactController.create);

router.get('/', authenticate, requirePermission('messages.read'), contactController.getAll);
router.get('/:id', authenticate, requirePermission('messages.read'), idParam, contactController.getById);
router.put('/:id/lead', authenticate, requirePermission('messages.update'), idParam, contactController.updateLead);
router.put('/:id/read', authenticate, requirePermission('messages.update'), idParam, contactController.markAsRead);
router.delete('/:id', authenticate, requirePermission('messages.update'), idParam, contactController.delete);

module.exports = router;
