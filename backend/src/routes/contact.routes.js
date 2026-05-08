const { Router } = require('express');
const contactController = require('../controllers/contact.controller');
const { authenticate } = require('../middlewares/auth');
const { contactValidation, idParam } = require('../validations');

const router = Router();

router.post('/', contactValidation, contactController.create);

router.get('/', authenticate, contactController.getAll);
router.get('/:id', authenticate, idParam, contactController.getById);
router.put('/:id/read', authenticate, idParam, contactController.markAsRead);
router.delete('/:id', authenticate, idParam, contactController.delete);

module.exports = router;
