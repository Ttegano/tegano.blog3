/* Colourful canvas diagrams for the blog.
   Each <canvas data-diagram="layers|who|steps"> is drawn by one of the builders below.
   A builder measures its text for the current width, returns the canvas height and a draw()
   function. Diagrams slide in when scrolled into view and redraw on resize. */
(() => {
  const C = {
    navy: '#0a1f44', blue: '#1d5fd1', sky: '#dcecff', ink: '#0f2142', muted: '#51648a', line: '#d3e3f8',
    mint: '#2fbf8a', mintDk: '#0f8a5f', amber: '#ffc233', amberDk: '#a86a00', coral: '#e0483b', teal: '#1593b8'
  };
  const FONT = '"Poppins","Segoe UI",system-ui,sans-serif';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - clamp(t), 3);
  const stage = (p, i, n) => ease((p * (n + 1) - i) / 2);   // staggered 0..1 for item i of n

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(ctx, str, maxW) {
    const out = []; let cur = '';
    for (const w of str.split(' ')) {
      const t = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out;
  }
  function setFont(ctx, size, weight) { ctx.font = `${weight || 400} ${size}px ${FONT}`; }
  // Draws wrapped text and returns its height
  function para(ctx, str, x, y, maxW, size, weight, color, lh = 1.4) {
    setFont(ctx, size, weight); ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const lines = wrap(ctx, str, maxW);
    lines.forEach((l, i) => ctx.fillText(l, x, y + size + i * size * lh));
    return lines.length * size * lh;
  }
  function measure(ctx, str, maxW, size, weight, lh = 1.4) {
    setFont(ctx, size, weight);
    return wrap(ctx, str, maxW).length * size * lh;
  }
  function pill(ctx, str, x, y, fill, color, size = 12) {
    setFont(ctx, size, 600);
    const w = ctx.measureText(str).width + 20, h = size + 10;
    ctx.fillStyle = fill; rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(str, x + 10, y + size + 3);
    return w;
  }
  function chevronDown(ctx, x, y, color, s = 6) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s, y - s / 2); ctx.lineTo(x, y + s / 2); ctx.lineTo(x + s, y - s / 2); ctx.stroke();
  }
  function chevronRight(ctx, x, y, color, s = 6) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s / 2, y - s); ctx.lineTo(x + s / 2, y); ctx.lineTo(x - s / 2, y + s); ctx.stroke();
  }

  /* ---------- 1. The layers behind a website ---------- */
  function layers(ctx, W) {
    const narrow = W < 520, pad = 14, top = 18, bottom = 20;
    const barH = narrow ? 94 : 72, gap = narrow ? 24 : 26;
    const L = [
      { t: 'Your visitors', s: 'People opening your website', col: C.sky, ink: C.ink, tag: null },
      { t: 'Your hosting server', s: 'The computer your website lives on', col: C.blue, ink: '#fff', tag: 'Host or server admin' },
      { t: 'PHP, the engine', s: 'The PHP2Shell flaws are in this layer', col: C.coral, ink: '#fff', tag: 'Host or server admin', hot: true },
      { t: 'WordPress', s: 'What you update from your dashboard', col: C.mintDk, ink: '#fff', tag: 'Your dashboard' },
      { t: 'Plugins and theme', s: 'Also updated from your dashboard', col: C.mint, ink: '#06261b', tag: 'Your dashboard' }
    ];
    const H = top + L.length * barH + (L.length - 1) * gap + bottom;
    const bw = W - pad * 2;
    return {
      H, animated: true,
      draw(ctx, p, t) {
        if (p >= 1) {                       // a visitor's request travelling down through the layers
          const total = H - top - bottom, k = ((t / 2600) % 1), y = top + k * total;
          const g = ctx.createRadialGradient(W / 2, y, 0, W / 2, y, 14);
          g.addColorStop(0, 'rgba(255,194,51,1)'); g.addColorStop(1, 'rgba(255,194,51,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, y, 14, 0, 7); ctx.fill();
        }
        L.forEach((l, i) => {
          const a = stage(p, i, L.length), y = top + i * (barH + gap), x = pad + (1 - a) * -28;
          ctx.globalAlpha = a;
          if (l.hot) {
            const k = (Math.sin(t / 380) + 1) / 2;
            ctx.strokeStyle = `rgba(224,72,59,${0.18 + 0.3 * k})`; ctx.lineWidth = 6 + 6 * k;
            rr(ctx, x - 3, y - 3, bw + 6, barH + 6, 20); ctx.stroke();
          }
          ctx.fillStyle = l.col; rr(ctx, x, y, bw, barH, 16); ctx.fill();
          setFont(ctx, 17, 600); ctx.fillStyle = l.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(l.t, x + 18, y + 30);
          para(ctx, l.s, x + 18, y + 36, bw - 36 - (narrow ? 0 : 190), 13, 400, l.ink, 1.3);
          if (l.tag) {
            setFont(ctx, 12, 600);
            const tw = ctx.measureText(l.tag).width + 20;
            const tx = narrow ? x + 18 : x + bw - tw - 16, ty = narrow ? y + barH - 32 : y + (barH - 22) / 2;
            pill(ctx, l.tag, tx, ty, 'rgba(255,255,255,.92)', C.navy);
          }
          if (i < L.length - 1) chevronDown(ctx, W / 2, y + barH + gap / 2, C.muted);
          ctx.globalAlpha = 1;
        });
      }
    };
  }

  /* ---------- 2. Who updates PHP on each kind of hosting ---------- */
  function who(ctx, W) {
    const cols = W >= 720 ? 3 : 1, pad = 14, gap = 16, top = 16, bottom = 18;
    const cw = (W - pad * 2 - gap * (cols - 1)) / cols, inner = cw - 32;
    const D = [
      { h: 'Shared hosting', col: C.blue, ic: 'shared', who: 'Your hosting company updates PHP.', you: 'Check your PHP version is 8.2 or newer, and ask them to confirm the fix is installed.' },
      { h: 'Managed WordPress hosting', col: C.mintDk, ic: 'shield', who: 'Your host looks after PHP for you.', you: 'Ask them to confirm the fix is installed, not just planned.' },
      { h: 'Your own server (VPS)', col: C.amberDk, ic: 'server', who: 'You, or your server admin, must update PHP.', you: 'Install the update and restart PHP. This is where I can step in.' }
    ];
    const headH = 66;
    const bodyH = Math.max(...D.map(d =>
      16 + 14 + measure(ctx, d.who, inner, 14.5, 600) + 12 + 14 + measure(ctx, d.you, inner, 13, 400) + 18));
    const cardH = headH + bodyH, rows = cols === 3 ? 1 : 3;
    const H = top + rows * cardH + (rows - 1) * gap + bottom;
    function icon(ctx, kind, cx, cy) {
      ctx.fillStyle = '#fff';
      if (kind === 'shared') { [-9, 0, 9].forEach(dx => { rr(ctx, cx + dx - 3.5 - 4, cy - 8, 8, 16, 2); ctx.fill(); }); }
      else if (kind === 'shield') {
        ctx.beginPath(); ctx.moveTo(cx, cy - 13); ctx.lineTo(cx + 11, cy - 8); ctx.lineTo(cx + 11, cy + 2);
        ctx.quadraticCurveTo(cx + 11, cy + 10, cx, cy + 14); ctx.quadraticCurveTo(cx - 11, cy + 10, cx - 11, cy + 2);
        ctx.lineTo(cx - 11, cy - 8); ctx.closePath(); ctx.fill();
      } else {
        rr(ctx, cx - 12, cy - 12, 24, 10, 3); ctx.fill(); rr(ctx, cx - 12, cy + 2, 24, 10, 3); ctx.fill();
        ctx.fillStyle = C.amberDk; [cy - 7, cy + 7].forEach(y => { ctx.beginPath(); ctx.arc(cx - 7, y, 1.8, 0, 7); ctx.fill(); });
      }
    }
    return {
      H, animated: false,
      draw(ctx, p) {
        D.forEach((d, i) => {
          const a = stage(p, i, D.length);
          const col = cols === 3 ? i : 0, row = cols === 3 ? 0 : i;
          const x = pad + col * (cw + gap), y = top + row * (cardH + gap) + (1 - a) * 22;
          ctx.globalAlpha = a;
          ctx.fillStyle = '#fff'; rr(ctx, x, y, cw, cardH, 16); ctx.fill();
          ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; rr(ctx, x, y, cw, cardH, 16); ctx.stroke();
          ctx.save(); rr(ctx, x, y, cw, cardH, 16); ctx.clip();
          ctx.fillStyle = d.col; ctx.fillRect(x, y, cw, headH); ctx.restore();
          ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(x + 34, y + headH / 2, 20, 0, 7); ctx.fill();
          icon(ctx, d.ic, x + 34, y + headH / 2);
          para(ctx, d.h, x + 64, y + (measure(ctx, d.h, cw - 80, 15.5, 600) > 25 ? 12 : 21), cw - 80, 15.5, 600, '#fff', 1.25);
          let yy = y + headH + 16;
          setFont(ctx, 11.5, 600); ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.fillText('Who updates PHP?', x + 16, yy + 10);
          yy += 14; yy += para(ctx, d.who, x + 16, yy, inner, 14.5, 600, C.ink) + 12;
          setFont(ctx, 11.5, 600); ctx.fillStyle = C.muted; ctx.fillText('Your job', x + 16, yy + 10);
          yy += 14; para(ctx, d.you, x + 16, yy, inner, 13, 400, C.ink);
          ctx.globalAlpha = 1;
        });
      }
    };
  }

  /* ---------- 3. What to do today ---------- */
  function steps(ctx, W) {
    const wide = W >= 720, pad = 14, top = 18, bottom = 18, gapX = 26, gapY = 26;
    const S = [
      { t: 'Find your PHP version', d: 'In WordPress: Tools, then Site Health, then Info, then Server.', col: C.blue },
      { t: 'Check it is supported', d: 'Aim for 8.2 or newer. PHP 8.1 and older no longer get security fixes.', col: C.teal },
      { t: 'Ask your host to confirm', d: 'Ask them to confirm the fix is installed, not just scheduled.', col: C.mintDk },
      { t: 'Keep their answer', d: 'Save the reply, and check again after any change to your hosting.', col: C.amberDk }
    ];
    const cw = wide ? (W - pad * 2 - gapX * 3) / 4 : W - pad * 2, inner = cw - 32;
    const cardH = Math.max(...S.map(s => 62 + measure(ctx, s.t, inner, 15.5, 600, 1.25) + 8 + measure(ctx, s.d, inner, 13, 400) + 18));
    const H = wide ? top + cardH + bottom : top + S.length * cardH + (S.length - 1) * gapY + bottom;
    return {
      H, animated: false,
      draw(ctx, p) {
        S.forEach((s, i) => {
          const a = stage(p, i, S.length);
          const x = wide ? pad + i * (cw + gapX) : pad, y = (wide ? top : top + i * (cardH + gapY)) + (1 - a) * 22;
          ctx.globalAlpha = a;
          ctx.fillStyle = '#fff'; rr(ctx, x, y, cw, cardH, 16); ctx.fill();
          ctx.strokeStyle = s.col; ctx.lineWidth = 2; rr(ctx, x, y, cw, cardH, 16); ctx.stroke();
          ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(x + 32, y + 32, 16, 0, 7); ctx.fill();
          setFont(ctx, 16, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x + 32, y + 38);
          let yy = y + 62;
          yy += para(ctx, s.t, x + 16, yy, inner, 15.5, 600, C.ink, 1.25) + 8;
          para(ctx, s.d, x + 16, yy, inner, 13, 400, C.muted);
          if (i < S.length - 1) {
            if (wide) chevronRight(ctx, x + cw + gapX / 2, y + 32, C.muted);
            else chevronDown(ctx, x + cw / 2, y + cardH + gapY / 2, C.muted);
          }
          ctx.globalAlpha = 1;
        });
      }
    };
  }

  const B = { layers, who, steps };
  window.TEGANO_DIAGRAMS = B;

  function mount(canvas, build) {
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene = null, W = 0, dpr = 1, started = null, visible = false, raf = 0, pending = false;

    function frame(now) {
      raf = 0;
      if (!scene) return;
      const p = reduce ? 1 : (started === null ? 0 : clamp((now - started) / 1100));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, scene.H);
      scene.draw(ctx, p, now);
      if (visible && !reduce && (p < 1 || scene.animated)) raf = requestAnimationFrame(frame);
    }
    function layout() {
      pending = false;
      const w = Math.round(canvas.parentElement.clientWidth);
      if (!w || w === W && scene) return;
      W = w; dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      scene = build(ctx, W);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(scene.H * dpr);
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(layout); } }
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(canvas.parentElement);
    else window.addEventListener('resize', schedule);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { if (started === null) started = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
    }, { threshold: 0.15 }).observe(canvas);
  }

  document.querySelectorAll('canvas[data-diagram]').forEach(cv => {
    const b = B[cv.dataset.diagram];
    if (b) mount(cv, b);
  });
})();
