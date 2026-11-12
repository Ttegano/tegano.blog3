// Shared helpers for the browser tests.
const PAGES = [
  '/index.html',
  '/report.html',
  '/cases/case-elementor-compromise.html',
  '/cases/case-plugin-update.html',
  '/cases/case-server.html',
  '/blog/php2shell-wordpress-explained.html'
];

// Keep tests fast and repeatable: do not depend on Google Fonts being reachable.
async function stubFonts(page) {
  await page.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route(/fonts\.gstatic\.com/, r => r.fulfill({ status: 200, body: '' }));
}

// Scroll through the page so lazy images load and scroll-reveal animations run.
async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 80));
    }
    // bring every image into view and wait for it; a broken image rejects here and is caught by the tests
    for (const img of document.images) {
      img.scrollIntoView({ block: 'center' });
      try { await img.decode(); } catch (e) { /* reported by the test that checks naturalWidth */ }
    }
    window.scrollTo(0, 0);
  });
}
module.exports = { PAGES, stubFonts, scrollThrough };
