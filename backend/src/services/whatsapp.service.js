const DEFAULT_COUNTRY_CODE = '593';

function getDefaultNumber() {
  const raw = process.env.WHATSAPP_DEFAULT_NUMBER || '';
  return normalizeNumber(raw);
}

function normalizeNumber(input) {
  if (!input) return '';
  let value = String(input).replace(/[^\d+]/g, '');
  if (value.startsWith('+')) value = value.slice(1);
  if (value.startsWith('00')) value = value.slice(2);
  return value;
}

function buildWaLink(number, text) {
  const digits = normalizeNumber(number) || getDefaultNumber();
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

function isConfigured() {
  return Boolean(process.env.OPENWA_API_URL && process.env.OPENWA_SESSION_ID);
}

async function sendText(to, text) {
  const number = normalizeNumber(to) || getDefaultNumber();
  const waLink = buildWaLink(number, text);

  if (!isConfigured()) {
    console.log(`[WHATSAPP:${number}] ${text}`);
    return { skipped: true, waLink };
  }

  try {
    const baseUrl = process.env.OPENWA_API_URL.replace(/\/$/, '');
    const session = process.env.OPENWA_SESSION_ID;
    const url = `${baseUrl}/sessions/${session}/messages/send-text`;

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.OPENWA_API_KEY) {
      headers['x-api-key'] = process.env.OPENWA_API_KEY;
      headers['Authorization'] = `Bearer ${process.env.OPENWA_API_KEY}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ chatId: `${number}@c.us`, text }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`[WHATSAPP] OpenWA respondió ${response.status}: ${detail}`);
      return { skipped: false, delivered: false, waLink };
    }

    return { skipped: false, delivered: true, waLink };
  } catch (error) {
    console.error(`[WHATSAPP] Error enviando por OpenWA: ${error.message}`);
    return { skipped: false, delivered: false, waLink };
  }
}

async function getStatus() {
  if (!isConfigured()) {
    return { configured: false, connected: false };
  }

  try {
    const baseUrl = process.env.OPENWA_API_URL.replace(/\/$/, '');
    const session = process.env.OPENWA_SESSION_ID;
    const headers = {};
    if (process.env.OPENWA_API_KEY) {
      headers['x-api-key'] = process.env.OPENWA_API_KEY;
      headers['Authorization'] = `Bearer ${process.env.OPENWA_API_KEY}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(`${baseUrl}/sessions/${session}`, { headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) return { configured: true, connected: false };
    const data = await response.json().catch(() => ({}));
    return { configured: true, connected: data?.status === 'CONNECTED' || data?.state === 'CONNECTED', raw: data };
  } catch (error) {
    return { configured: true, connected: false, error: error.message };
  }
}

module.exports = {
  DEFAULT_COUNTRY_CODE,
  getDefaultNumber,
  normalizeNumber,
  buildWaLink,
  isConfigured,
  sendText,
  getStatus
};
