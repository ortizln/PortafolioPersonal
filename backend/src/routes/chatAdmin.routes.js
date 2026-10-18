const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const { authenticate, requirePermission } = require('../middlewares/auth');
const {
  chatMessageValidation,
  handoffUpdateValidation,
  idParam
} = require('../validations');
const whatsappService = require('../services/whatsapp.service');

const router = Router();

router.use(authenticate);

router.get('/sessions', requirePermission('messages.read'), chatController.listSessions);
router.get('/sessions/:id', requirePermission('messages.read'), idParam, chatController.getSessionAdmin);
router.post('/sessions/:id/messages', requirePermission('messages.update'), idParam, chatMessageValidation, chatController.postAgentMessage);
router.patch('/sessions/:id', requirePermission('messages.update'), idParam, chatController.updateSession);

router.get('/handoffs', requirePermission('messages.read'), chatController.listHandoffs);
router.patch('/handoffs/:id', requirePermission('messages.update'), idParam, handoffUpdateValidation, chatController.updateHandoff);

router.get('/whatsapp/status', requirePermission('messages.read'), async (req, res, next) => {
  try {
    const status = await whatsappService.getStatus();
    res.json({ whatsapp: { ...status, defaultNumber: whatsappService.getDefaultNumber() } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
