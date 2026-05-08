const { Router } = require('express');
const languageController = require('../controllers/language.controller');
const { authenticate } = require('../middlewares/auth');
const { languageValidation, idParam } = require('../validations');

const router = Router();

router.use(authenticate);

router.get('/', languageController.getAll);
router.get('/:id', idParam, languageController.getById);
router.post('/', languageValidation, languageController.create);
router.put('/:id', idParam, languageController.update);
router.delete('/:id', idParam, languageController.delete);

module.exports = router;
