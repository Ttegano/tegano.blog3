// Automated accessibility scan (axe). It finds roughly a third of accessibility problems,
// so it supports, but never replaces, keyboard and screen-reader checks by a person.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { PAGES, stubFonts, scrollThrough } = require('./helpers');

for (const url of PAGES) {
  test(`${url} has no serious accessibility violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });   // skip fade-in animations so text is fully visible
    await stubFonts(page);
    await page.goto(url);
    await scrollThrough(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
    const summary = serious.map(v => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
    expect(summary).toEqual([]);
  });
}
