const { Router } = require('express');
const quoteController = require('../controllers/quote.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { quoteUpdateValidation, idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('messages.read'), quoteController.list);
router.get('/:id', requirePermission('messages.read'), idParam, quoteController.getById);
router.patch('/:id', requirePermission('messages.update'), idParam, quoteUpdateValidation, quoteController.update);
router.delete('/:id', requirePermission('messages.update'), idParam, quoteController.remove);

module.exports = router;
