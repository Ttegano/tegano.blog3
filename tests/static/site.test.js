// Static checks: read the files on disk and look for mistakes. No browser needed, runs in under a second.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
const SKIP = new Set(['node_modules', '.git', '.github', 'tests', 'playwright-report', 'test-results']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    fs.statSync(full).isDirectory() ? walk(full, out) : out.push(full);
  }
  return out;
}
const files = walk(root);
const pages = files.filter(f => f.endsWith('.html'));
const rel = f => path.relative(root, f);

test('every internal link, script, stylesheet and image points to a file that exists', () => {
  const problems = [];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    // only real links and files; <use href="#i-..."> icons are checked in their own test below
    for (const m of html.matchAll(/<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]*)"/g)) {
      const url = m[1];
      if (!url || /^(https?:|mailto:|data:|tel:|javascript:)/.test(url)) continue;
      const [pathPart, fragment] = url.split('#');
      const clean = pathPart.split('?')[0];
      const target = clean ? path.resolve(path.dirname(page), clean) : page;
      if (!fs.existsSync(target)) { problems.push(`${rel(page)}: missing file "${url}"`); continue; }
      if (fragment && target.endsWith('.html') &&
          !fs.readFileSync(target, 'utf8').includes(`id="${fragment}"`)) {
        problems.push(`${rel(page)}: missing anchor "${url}"`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('no leftover placeholders, retired domain or unfinished markers', () => {
  const forbidden = ['teganomasinde.blog', 'YOUR_EMAIL@example.com', 'Lorem ipsum', 'class="ph"', 'FIXME'];
  const problems = [];
  for (const f of files.filter(f => /\.(html|js|css)$/.test(f))) {
    const text = fs.readFileSync(f, 'utf8');
    for (const word of forbidden) if (text.includes(word)) problems.push(`${rel(f)} contains "${word}"`);
  }
  assert.deepEqual(problems, []);
});

test('every page has the basics: language, title, description, viewport, one h1, image alt and size', () => {
  const problems = [];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const name = rel(page);
    if (!/<html[^>]*\blang="[a-z-]+"/.test(html)) problems.push(`${name}: <html lang> missing`);
    if (!/<title>[^<]{5,}<\/title>/.test(html)) problems.push(`${name}: title missing or too short`);
    if (!/<meta\s+name="description"\s+content="[^"]{30,}"/.test(html)) problems.push(`${name}: meta description missing`);
    if (!/<meta\s+name="viewport"/.test(html)) problems.push(`${name}: viewport meta missing`);
    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) problems.push(`${name}: expected 1 <h1>, found ${h1s}`);
    for (const img of html.match(/<img\b[^>]*>/g) || []) {
      if (!/\balt=/.test(img)) problems.push(`${name}: <img> without alt: ${img.slice(0, 70)}`);
      if (!/\bwidth=/.test(img) || !/\bheight=/.test(img)) problems.push(`${name}: <img> without width/height: ${img.slice(0, 70)}`);
    }
  }
  assert.deepEqual(problems, []);
});

test('performance budget: images stay small', () => {
  const images = files.filter(f => /\.(jpe?g|png|webp|svg|gif)$/i.test(f));
  const tooBig = images.filter(f => fs.statSync(f).size > 350 * 1024).map(f => `${rel(f)} is ${Math.round(fs.statSync(f).size / 1024)} KB`);
  const total = images.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  assert.deepEqual(tooBig, [], 'Compress these images (limit 350 KB each)');
  assert.ok(total < 1.2 * 1024 * 1024, `All images together are ${Math.round(total / 1024)} KB (limit 1200 KB)`);
});

test('the custom domain file is correct', () => {
  assert.equal(fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), 'softwarebreaks.online');
});

test('JavaScript files have valid syntax', () => {
  for (const f of files.filter(f => f.endsWith('.js') && !f.includes('playwright.config'))) {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }), rel(f));
  }
});

test('every icon used in the pages exists in the icon list in script.js', () => {
  const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  const defined = new Set([...js.matchAll(/^\s{2}(\w+):\s*'</gm)].map(m => m[1]));
  const problems = [];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    for (const m of html.matchAll(/<use\s+href="#i-([\w-]+)"/g)) {
      if (!defined.has(m[1])) problems.push(`${rel(page)}: icon "${m[1]}" is not defined in script.js`);
    }
  }
  assert.deepEqual(problems, []);
});
