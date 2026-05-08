const { Router } = require('express');
const certificationController = require('../controllers/certification.controller');
const { authenticate } = require('../middlewares/auth');
const { certificationValidation, idParam } = require('../validations');
const { upload } = require('../helpers/upload');

const router = Router();

router.use(authenticate);

router.get('/', certificationController.getAll);
router.get('/:id', idParam, certificationController.getById);
router.post('/', certificationValidation, certificationController.create);
router.put('/:id', idParam, certificationController.update);
router.delete('/:id', idParam, certificationController.delete);
router.post('/:id/files', idParam, upload.single('certificate'), certificationController.uploadFile);

module.exports = router;
