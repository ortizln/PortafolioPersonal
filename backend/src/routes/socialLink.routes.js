const { Router } = require('express');
const socialLinkController = require('../controllers/socialLink.controller');
const { authenticate } = require('../middlewares/auth');
const { idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', socialLinkController.getAll);
router.get('/:id', idParam, socialLinkController.getById);
router.post('/', socialLinkController.create);
router.put('/:id', idParam, socialLinkController.update);
router.delete('/:id', idParam, socialLinkController.delete);

module.exports = router;
