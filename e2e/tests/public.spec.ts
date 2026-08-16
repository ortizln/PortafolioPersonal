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
    const empty = page.locator('.page-empty');
    const grid = page.locator('.blog-grid');
    await expect(page.getByText('No hay publicaciones aún', { exact: false }).or(grid)).toBeVisible();
    if ((await grid.count()) > 0) {
      await expect(grid.locator('.blog-card').first()).toBeVisible();
    }
  });

  test('abre un post desde la lista del blog', async ({ page }) => {
    await page.goto('blog');
    const card = page.locator('.blog-card').first();
    if ((await card.count()) === 0) {
      test.skip(true, 'No hay publicaciones publicadas');
      return;
    }
    await card.locator('.blog-title').click();
    await expect(page).toHaveURL(/\/blog\/.+/);
  });

  test('la página /contacto muestra el formulario', async ({ page }) => {
    await page.goto('contacto');
    await expect(page.locator('.contact-form').first()).toBeVisible();
  });

  test('una ruta inexistente redirige a la home', async ({ page }) => {
    await page.goto('ruta-inexistente');
    await expect(page).toHaveURL(/\/portfolio\/$/);
  });
});
