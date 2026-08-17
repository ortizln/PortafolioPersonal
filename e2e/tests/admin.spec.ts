import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@portfolio.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Admin123!';

test.describe('Admin', () => {
  test('sin sesión redirige a /auth/login', async ({ page }) => {
    await page.goto('admin/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('login correcto llega al dashboard', async ({ page }) => {
    await page.goto('auth/login');
    await page.locator('#email').fill(ADMIN_EMAIL);
    await page.locator('#password').fill(ADMIN_PASSWORD);
    await page.locator('button.btn-submit').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20_000 });
    await expect(page.locator('.sidebar-brand')).toBeVisible();
  });

  test('login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('auth/login');
    await page.locator('#email').fill('inexistente@test.local');
    await page.locator('#password').fill('ClaveIncorrecta!');
    await page.locator('button.btn-submit').click();
    await expect(page.locator('.alert-error')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.alert-error')).toContainText('Invalid credentials');
  });

  test('admin puede ver la sección de posts', async ({ page }) => {
    await page.goto('auth/login');
    await page.locator('#email').fill(ADMIN_EMAIL);
    await page.locator('#password').fill(ADMIN_PASSWORD);
    await page.locator('button.btn-submit').click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20_000 });

    await page.locator('.sidebar-nav').getByRole('link', { name: /Blog/ }).click();
    await expect(page).toHaveURL(/\/admin\/posts/);
    await expect(page.locator('body')).toContainText(/publicaciones|Posts|Blog/i);
  });
});
