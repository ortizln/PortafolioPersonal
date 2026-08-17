import { test, expect } from '@playwright/test';

test.describe('Sitio público', () => {
  test('la home carga con el navbar y el acceso al Blog', async ({ page }) => {
    await page.goto('.');
    await expect(page.locator('.navbar-brand')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Blog', exact: true }).first()).toBeVisible();
    await expect(page).toHaveTitle(/.*/);
  });

  test('la página /blog lista publicaciones o muestra estado vacío', async ({ page }) => {
    await page.goto('blog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.spinner').first()).toBeHidden({ timeout: 10_000 }).catch(() => {});
    const empty = page.getByText('No hay publicaciones aún', { exact: false });
    const cards = page.locator('article.blog-card');
    await expect(empty.or(cards.first())).toBeVisible({ timeout: 10_000 });
  });

  test('abre un post desde la lista del blog', async ({ page }) => {
    await page.goto('blog');
    await page.waitForLoadState('networkidle');
    const card = page.locator('article.blog-card').first();
    const count = await card.count();
    if (count === 0) {
      test.skip(true, 'No hay publicaciones publicadas');
      return;
    }
    await card.locator('.blog-title').click();
    await expect(page).toHaveURL(/\/blog\/.+/);
  });

  test('la página /contacto muestra el formulario', async ({ page }) => {
    await page.goto('contacto');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.contact-form').first()).toBeVisible({ timeout: 15_000 });
  });

  test('una ruta inexistente redirige a la home', async ({ page }) => {
    await page.goto('ruta-inexistente');
    await expect(page).toHaveURL(/\/portfolio\/$/);
  });
});
