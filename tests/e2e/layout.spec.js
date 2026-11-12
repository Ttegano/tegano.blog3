// Regression tests for the problems we actually hit: sideways scrolling, broken images, console errors.
const { test, expect } = require('@playwright/test');
const { PAGES, stubFonts, scrollThrough } = require('./helpers');

const WIDTHS = [
  { name: 'small phone', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 }
];

for (const url of PAGES) {
  for (const vp of WIDTHS) {
    test(`${url} fits a ${vp.name} (${vp.width}px): no sideways scroll, images load, no errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push('JS error: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push('Console: ' + m.text()); });
      page.on('requestfailed', r => errors.push('Request failed: ' + r.url()));
      await stubFonts(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url);
      await scrollThrough(page);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, 'page is wider than the screen by this many px').toBeLessThanOrEqual(0);

      const broken = await page.$$eval('img', imgs => imgs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')));
      expect(broken, 'images that failed to load').toEqual([]);

      expect(errors).toEqual([]);
    });
  }
}

test('case study banner stays short on a phone', async ({ page }) => {
  await stubFonts(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cases/case-server.html');
  const box = await page.locator('.case-fig img').boundingBox();
  expect(box.height, 'banner height in px').toBeLessThan(240);
});
