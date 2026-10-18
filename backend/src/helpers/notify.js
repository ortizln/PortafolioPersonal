const prisma = require('../config/database');
const { sendTemplate } = require('./mailer');

const PANEL_BASE = (process.env.PUBLIC_BASE_URL || 'http://localhost:4300/portfolio').replace(/\/+$/, '');

function emailEnabled() {
  return process.env.NOTIFY_EMAIL_ENABLED !== 'false';
}

function absoluteLink(link) {
  if (!link) return undefined;
  if (/^https?:\/\//i.test(link)) return link;
  return `${PANEL_BASE}${link.startsWith('/') ? '' : '/'}${link}`;
}

async function getAdminRecipients() {
  const override = (process.env.ADMIN_NOTIFY_EMAIL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (override.length) return override;

  const admins = await prisma.user.findMany({
    where: { deletedAt: null, isActive: true, email: { not: '' } },
    select: { email: true },
    take: 50
  });
  return admins.map((a) => a.email).filter(Boolean);
}

async function notifyAdmins(title, message, link, type = 'MESSAGE') {
  // Notificación in-app (nunca romper el flujo principal)
  try {
    const admins = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
      take: 50
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({ userId: a.id, title, message, link, type }))
      });
    }
  } catch (error) {
    // ignore
  }

  // Notificación por email a los administradores
  if (!emailEnabled()) return;
  try {
    const recipients = await getAdminRecipients();
    if (!recipients.length) return;
    const ctaUrl = absoluteLink(link);
    await sendTemplate({
      to: recipients.join(','),
      subject: `[ALANTEK] ${title}`,
      heading: title,
      intro: message,
      ctaLabel: ctaUrl ? 'Ver en el panel' : undefined,
      ctaUrl
    });
  } catch (error) {
    // no romper el flujo por fallos de correo
  }
}

module.exports = { notifyAdmins, getAdminRecipients };
