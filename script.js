document.documentElement.classList.add('js');

/* ---------- Icons (one sprite shared by every page) ---------- */
const P = {
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8"/><path d="M21 3v5h-5"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>'
};
document.body.insertAdjacentHTML('afterbegin',
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
  Object.entries(P).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') +
  '</defs></svg>');

/* ---------- Full-screen menu ---------- */
(() => {
  const btn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const close = menu.querySelector('.menu-close');
  const focusables = () => [...menu.querySelectorAll('a,button')];
  let timer;

  function open() {
    clearTimeout(timer);
    menu.hidden = false;
    document.body.classList.add('lock');
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => requestAnimationFrame(() => { menu.classList.add('open'); close.focus(); }));
  }
  function shut() {
    menu.classList.remove('open');
    document.body.classList.remove('lock');
    btn.setAttribute('aria-expanded', 'false');
    timer = setTimeout(() => { menu.hidden = true; }, 700);
    btn.focus();
  }
  btn.addEventListener('click', open);
  close.addEventListener('click', shut);
  menu.addEventListener('click', e => { if (e.target.closest('a')) shut(); });
  document.addEventListener('keydown', e => {
    if (menu.hidden) return;
    if (e.key === 'Escape') shut();
    if (e.key === 'Tab') {            // keep keyboard focus inside the menu
      const f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* ---------- Scroll reveal ---------- */
(() => {
  const els = [...document.querySelectorAll('.rv')];
  if (!els.length) return;
  els.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    el.style.transitionDelay = (sibs.indexOf(el) % 4) * 90 + 'ms';
  });
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) {
      const el = en.target; el.classList.add('in'); io.unobserve(el);
      setTimeout(() => { el.style.transitionDelay = ''; }, 1100);   // so hover effects are not delayed
    }
  }), { threshold: .12 });
  els.forEach(e => io.observe(e));
})();

/* ---------- Problem cards: pick one or more, then go to the report page ---------- */
(() => {
  const cards = [...document.querySelectorAll('.card[data-issue]')];
  const bar = document.getElementById('pickBar');
  if (!cards.length || !bar) return;
  const count = document.getElementById('pickCount');
  const go = document.getElementById('pickGo');
  const clear = document.getElementById('pickClear');

  function update() {
    const on = cards.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.issue);
    bar.classList.toggle('show', on.length > 0);
    count.textContent = on.length === 1 ? '1 problem selected' : on.length + ' problems selected';
    go.href = 'report.html' + (on.length ? '?issues=' + encodeURIComponent(on.join(',')) : '');
  }
  cards.forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    update();
  }));
  clear.addEventListener('click', () => { cards.forEach(c => c.setAttribute('aria-pressed', 'false')); update(); });
  window.addEventListener('pageshow', update);   // correct after using the Back button
  update();
})();

/* ---------- Copy buttons on code blocks ---------- */
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const text = b.closest('.code').querySelector('pre').innerText;
  try { await navigator.clipboard.writeText(text); } catch (e) {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (_) {} t.remove();
  }
  const old = b.textContent; b.textContent = 'Copied'; setTimeout(() => { b.textContent = old; }, 1600);
}));

/* ---------- Header background drawn on a canvas ----------
   A network of dots (the parts of a website). Every few seconds one dot
   flashes amber (a problem), then settles back to blue (fixed). */
(() => {
  const cv = document.getElementById('bg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dots = [], running = true, last = 0, issue = null;

  function size() {
    const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    w = r.width; h = r.height;
    cv.width = w * d; cv.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.round(Math.min(70, Math.max(24, w * h / 16000)));
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: 1.6 + Math.random() * 1.8
    }));
    issue = null;
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    if (!still && t - last > 3800 && !issue) { issue = dots[(Math.random() * dots.length) | 0]; issue.bad = t; last = t; }
    for (const p of dots) {
      if (!still) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
    }
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.strokeStyle = 'rgba(150,200,255,' + (0.28 * (1 - d / 130)) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const p of dots) {
      let color = 'rgba(170,215,255,.85)', rad = p.r;
      if (p === issue) {
        const age = t - p.bad;
        if (age < 1300) { color = '#ffb84d'; rad = p.r + 2; }
        else if (age < 2300) {
          const k = (age - 1300) / 1000;
          color = 'rgba(120,230,190,.95)';
          ctx.strokeStyle = 'rgba(120,230,190,' + (1 - k) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, rad + k * 26, 0, 7); ctx.stroke();
        } else issue = null;
      }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 7); ctx.fill();
    }
    if (running && !still) requestAnimationFrame(frame);
  }

  size();
  frame(0);
  window.addEventListener('resize', () => { size(); if (still) frame(0); });
  new IntersectionObserver(([e]) => {       // pause when the header is off-screen
    const was = running; running = e.isIntersecting;
    if (running && !was && !still) requestAnimationFrame(frame);
  }).observe(cv);
})();
