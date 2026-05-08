const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { registerValidation, loginValidation } = require('../validations');

const router = Router();

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
