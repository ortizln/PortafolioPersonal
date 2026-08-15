const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@alantek.com';
  const client = getTransporter();
  if (!client) {
    // Sin SMTP configurado: registrar la salida para desarrollo
    console.log(`[MAIL:${to}] ${subject}`);
    return { skipped: true };
  }
  await client.sendMail({ from, to, subject, html, text });
  return { skipped: false };
}

module.exports = { sendMail };
