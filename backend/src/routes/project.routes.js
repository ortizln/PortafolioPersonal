const { Router } = require('express');
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth');
const { projectValidation, idParam } = require('../validations');
const { upload } = require('../helpers/upload');

const router = Router();

router.use(authenticate);

router.get('/', projectController.getAll);
router.get('/:id', idParam, projectController.getById);
router.post('/', projectValidation, projectController.create);
router.put('/:id', idParam, projectController.update);
router.delete('/:id', idParam, projectController.delete);
router.post('/:id/images', idParam, upload.single('project'), projectController.addImage);
router.delete('/:id/images/:imageId', idParam, projectController.removeImage);

module.exports = router;
