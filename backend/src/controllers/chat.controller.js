const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { generateToken, hashToken } = require('../middlewares/chatAuth');
const { notifyAdmins } = require('../helpers/notify');
const { sendTemplate } = require('../helpers/mailer');
const whatsapp = require('../services/whatsapp.service');

const PUBLIC_SENDER_TYPES = new Set(['VISITOR', 'BOT']);

function directionFor(senderType) {
  return senderType === 'VISITOR' ? 'INBOUND' : 'OUTBOUND';
}

function summarizeSession(session, summary) {
  const text = summary || 'Conversación iniciada desde el sitio web';
  return `Hola, vengo del chat de ALANTEK. ${text}`;
}

const chatController = {
  // ===== Público =====
  async createSession(req, res, next) {
    try {
      const { channel = 'WEB', consent } = req.body;
      const token = generateToken();

      const session = await prisma.chatSession.create({
        data: {
          anonymousTokenHash: hashToken(token),
          channel,
          consentAt: consent ? new Date() : null
        }
      });

      res.status(201).json({
        session: {
          id: session.id,
          channel: session.channel,
          status: session.status,
          createdAt: session.createdAt
        },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req, res, next) {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId: req.chatSession.id },
        orderBy: { createdAt: 'asc' }
      });

      res.json({
        session: {
          id: req.chatSession.id,
          channel: req.chatSession.channel,
          status: req.chatSession.status,
          createdAt: req.chatSession.createdAt
        },
        messages
      });
    } catch (error) {
      next(error);
    }
  },

  async postMessage(req, res, next) {
    try {
      const { body, senderType = 'VISITOR', clientMessageId } = req.body;
      const safeSender = PUBLIC_SENDER_TYPES.has(senderType) ? senderType : 'VISITOR';

      const message = await prisma.chatMessage.create({
        data: {
          sessionId: req.chatSession.id,
          direction: directionFor(safeSender),
          senderType: safeSender,
          body,
          channel: req.chatSession.channel,
          externalMessageId: clientMessageId || null
        }
      });

      await prisma.chatSession.update({
        where: { id: req.chatSession.id },
        data: { lastMessageAt: message.createdAt }
      });

      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  },

  async requestHandoff(req, res, next) {
    try {
      const { reason, contactName, contactEmail, contactPhone } = req.body;
      const session = req.chatSession;

      let leadId = null;
      if (contactName || contactEmail) {
        const lead = await prisma.contactMessage.create({
          data: {
            name: contactName || 'Visitante del chat',
            email: contactEmail || 'sin-correo@alantek.com',
            subject: 'Solicitud de atención desde el chat',
            message: reason || 'El visitante solicitó hablar con un asesor.',
            source: 'chat-handoff'
          }
        });
        leadId = lead.id;
      }

      const handoff = await prisma.chatHandoff.create({
        data: {
          sessionId: session.id,
          leadId,
          status: 'REQUESTED'
        }
      });

      const summary = reason ? `Motivo: ${reason}` : null;
      const waLink = whatsapp.buildWaLink(
        process.env.WHATSAPP_DEFAULT_NUMBER,
        summarizeSession(session, summary)
      );

      await notifyAdmins(
        'Nueva solicitud de asesor en el chat',
        contactName ? `${contactName} quiere hablar con un asesor.` : 'Un visitante solicita asesoría.',
        '/admin/chats',
        'MESSAGE'
      );

      if (contactEmail) {
        try {
          await sendTemplate({
            to: contactEmail,
            subject: 'Un asesor de ALANTEK te contactará',
            heading: 'Registramos tu solicitud de asesoría',
            intro: `Hola ${contactName || ''}, un asesor de ALANTEK te contactará lo antes posible. Si prefieres, también puedes escribirnos por WhatsApp.`,
            outro: 'Gracias por contactar a ALANTEK.'
          });
        } catch (error) {
          // no romper el flujo por fallos de correo
        }
      }

      res.status(201).json({ handoff, waLink });
    } catch (error) {
      next(error);
    }
  },

  // ===== Admin =====
  async listSessions(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { status, channel, search } = req.query;

      const where = {};
      if (status && status !== 'ALL') where.status = status;
      if (channel && channel !== 'ALL') where.channel = channel;
      if (search) {
        where.OR = [
          { messages: { some: { body: { contains: search, mode: 'insensitive' } } } },
          { assignedTo: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [sessions, total, openCount] = await Promise.all([
        prisma.chatSession.findMany({
          where,
          orderBy: { lastMessageAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            _count: { select: { messages: true, handoffs: true, quoteRequests: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }),
        prisma.chatSession.count({ where }),
        prisma.chatSession.count({ where: { status: 'OPEN' } })
      ]);

      res.json({
        sessions: sessions.map((s) => ({
          id: s.id,
          channel: s.channel,
          status: s.status,
          createdAt: s.createdAt,
          lastMessageAt: s.lastMessageAt,
          assignedTo: s.assignedTo,
          counts: s._count,
          lastMessage: s.messages[0] || null
        })),
        total,
        page,
        limit,
        openCount
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessionAdmin(req, res, next) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: req.params.id },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: 'asc' } },
          handoffs: { orderBy: { requestedAt: 'desc' } },
          quoteRequests: { orderBy: { createdAt: 'desc' } }
        }
      });

      if (!session) throw new AppError('Chat session not found', 404);

      res.json({ session });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Chat session not found', 404));
      next(error);
    }
  },

  async postAgentMessage(req, res, next) {
    try {
      const { body } = req.body;
      const session = await prisma.chatSession.findUnique({
        where: { id: req.params.id },
        include: { handoffs: { orderBy: { requestedAt: 'desc' }, take: 1 } }
      });
      if (!session) throw new AppError('Chat session not found', 404);

      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          direction: 'OUTBOUND',
          senderType: 'AGENT',
          body,
          channel: session.channel,
          deliveryStatus: 'PENDING'
        }
      });

      let delivery = null;
      const waTarget = session.handoffs[0]?.whatsappConversationId;
      if (waTarget || session.channel === 'WHATSAPP') {
        delivery = await whatsapp.sendText(waTarget, body);
        await prisma.chatMessage.update({
          where: { id: message.id },
          data: { deliveryStatus: delivery?.delivered ? 'SENT' : delivery?.skipped ? 'SKIPPED' : 'FAILED' }
        });
      }

      await prisma.chatSession.update({
        where: { id: session.id },
        data: { lastMessageAt: message.createdAt }
      });

      res.status(201).json({ message, delivery });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Chat session not found', 404));
      next(error);
    }
  },

  async updateSession(req, res, next) {
    try {
      const { status, assignedToId } = req.body;
      const data = {};
      if (status) data.status = status;
      if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

      const session = await prisma.chatSession.update({
        where: { id: req.params.id },
        data,
        include: { assignedTo: { select: { id: true, name: true, email: true } } }
      });

      res.json({ session });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Chat session not found', 404));
      next(error);
    }
  },

  async listHandoffs(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { status } = req.query;

      const where = {};
      if (status && status !== 'ALL') where.status = status;

      const [handoffs, total] = await Promise.all([
        prisma.chatHandoff.findMany({
          where,
          orderBy: { requestedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            session: { select: { id: true, channel: true, status: true } }
          }
        }),
        prisma.chatHandoff.count({ where })
      ]);

      res.json({ handoffs, total, page, limit });
    } catch (error) {
      next(error);
    }
  },

  async updateHandoff(req, res, next) {
    try {
      const { status, assignedToId } = req.body;
      const data = {};

      if (status) {
        data.status = status;
        if (status === 'ACCEPTED') {
          data.acceptedAt = new Date();
          if (!assignedToId) data.assignedToId = req.user.id;
        }
        if (status === 'CLOSED') {
          data.closedAt = new Date();
        }
      }
      if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

      const handoff = await prisma.chatHandoff.update({
        where: { id: req.params.id },
        data,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          session: { select: { id: true, channel: true, status: true } }
        }
      });

      if (handoff.assignedToId) {
        await prisma.chatSession.update({
          where: { id: handoff.sessionId },
          data: { assignedToId: handoff.assignedToId }
        });
      }

      res.json({ handoff });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Handoff not found', 404));
      next(error);
    }
  }
};

module.exports = chatController;
