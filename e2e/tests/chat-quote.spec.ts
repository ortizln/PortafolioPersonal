import { test, expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@portfolio.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!';
const STAMP = Date.now().toString(36);
const CONTACT_NAME = `E2E Bot ${STAMP}`;
const CONTACT_EMAIL = `e2e.${STAMP}@example.com`;

async function openChat(page: Page) {
  await page.goto('.');
  await page.locator('.chat-bubble').click();
  await expect(page.locator('#alantek-chat-panel')).toBeVisible();
}

async function loginAsAdmin(page: Page) {
  await page.goto('auth/login');
  await page.locator('#email').fill(ADMIN_EMAIL);
  await page.locator('#password').fill(ADMIN_PASSWORD);
  await page.locator('button.btn-submit').click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20_000 });
}

test.describe('Chatbot público', () => {
  test('el flujo de cotización genera una referencia COT', async ({ page }) => {
    await openChat(page);

    await page.getByRole('button', { name: 'Cotizar un proyecto' }).click();
    await page.getByRole('button', { name: 'Desarrollo web / e-commerce' }).click();

    await page.locator('.chat-input').fill('Necesito una tienda en línea con pagos.');
    await page.locator('.chat-send').click();

    await page.locator('.chat-input').fill('catálogo, carrito, pagos');
    await page.locator('.chat-send').click();

    await page.getByRole('button', { name: '$1.000 - $5.000' }).click();

    await page.locator('.chat-input').fill(CONTACT_NAME);
    await page.locator('.chat-send').click();

    await page.locator('.chat-input').fill(CONTACT_EMAIL);
    await page.locator('.chat-send').click();

    await page.getByRole('button', { name: 'Enviar solicitud' }).click();

    await expect(page.locator('.chat-log')).toContainText(/referencia COT-/, { timeout: 20_000 });

    const stored = await page.evaluate(() => sessionStorage.getItem('alantek-chat-session'));
    expect(stored).toBeTruthy();
  });

  test('los mensajes persisten tras recargar', async ({ page }) => {
    await openChat(page);
    await page.getByRole('button', { name: 'Servicios' }).click();
    await expect(page.locator('.chat-msg').nth(1)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await page.locator('.chat-bubble').click();
    await expect(page.locator('.chat-msg').first()).toBeVisible({ timeout: 15_000 });
    expect(await page.locator('.chat-msg').count()).toBeGreaterThanOrEqual(2);
  });

  test('solicitar asesor abre WhatsApp y registra el handoff', async ({ page }) => {
    await openChat(page);
    await page.getByRole('button', { name: 'Hablar con un asesor' }).click();

    const handoffRequest = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/public\/chat\/sessions\/[^/]+\/handoff/.test(req.url()),
      { timeout: 15_000 }
    );
    const popupPromise = page.waitForEvent('popup');

    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();

    await handoffRequest;
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded').catch(() => {});
    expect(popup.url()).toMatch(/wa\.me|whatsapp|about:blank/);
  });
});

test.describe('Panel admin: cotizaciones y chats', () => {
  test('la cotización creada aparece en /admin/quotes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('admin/quotes');
    await page.locator('.search-box input').fill(CONTACT_EMAIL);
    await page.keyboard.press('Enter');
    await expect(page.locator('.quotes-table')).toContainText(CONTACT_NAME, { timeout: 15_000 });
  });

  test('la vista /admin/chats lista conversaciones', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('admin/chats');
    await expect(page.locator('.chat-admin')).toBeVisible();
    await expect(page.locator('.session-item').first()).toBeVisible({ timeout: 15_000 });
  });
});
