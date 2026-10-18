const { Router } = require('express');
const whatsappController = require('../controllers/whatsapp.controller');

const router = Router();

router.post('/webhook', whatsappController.webhook);

module.exports = router;
