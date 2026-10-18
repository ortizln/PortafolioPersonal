const nodemailer = require('nodemailer');

const BRAND = {
  name: 'ALANTEK',
  deep: '#19261E',
  primary: '#354B35',
  accent: '#BD6735',
  copper: '#E4A16C',
  bg: '#F7F7F2',
  text: '#19261E',
  muted: '#5b6b5b'
};

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

function isConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmail({ heading, intro, rows = [], ctaLabel, ctaUrl, outro }) {
  const rowsHtml = rows
    .filter((r) => r && r.label != null)
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e6e6df;color:${BRAND.muted};font-size:13px;width:38%;vertical-align:top;">${escapeHtml(
        r.label
      )}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e6e6df;color:${BRAND.text};font-size:14px;font-weight:600;">${escapeHtml(
        r.value ?? '-'
      )}</td>
        </tr>`
    )
    .join('');

  const rowsBlock = rowsHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e6df;border-radius:10px;overflow:hidden;margin:18px 0;">${rowsHtml}</table>`
    : '';

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px;">${escapeHtml(
          ctaLabel
        )}</a>`
      : '';

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading || BRAND.name)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.bg};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(25,38,30,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,${BRAND.deep} 0%,${BRAND.primary} 55%,${BRAND.accent} 100%);padding:24px 28px;">
                <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:2px;">${BRAND.name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;color:${BRAND.deep};font-size:20px;line-height:1.3;">${escapeHtml(
    heading || ''
  )}</h1>
                ${intro ? `<p style="margin:0 0 8px;color:${BRAND.text};font-size:14px;line-height:1.6;">${escapeHtml(intro)}</p>` : ''}
                ${rowsBlock}
                ${ctaBlock}
                ${
                  outro
                    ? `<p style="margin:18px 0 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">${escapeHtml(
                        outro
                      )}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f0f0ea;color:${BRAND.muted};font-size:11px;text-align:center;">
                ${BRAND.name} · Este correo se generó automáticamente, por favor no lo respondas directamente.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText({ heading, intro, rows = [], ctaUrl, outro }) {
  const lines = [heading || '', intro || ''];
  rows
    .filter((r) => r && r.label != null)
    .forEach((r) => lines.push(`${r.label}: ${r.value ?? '-'}`));
  if (ctaUrl) lines.push('', ctaUrl);
  if (outro) lines.push('', outro);
  return lines.filter(Boolean).join('\n');
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@alantek.com';
  const client = getTransporter();
  if (!client) {
    console.log(`[MAIL:${to}] ${subject}`);
    return { skipped: true };
  }
  await client.sendMail({ from, to, subject, html, text });
  return { skipped: false };
}

async function sendTemplate({ to, subject, heading, intro, rows = [], ctaLabel, ctaUrl, outro }) {
  if (!to) return { skipped: true };
  const html = renderEmail({ heading, intro, rows, ctaLabel, ctaUrl, outro });
  const text = renderText({ heading, intro, rows, ctaUrl, outro });
  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendTemplate, renderEmail, isConfigured, escapeHtml };
