const crypto = require('crypto');
const prisma = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { notifyAdmins } = require('../helpers/notify');
const { sendTemplate } = require('../helpers/mailer');

const QUOTE_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'SPAM'];

function generateCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `COT-${y}${m}${d}-${rand}`;
}

async function uniqueCode() {
  for (let i = 0; i < 5; i += 1) {
    const code = generateCode();
    const existing = await prisma.quoteRequest.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `COT-${Date.now()}`;
}

const quoteController = {
  // ===== Público =====
  async create(req, res, next) {
    try {
      const {
        type,
        serviceId,
        description,
        features,
        budget,
        deadline,
        name,
        email,
        phone,
        sessionId
      } = req.body;

      let session = null;
      if (sessionId) {
        session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
      }

      let leadId = null;
      const lead = await prisma.contactMessage.create({
        data: {
          name,
          email,
          subject: `Cotización: ${type}`.slice(0, 200),
          message: description,
          source: 'chat-quote'
        }
      });
      leadId = lead.id;

      const code = await uniqueCode();

      const quote = await prisma.quoteRequest.create({
        data: {
          code,
          leadId,
          sessionId: session ? session.id : null,
          serviceId: serviceId || null,
          projectDescription: description,
          requirementsJson: Array.isArray(features) && features.length ? { features } : undefined,
          budgetRange: budget || null,
          deadline: deadline || null,
          contactName: name,
          contactEmail: email,
          contactPhone: phone || null,
          status: 'NEW'
        }
      });

      await notifyAdmins(
        `Nueva cotización ${code}`,
        `${name} solicitó: ${type}`,
        '/admin/quotes',
        'MESSAGE'
      );

      try {
        await sendTemplate({
          to: email,
          subject: `Cotización ${code} recibida - ALANTEK`,
          heading: 'Recibimos tu solicitud de cotización',
          intro: `Hola ${name}, gracias por tu interés. Registramos tu solicitud con la referencia ${code}. Un asesor la revisará y te contactará pronto.`,
          rows: [
            { label: 'Referencia', value: code },
            { label: 'Tipo de solución', value: type },
            { label: 'Presupuesto orientativo', value: budget || 'No especificado' }
          ],
          outro: 'Si deseas agilizar el proceso, puedes responder a este correo con más detalles de tu proyecto.'
        });
      } catch (error) {
        // no romper el flujo por fallos de correo
      }

      res.status(201).json({ quote, code });
    } catch (error) {
      next(error);
    }
  },

  // ===== Admin =====
  async list(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const { status, search } = req.query;

      const where = {};
      if (status && status !== 'ALL') where.status = status;
      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { contactEmail: { contains: search, mode: 'insensitive' } },
          { projectDescription: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [quotes, total, byStatus] = await Promise.all([
        prisma.quoteRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            session: { select: { id: true, channel: true, status: true } },
            lead: { select: { id: true, name: true, email: true, status: true } }
          }
        }),
        prisma.quoteRequest.count({ where }),
        prisma.quoteRequest.groupBy({ by: ['status'], _count: { _all: true } })
      ]);

      const statusCounts = {};
      byStatus.forEach((s) => {
        statusCounts[s.status] = s._count._all;
      });

      res.json({ quotes, total, page, limit, statusCounts, statuses: QUOTE_STATUSES });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const quote = await prisma.quoteRequest.findUnique({
        where: { id: req.params.id },
        include: {
          session: {
            select: {
              id: true,
              channel: true,
              status: true,
              messages: { orderBy: { createdAt: 'asc' }, take: 50 }
            }
          },
          lead: { select: { id: true, name: true, email: true, status: true } }
        }
      });

      if (!quote) throw new AppError('Quote not found', 404);

      res.json({ quote });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Quote not found', 404));
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { status, budgetRange, deadline, contactName, contactEmail, contactPhone, projectDescription } = req.body;
      const data = {};
      if (status) data.status = status;
      if (budgetRange !== undefined) data.budgetRange = budgetRange;
      if (deadline !== undefined) data.deadline = deadline;
      if (contactName !== undefined) data.contactName = contactName;
      if (contactEmail !== undefined) data.contactEmail = contactEmail;
      if (contactPhone !== undefined) data.contactPhone = contactPhone;
      if (projectDescription !== undefined) data.projectDescription = projectDescription;

      const quote = await prisma.quoteRequest.update({
        where: { id: req.params.id },
        data
      });

      res.json({ quote });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Quote not found', 404));
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await prisma.quoteRequest.delete({ where: { id: req.params.id } });
      res.json({ message: 'Quote deleted successfully' });
    } catch (error) {
      if (error.code === 'P2025') return next(new AppError('Quote not found', 404));
      next(error);
    }
  }
};

module.exports = quoteController;
