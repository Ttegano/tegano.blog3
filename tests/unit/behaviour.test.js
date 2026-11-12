// Behaviour tests without a real browser: jsdom runs the page's own JavaScript in a simulated page.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '../..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function load(page, query = '', { scripts = ['script.js'], patch = s => s, setup } = {}) {
  const html = read(page).replace(/<script src="[^"]+"><\/script>/g, '');
  const win = new JSDOM(html, { url: `http://localhost/${page}${query}`, runScripts: 'outside-only', pretendToBeVisual: true }).window;
  win.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => { }, set: () => true });
  win.IntersectionObserver = class { observe() { } unobserve() { } };
  win.matchMedia = () => ({ matches: true });
  win.requestAnimationFrame = () => 0;
  win.Element.prototype.scrollIntoView = () => { };
  if (setup) setup(win);
  for (const s of scripts) win.eval(patch(read(s)));
  return win;
}
const tick = (ms = 20) => new Promise(r => setTimeout(r, ms));
function fillReport(win, over = {}) {
  const f = win.document.getElementById('form');
  Object.assign(f.elements.msg, { value: over.msg ?? 'The homepage is a white screen' });
  f.elements.name.value = over.name ?? 'Ann';
  f.elements.email.value = over.email ?? 'ann@example.com';
  f.elements.site.value = 'ann.example';
  return f;
}
const submit = (win, f) => f.dispatchEvent(new win.Event('submit', { cancelable: true, bubbles: true }));

test('home page: picking problem cards builds the link to the report form', () => {
  const doc = load('index.html').document;
  const cards = [...doc.querySelectorAll('.card[data-issue]')];
  assert.equal(cards.length, 6);
  cards[0].click(); cards[2].click();
  assert.equal(doc.getElementById('pickGo').getAttribute('href'), 'report.html?issues=error%2Cupdate');
  assert.equal(doc.getElementById('pickCount').textContent, '2 problems selected');
  doc.getElementById('pickClear').click();
  assert.ok(!doc.getElementById('pickBar').classList.contains('show'));
});

test('menu opens and closes with the keyboard', () => {
  const win = load('index.html'); const doc = win.document;
  const btn = doc.querySelector('.menu-btn');
  btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
});

test('report form: ticks the options chosen on the home page', () => {
  const doc = load('report.html', '?issues=audit,hacked', { scripts: ['script.js', 'report.js'] }).document;
  const on = [...doc.querySelectorAll('input[name=issue]:checked')].map(i => i.value);
  assert.deepEqual(on.sort(), ['audit', 'hacked']);
});

test('report form: explains what is missing instead of failing silently', async () => {
  const win = load('report.html', '', { scripts: ['script.js', 'report.js'] }); const doc = win.document;
  submit(win, doc.getElementById('form'));
  for (const id of ['e-issue', 'e-msg', 'e-name', 'e-email']) assert.notEqual(doc.getElementById(id).textContent, '', id);
  const f = fillReport(win, { email: 'not-an-email' });
  doc.querySelector('input[name=issue]').checked = true;
  submit(win, f);
  assert.notEqual(doc.getElementById('e-email').textContent, '');
  assert.equal(doc.getElementById('e-msg').textContent, '');
});

// test('report form without a form service: shows the email-app view with the message', async () => {
//   const win = load('report.html', '?issues=audit', { scripts: ['script.js', 'report.js'] }); const doc = win.document;
//   submit(win, fillReport(win)); await tick();
//   assert.match(doc.getElementById('mail').getAttribute('href'), /^mailto:.+\?subject=.+&body=/);
//   assert.match(doc.getElementById('sum').textContent, /Emergency security audit/);
// });

// const withEndpoint = s => s.replace("const FORMSPREE_ENDPOINT = '';", "const FORMSPREE_ENDPOINT = 'https://formspree.io/f/test';");

test('report form without a form service: shows the email-app view with the message', async () => {
  const win = load('report.html', '?issues=audit', { scripts: ['script.js'] });
  const doc = win.document;

  const reportScript = read('report.js').replace(
    /^const FORMSPREE_ENDPOINT = .*;$/m,
    "const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mljbdlrz';"
  );

  win.eval(reportScript);

  submit(win, fillReport(win));
  await tick();

  assert.match(doc.getElementById('mail').getAttribute('href'), /^mailto:.+\?subject=.+&body=/);
  assert.match(doc.getElementById('sum').textContent, /Emergency security audit/);
});


const withEndpoint = s =>
  s.replace(
    /^const FORMSPREE_ENDPOINT = .*;$/m,
    "const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mljbdlrz';"
  );

test('report form with Formspree: sends the report and thanks the visitor', async () => {
  let call;
  const win = load('report.html', '?issues=hacked', { scripts: ['script.js'] });
  win.fetch = async (url, opts) => { call = { url, body: JSON.parse(opts.body) }; return { ok: true }; };
  win.eval(withEndpoint(read('report.js')));
  submit(win, fillReport(win)); await tick();
  assert.equal(call.url, 'https://formspree.io/f/test');
  assert.equal(call.body.email, 'ann@example.com');
  assert.match(win.document.querySelector('h2').textContent, /report was sent/);
});

test('report form with Formspree: if sending fails, the visitor still gets the email-app fallback', async () => {
  const win = load('report.html', '?issues=hacked', { scripts: ['script.js'] });
  win.fetch = async () => { throw new Error('offline'); };
  win.eval(withEndpoint(read('report.js')));
  submit(win, fillReport(win)); await tick();
  assert.match(win.document.querySelector('h2').textContent, /Almost there/);
  assert.ok(win.document.getElementById('mail'));
});

test('report form: a filled hidden field (a bot) sends nothing', async () => {
  let calls = 0;
  const win = load('report.html', '?issues=hacked', { scripts: ['script.js'] });
  win.fetch = async () => { calls++; return { ok: true }; };
  win.eval(withEndpoint(read('report.js')));
  const f = fillReport(win); f.elements._gotcha.value = 'spam';
  submit(win, f); await tick();
  assert.equal(calls, 0);
});
