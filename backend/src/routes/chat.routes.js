const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { chatSession } = require('../middlewares/chatAuth');
const {
  chatSessionValidation,
  chatMessageValidation,
  handoffValidation,
  idParam
} = require('../validations');

const router = Router();

router.post('/sessions', chatSessionValidation, chatController.createSession);
router.get('/sessions/:id/messages', idParam, chatSession, chatController.getMessages);
router.post('/sessions/:id/messages', idParam, chatSession, chatMessageValidation, chatController.postMessage);
router.post('/sessions/:id/handoff', idParam, chatSession, handoffValidation, chatController.requestHandoff);

module.exports = router;
