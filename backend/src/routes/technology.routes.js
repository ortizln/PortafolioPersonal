const { Router } = require('express');
const technologyController = require('../controllers/technology.controller');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', technologyController.getAll);

module.exports = router;
