const prisma = require('../config/database');
const { hashToken } = require('../middlewares/chatAuth');
const { notifyAdmins } = require('../helpers/notify');
const whatsapp = require('../services/whatsapp.service');

function extractPayload(payload) {
  const data = payload?.data || payload || {};
  const rawFrom = data.from || data.chatId || data.sender || data.author || '';
  const from = whatsapp.normalizeNumber(String(rawFrom).replace(/@.*$/, ''));
  const text = data.body || data.text || data.message || data.content || '';
  const messageId = data.id || data.messageId || data.msgId || null;
  return { from, text: typeof text === 'string' ? text : '', messageId };
}

const whatsappController = {
  async webhook(req, res, next) {
    try {
      const secret = process.env.OPENWA_WEBHOOK_SECRET;
      if (secret) {
        const provided = req.get('x-openwa-secret') || req.get('x-webhook-secret');
        if (provided !== secret) {
          return res.status(401).json({ error: 'Invalid webhook signature.' });
        }
      }

      const { from, text, messageId } = extractPayload(req.body);
      if (!from || !text) {
        return res.json({ received: true, ignored: true });
      }

      const syntheticHash = hashToken(`wa:${from}`);
      let session = await prisma.chatSession.findFirst({
        where: { anonymousTokenHash: syntheticHash }
      });

      if (!session) {
        session = await prisma.chatSession.create({
          data: { anonymousTokenHash: syntheticHash, channel: 'WHATSAPP' }
        });
      }

      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          direction: 'INBOUND',
          senderType: 'VISITOR',
          body: text,
          channel: 'WHATSAPP',
          externalMessageId: messageId
        }
      });

      await prisma.chatSession.update({
        where: { id: session.id },
        data: { lastMessageAt: message.createdAt }
      });

      await notifyAdmins(
        'Nuevo mensaje de WhatsApp',
        `${from}: ${text.slice(0, 120)}`,
        '/admin/chats',
        'MESSAGE'
      );

      res.json({ received: true, sessionId: session.id });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = whatsappController;
