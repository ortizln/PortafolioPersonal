const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { upload } = require('../helpers/upload');

const router = Router();

router.use(authenticate, requirePermission('media.upload', 'media.manage'));

router.post('/', upload.single('file'), uploadController.uploadFile);
router.post('/image', upload.single('image'), uploadController.uploadImage);
router.delete('/:filename', uploadController.deleteFile);

module.exports = router;
