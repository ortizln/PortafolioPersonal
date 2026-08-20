const { Router } = require('express');
const clientController = require('../controllers/client.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', requirePermission('clients.manage'), clientController.create);
router.put('/:id', requirePermission('clients.manage'), clientController.update);
router.delete('/:id', requirePermission('clients.manage'), clientController.remove);

module.exports = router;
