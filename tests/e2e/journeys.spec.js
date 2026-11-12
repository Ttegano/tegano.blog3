// "User journey" tests: a real browser clicks through the site the way a visitor would.
const { test, expect } = require('@playwright/test');
const { stubFonts, scrollThrough } = require('./helpers');

test.beforeEach(async ({ page }) => { await stubFonts(page); });

test('home page leads with the emergency headline and a working audit button', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Critical October 2026 PHP Flaws');
  await page.locator('.hero').getByRole('link', { name: 'Book an Emergency Security Audit' }).click();
  await expect(page).toHaveURL(/report\.html\?issues=audit/);
  await expect(page.getByLabel('Emergency security audit')).toBeChecked();
});

test('menu opens, shows every section, and closes with Escape', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Site menu' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link')).toHaveCount(7);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('choosing two problems carries them over to the report form', async ({ page }) => {
  await page.goto('/index.html');
  await scrollThrough(page);
  await page.getByRole('button', { name: /I think I've been hacked/ }).click();
  await page.getByRole('button', { name: /It broke after an update/ }).click();
  await expect(page.locator('#pickBar')).toContainText('2 problems selected');
  await page.getByRole('link', { name: 'Continue' }).click();
  await expect(page.getByLabel("I think I've been hacked")).toBeChecked();
  await expect(page.getByLabel('Broke after an update')).toBeChecked();
  await expect(page.getByLabel('Very slow')).not.toBeChecked();
});

test('each case study card opens a page with a heading and a visible image', async ({ page }) => {
  await page.goto('/index.html');
  await scrollThrough(page);
  const count = await page.locator('.case-card h3 a').count();
  expect(count).toBe(3);
  for (let i = 0; i < count; i++) {
    await page.goto('/index.html');
    await scrollThrough(page);
    await page.locator('.case-card h3 a').nth(i).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const loaded = await page.locator('.case-fig img').evaluate(img => img.complete && img.naturalWidth > 0);
    expect(loaded, 'the case study banner image should load').toBe(true);
    await expect(page.locator('.note-box')).toBeVisible();
  }
});

test('report form: shows errors, then a ready-to-send summary', async ({ page }) => {
  await page.goto('/report.html');
  await page.getByRole('button', { name: 'Send my report' }).click();
  await expect(page.locator('#e-issue')).not.toBeEmpty();
  await expect(page.locator('#e-msg')).not.toBeEmpty();
  await page.getByLabel('Very slow').check();
  await page.getByLabel('Website address').fill('example.com');
  await page.getByLabel('What are you seeing?').fill('Pages take 20 seconds to open');
  await page.getByLabel('Your name').fill('Ann');
  await page.getByLabel('Your email').fill('ann@example.com');
  await page.getByRole('button', { name: 'Send my report' }).click();
  await expect(page.getByRole('heading', { name: /report is ready|report was sent/i })).toBeVisible();
  await expect(page.locator('#sum')).toContainText('Pages take 20 seconds to open');
});

test('blog diagrams actually draw something', async ({ page }) => {
  await page.goto('/blog/php2shell-wordpress-explained.html');
  const canvases = page.locator('canvas[data-diagram]');
  await expect(canvases).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const c = canvases.nth(i);
    await c.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);               // reveal animation takes ~1.1 s
    const painted = await c.evaluate(cv => {
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let coloured = 0;
      for (let p = 0; p < d.length; p += 4) if (d[p + 3] > 0 && (d[p] < 240 || d[p + 1] < 240 || d[p + 2] < 240)) coloured++;
      return coloured / (d.length / 4);
    });
    expect(painted, `diagram ${i + 1} should be mostly drawn`).toBeGreaterThan(0.1);
  }
});
