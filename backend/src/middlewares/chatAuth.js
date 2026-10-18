const crypto = require('crypto');
const prisma = require('../config/database');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

async function chatSession(req, res, next) {
  try {
    const token = req.get('x-chat-token') || req.body?.token || req.query?.token;
    if (!token) {
      return res.status(401).json({ error: 'Chat token required.' });
    }

    const session = await prisma.chatSession.findFirst({
      where: { anonymousTokenHash: hashToken(token) }
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid chat session.' });
    }

    if (req.params && req.params.id && req.params.id !== session.id) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    req.chatSession = session;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { chatSession, generateToken, hashToken };
