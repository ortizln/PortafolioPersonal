const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { upload } = require('../helpers/upload');

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), uploadController.uploadFile);
router.delete('/:filename', uploadController.deleteFile);

module.exports = router;
