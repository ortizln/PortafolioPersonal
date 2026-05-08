const { Router } = require('express');
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middlewares/auth');
const { upload } = require('../helpers/upload');

const router = Router();

router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/photo', upload.single('profile'), profileController.uploadPhoto);
router.post('/banner', upload.single('banner'), profileController.uploadBanner);
router.post('/cv', upload.single('resume'), profileController.uploadCV);

module.exports = router;
