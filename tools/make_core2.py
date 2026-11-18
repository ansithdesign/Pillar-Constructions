"""Derive assets/core2.js (runtime for the v2 options) from assets/core.js.
v2 differences: links between the v2 pages and hub, baked graded photography instead of
the runtime grade, and new image modules (loupe, trail, drag) exported on PX."""
src = open('assets/core.js').read()
R = [
("    ['01', 'anatomy', 'Anatomy', 'stillform.homes', 'Depth fly-through gallery, pinned wipes'],\n    ['02', 'verdigris', 'Verdigris', 'casainterior.framer.website', 'Grid zoom, drifting unveils, verdigris rooms'],\n    ['03', 'filmstrip', 'Filmstrip', 'korda.framer.media', 'Fisheye filmstrip driven by the scroll'],\n    ['04', 'monolith', 'Monolith', 'architecttura.framer.website', 'Slit-open hero, parallax reel, honours'],\n    ['05', 'studio', 'Studio', 'mirellstudio.framer.website', 'Scroll-weighted wordmark, pinned wipes'],\n    ['06', 'nord', 'Nord', 'norda.framer.website', 'Logo mask zoom, stacking intro, marquee'],",
 "    ['01', 'anatomy', 'Anatomy', 'Tunnel', 'Fly through a 3D corridor of projects'],\n    ['02', 'verdigris', 'Verdigris', 'Canvas', 'Drag an endless fisheye canvas of 224 projects'],\n    ['03', 'filmstrip', 'Filmstrip', 'Liquid reel', 'A WebGL reel that bends and splits with speed'],\n    ['04', 'monolith', 'Monolith', 'Louvres', 'Photographs open through rotating slats'],\n    ['05', 'studio', 'Studio', 'Trail', 'A cursor trail of work and a 3D card deck'],\n    ['06', 'nord', 'Nord', 'Orbit', 'A draggable cylinder of buildings'],"),
("const optHref = (o) => `${o[0]}-${o[1]}.html`;", "const optHref = (o) => `${o[0]}-${o[1]}-v2.html`;"),
('<img src="assets/img/o/${x[0]}.jpg"', '<img src="assets/img/o2/${x[0]}.jpg"'),
('<a href="index.html" aria-label="All options"', '<a href="index-v2.html" aria-label="All options"'),
("if (!/^(\\d\\d-[a-z]+|index)\\.html$/.test(h)) return;", "if (!/^(\\d\\d-[a-z]+-v2|index-v2)\\.html$/.test(h)) return;"),
("  /* Images: <img data-g=", """  /* v2: photographs ship pre-graded (tools/v2_images.py), so the runtime grade only maps paths */
  const G2 = (src) => String(src)
    .replace(/assets\\/img\\/p\\/([^/]+)\\.jpg/, 'assets/img/g/$1.jpg')
    .replace(/assets\\/img\\/s\\/([^/]+)\\.jpg/, 'assets/img/g/s/$1.jpg')
    .replace(/assets\\/img\\/h\\/(pillar_ep_[12])\\.jpg/, 'assets/img/g/h/$1.jpg')
    .replace(/assets\\/img\\/t\\/([^/]+)\\.jpg/, 'assets/img/g/t/$1.jpg');
  const DAY = (src) => String(src).replace(/assets\\/img\\/g\\/s\\//, 'assets/img/s/').replace(/assets\\/img\\/g\\/h\\//, 'assets/img/h/').replace(/assets\\/img\\/g\\/(?!t\\/)/, 'assets/img/p/');
  Grade.setup = function () { this.ok = false; };
  Grade.url = (src) => Promise.resolve(G2(src));

  /* ---------------- loupe: a daylight magnifier over graded photographs inside [data-loupe] ---------------- */
  function loupe(opts = {}) {
    if (matchMedia('(hover: none)').matches || reduced) return;
    const L = opts.size || 230, Z = opts.zoom || 1.7;
    const el = document.createElement('div'); el.className = 'px-loupe'; el.innerHTML = '<i></i><span>Daylight · ' + Z + '×</span>'; document.body.appendChild(el);
    const face = el.firstChild; let cur = null, mx = 0, my = 0, raf = 0; const cache = {};
    const pick = () => {
      raf = 0; if (document.documentElement.classList.contains('px-lb-on')) { el.classList.remove('on'); return; }
      const im = document.elementsFromPoint(mx, my).find((n) => n.tagName === 'IMG' && n.closest('[data-loupe]') && /assets\\/img\\/g\\//.test(n.currentSrc || n.src));
      if (!im) { el.classList.remove('on'); cur = null; return; }
      const day = DAY(im.currentSrc || im.src);
      if (!cache[day]) { cache[day] = new Image(); cache[day].src = day; }
      if (cur !== im) { cur = im; face.style.backgroundImage = `url("${day}")`; }
      const r = im.getBoundingClientRect(), iw = im.naturalWidth || r.width, ih = im.naturalHeight || r.height;
      const fit = getComputedStyle(im).objectFit; const s = fit === 'contain' ? Math.min(r.width / iw, r.height / ih) : Math.max(r.width / iw, r.height / ih);
      const dw = iw * s, dh = ih * s, dx = r.left + (r.width - dw) / 2, dy = r.top + (r.height - dh) / 2;
      face.style.backgroundSize = `${dw * Z}px ${dh * Z}px`;
      face.style.backgroundPosition = `${L / 2 - (mx - dx) * Z}px ${L / 2 - (my - dy) * Z}px`;
      el.style.transform = `translate3d(${mx - L / 2}px,${my - L / 2}px,0)`;
      el.classList.add('on');
    };
    el.style.width = el.style.height = L + 'px';
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(pick); }, { passive: true });
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(pick); }, { passive: true });
    document.addEventListener('pointerleave', () => el.classList.remove('on'));
  }

  /* ---------------- trail: photographs spill out behind the cursor inside el ---------------- */
  function trail(host, srcs, opts = {}) {
    if (matchMedia('(hover: none)').matches || reduced || !srcs.length) return;
    const layer = document.createElement('div'); layer.className = 'px-trail' + (opts.cls ? ' ' + opts.cls : ''); host.appendChild(layer);
    const N = opts.pool || 14, W = opts.w || 260, GAP = opts.gap || 90, LIFE = opts.life || 900;
    const pool = Array.from({ length: N }, () => { const f = document.createElement('figure'); f.innerHTML = '<img alt="" decoding="async">'; layer.appendChild(f); return f; });
    srcs.slice(0, 24).forEach((s) => { const i = new Image(); i.src = G2(s); });
    let k = 0, si = 0, lx = null, ly = null, z = 1;
    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (lx === null) { lx = x; ly = y; return; }
      const d = Math.hypot(x - lx, y - ly); if (d < GAP) return;
      const ang = Math.atan2(y - ly, x - lx); lx = x; ly = y;
      const f = pool[k++ % N], im = f.firstChild; im.src = G2(srcs[si++ % srcs.length]);
      const w = W * (0.8 + Math.random() * 0.45);
      f.style.width = w + 'px'; f.style.left = x - w / 2 + 'px'; f.style.top = y - w * 0.62 + 'px'; f.style.zIndex = ++z;
      f.getAnimations().forEach((a) => a.cancel());
      const rot = (Math.random() - .5) * 10, dx = Math.cos(ang) * 60, dy = Math.sin(ang) * 60;
      f.animate([
        { opacity: 1, transform: `translate(${-dx * .4}px,${-dy * .4}px) scale(.4) rotate(${rot * 2}deg)`, clipPath: 'inset(40% 40% 40% 40%)' },
        { opacity: 1, transform: 'translate(0,0) scale(1) rotate(' + rot + 'deg)', clipPath: 'inset(0% 0% 0% 0%)', offset: .25 },
        { opacity: 1, transform: `translate(${dx * .2}px,${dy * .2}px) scale(1) rotate(${rot}deg)`, clipPath: 'inset(0% 0% 0% 0%)', offset: .7 },
        { opacity: 0, transform: `translate(${dx * .3}px,${dy * .3 + 40}px) scale(.86) rotate(${rot}deg)`, clipPath: 'inset(0% 0% 100% 0%)' },
      ], { duration: LIFE + 600, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'forwards' });
    });
    host.addEventListener('pointerleave', () => { lx = ly = null; });
  }

  /* ---------------- drag: pointer-drag a value with inertia; onMove(dx, dy, velocity) ---------------- */
  function drag(el, onMove, opts = {}) {
    let down = false, lx = 0, ly = 0, vx = 0, vy = 0, moved = 0, raf = 0;
    const fr = opts.friction || 0.94;
    const glide = () => { vx *= fr; vy *= fr; if (Math.abs(vx) + Math.abs(vy) < .05) { raf = 0; onMove(0, 0, 0, true); return; } onMove(vx, vy, Math.hypot(vx, vy)); raf = requestAnimationFrame(glide); };
    el.addEventListener('pointerdown', (e) => { if (e.button) return; down = true; moved = 0; lx = e.clientX; ly = e.clientY; vx = vy = 0; cancelAnimationFrame(raf); raf = 0; el.classList.add('px-dragging'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy); vx = dx; vy = dy; onMove(dx, dy, Math.hypot(dx, dy)); });
    addEventListener('pointerup', () => { if (!down) return; down = false; el.classList.remove('px-dragging'); if (!raf) raf = requestAnimationFrame(glide); });
    el.addEventListener('click', (e) => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* Images: <img data-g="""),
("window.PX = { D, SV, SET,", "window.PX = { G2, DAY, loupe, trail, drag, D, SV, SET,"),
]
for a, b in R:
    assert src.count(a) == 1, (a[:70], src.count(a))
    src = src.replace(a, b)
src = src.replace("/* Pillar redesign — shared runtime for every option page.", "/* Pillar redesign v2 — shared runtime for the v2 option pages (generated by tools/make_core2.py from core.js).", 1)
open('assets/core2.js', 'w').write(src)
print('assets/core2.js', len(src))
