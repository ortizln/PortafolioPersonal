const { Router } = require('express');
const settingController = require('../controllers/setting.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', settingController.getAll);
router.get('/:key', settingController.getByKey);
router.put('/:key', settingController.update);

module.exports = router;
