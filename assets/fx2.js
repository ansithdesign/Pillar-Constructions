/* Pillar v2 effects: image-led 3D sections. Each fx(host, opts) builds its own markup inside host.
   Needs PX (core2.js), K (kit2.js), gsap + ScrollTrigger. */
(function () {
  const { $, $$, esc, pad, loc, D } = PX;
  const G = K.G, DAYP = (id) => `assets/img/p/${id}.jpg`;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const loop = (fn, el) => { let vis = true; if (el) new IntersectionObserver(([e]) => (vis = e.isIntersecting), { rootMargin: '300px' }).observe(el); (function f(t) { requestAnimationFrame(f); if (vis) fn(t); })(performance.now()); };
  const head = (o, cls = '') => `<div class="fx-head ${cls}"><p class="k-eyebrow">${o.eyebrow || ''}</p><h2 class="fx-h">${o.title || ''}</h2>${o.sub ? `<p class="fx-sub">${o.sub}</p>` : ''}</div>`;
  const ptr = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('pointermove', (e) => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
  const velo = () => (PX.lenis ? PX.lenis.velocity || 0 : 0);
  const aspects = {};
  const aspect = (id, cb) => { if (aspects[id]) return cb(aspects[id]); const im = new Image(); im.onload = () => { aspects[id] = im.naturalWidth / im.naturalHeight; cb(aspects[id]); }; im.src = G(id); };
  const cover = (W, H, a) => (W / H > a ? [W, W / a] : [H * a, H]);

  /* ---------- helix: projects wound on a spiral; scroll descends it ---------- */
  function helix(host, o) {
    const it = o.items, N = it.length, PER = o.per || 7, R = o.r || 560, DY = o.dy || 120;
    host.classList.add('fx-helix');
    host.innerHTML = head(o, 'fx-over') + `<div class="hx-stage"><div class="hx" data-lb-group>${it.map((p, i) => `<a class="hx-c" href="#" data-lb="${p.id}" data-cursor="Open" style="transform:translateY(${i * DY}px) rotateY(${i * 360 / PER}deg) translateZ(${R}px)"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy" draggable="false"><b>${esc(p.n)}</b></a>`).join('')}</div></div>
      <div class="fx-hud"><span><b class="hx-n">01</b> / ${pad(N)}</span><b class="hx-t"></b></div>`;
    const hx = $('.hx', host), cs = $$('.hx-c', host); let p = 0, cp = 0, tx = 0, last = -1;
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=' + (N * 28) + '%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    loop(() => {
      cp += (p - cp) * .08; tx += (((ptr.y / innerHeight) - .5) * -10 - tx) * .05;
      const f = cp * (N - 1), ang = f * 360 / PER;
      hx.style.transform = `rotateX(${tx}deg) translateY(${-f * DY}px) rotateY(${-ang}deg)`;
      cs.forEach((c, i) => { const a = (i * 360 / PER - ang) * Math.PI / 180, cz = Math.cos(a), dy = Math.abs(i - f); c.style.opacity = clamp(1.4 - dy * .18, 0, 1).toFixed(3); c.style.filter = `brightness(${(.35 + .65 * Math.max(0, cz)).toFixed(3)})`; c.style.pointerEvents = cz > .5 && dy < 3 ? 'auto' : 'none'; });
      const k = clamp(Math.round(f), 0, N - 1); if (k !== last) { last = k; $('.hx-n', host).textContent = pad(k + 1); $('.hx-t', host).textContent = `${it[k].n} · ${it[k].c}`; }
    }, host);
  }

  /* ---------- sphere: a globe of projects, drag to spin ---------- */
  function sphere(host, o) {
    const it = o.items, N = it.length, R = o.r || 430;
    host.classList.add('fx-sphere');
    host.innerHTML = head(o, 'fx-over') + `<div class="sp-stage"><div class="sp" data-lb-group>${it.map((p, i) => { const y = 1 - (i + .5) / N * 2, lat = Math.asin(y) * 180 / Math.PI, lon = (i * 137.508) % 360; return `<a class="sp-c" href="#" data-lb="${p.id}" data-cursor="Open" data-n="${esc(p.n)} · ${esc(p.c)}" style="transform:rotateY(${lon}deg) rotateX(${lat}deg) translateZ(${R}px)"><span class="in"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy" draggable="false"></span></a>`; }).join('')}</div></div>
      <div class="fx-hud"><span>Drag to spin the globe</span><b class="sp-t">${N} projects</b></div>`;
    const sp = $('.sp', host); let ax = -12, ay = 0, vx = 0, vy = .15;
    PX.drag(host, (dx, dy) => { vy = dx * .25; vx = -dy * .2; });
    host.addEventListener('pointerover', (e) => { const c = e.target.closest('.sp-c'); if (c) $('.sp-t', host).textContent = c.dataset.n; });
    loop(() => { ay += vy + velo() * .05; ax = clamp(ax + vx, -60, 60); vy += (.15 - vy) * .02; vx *= .92; sp.style.transform = `rotateX(${ax}deg) rotateY(${ay}deg)`; }, host);
  }

  /* ---------- drum: a rolodex of trades, scroll turns it ---------- */
  function drum(host, o) {
    const sv = o.services, F = sv.length * 2, STEP = 360 / F, H = Math.round(innerHeight * .42), R = Math.round(H / 2 / Math.tan(Math.PI / F));
    host.classList.add('fx-drum');
    host.innerHTML = `<div class="dr-l">${head(o)}<div class="dr-info"></div></div><div class="dr-stage"><div class="dr" style="height:${H}px">${Array.from({ length: F }, (_, i) => { const s = sv[i % sv.length]; return `<div class="dr-f" style="height:${H}px;transform:rotateX(${-i * STEP}deg) translateZ(${R}px)"><img src="${G(s.img)}" alt="" loading="lazy"><b>${esc(s.name)}</b><span>${pad(i % sv.length + 1)}</span></div>`; }).join('')}</div></div>`;
    const dr = $('.dr', host), info = $('.dr-info', host); let p = 0, cp = 0, ty = 0, last = -1;
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=360%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    loop(() => {
      cp += (p - cp) * .08; ty += (((ptr.x / innerWidth) - .5) * 16 - ty) * .05;
      const a = cp * (sv.length - 1) * STEP; dr.style.transform = `translateZ(${-R}px) rotateY(${ty}deg) rotateX(${a}deg)`;
      const k = Math.round(a / STEP) % sv.length;
      if (k !== last) { last = k; const s = sv[k]; info.innerHTML = `<p class="dr-n">${pad(k + 1)} / ${pad(sv.length)} · ${s.count} projects</p><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><ul>${s.scopes.slice(0, 8).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`; gsap.fromTo(info.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .7, ease: 'expo.out' }); }
    }, host);
  }

  /* ---------- zoom: each photograph holds the next one inside it ---------- */
  function zoom(host, o) {
    const it = o.items, Kn = it.length, Z = 3.4;
    host.classList.add('fx-zoom');
    host.innerHTML = `<div class="zm" data-lb-group>${it.map((p, i) => `<a class="zm-l" href="#" data-lb="${p.id}" data-cursor="Open" style="z-index:${i + 1}"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy"></a>`).join('')}</div>${head(o, 'fx-over')}<div class="fx-hud"><span><b class="zm-n">01</b> / ${pad(Kn)}</span><b class="zm-t"></b></div>`;
    const ls = $$('.zm-l', host); let p = 0, cp = 0, last = -1;
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=' + Kn * 90 + '%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    loop(() => {
      cp += (p - cp) * .09; const q = cp * (Kn - 1);
      ls.forEach((l, i) => { const s = Math.pow(Z, q - i); l.style.transform = `scale(${s})`; l.style.opacity = s > Z * 1.1 ? 0 : 1; l.style.visibility = s < .02 ? 'hidden' : 'visible'; l.style.setProperty('--b', clamp((1 - s) * 3, 0, 1)); l.style.pointerEvents = Math.abs(q - i) < .5 ? 'auto' : 'none'; });
      const k = clamp(Math.round(q), 0, Kn - 1); if (k !== last) { last = k; $('.zm-n', host).textContent = pad(k + 1); $('.zm-t', host).textContent = `${it[k].n} · ${loc(it[k])}`; }
    }, host);
  }

  /* ---------- tower: the trades as floors of a building, exploding apart ---------- */
  function tower(host, o) {
    const sv = o.services, N = sv.length, W = o.w || 360, H = 44;
    host.classList.add('fx-tower');
    host.innerHTML = `<div class="tw-stage"><div class="tw">${sv.map((s, i) => `<div class="fl" data-i="${i}" data-cursor="${esc(s.name)}" style="width:${W}px;height:${W}px;left:${-W / 2}px;top:${-W / 2}px"><div class="tp" style="background-image:url('${G(s.img)}');transform:translateZ(${H}px)"></div><div class="fr" style="height:${H}px"><span>${esc(s.name)}</span></div><div class="rt" style="width:${H}px"></div></div>`).join('')}</div></div>
      <div class="tw-r">${head(o)}<div class="tw-info"></div></div>`;
    const fls = $$('.fl', host), info = $('.tw-info', host); let p = 0, cp = 0, act = 0, hov = -1, last = -1;
    fls.forEach((f, i) => { f.addEventListener('pointerenter', () => (hov = i)); f.addEventListener('pointerleave', () => (hov = -1)); });
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=300%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    const lifts = fls.map(() => 0);
    loop(() => {
      cp += (p - cp) * .08; const gap = 8 + Math.min(1, cp * 2.2) * 120, rz = -45 + cp * 70 + (ptr.x / innerWidth - .5) * 10;
      act = hov >= 0 ? hov : clamp(Math.floor(Math.max(0, cp - .2) / .8 * N), 0, N - 1);
      $('.tw', host).style.transform = `rotateX(${58 + (ptr.y / innerHeight - .5) * 8}deg) rotateZ(${rz}deg) translateZ(${-N * (H + gap) / 2}px)`;
      fls.forEach((f, i) => { lifts[i] += ((i === act ? 1 : 0) - lifts[i]) * .1; f.style.transform = `translateZ(${i * (H + gap) + lifts[i] * 60}px) translate(${lifts[i] * 24}px,${lifts[i] * 24}px)`; f.classList.toggle('on', i === act); });
      if (act !== last) { last = act; const s = sv[act]; info.innerHTML = `<p class="dr-n">Floor ${pad(act + 1)} · ${s.count} projects</p><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><ul>${s.scopes.slice(0, 7).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`; gsap.fromTo(info.children, { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: .05, duration: .7, ease: 'expo.out' }); }
    }, host);
  }

  /* ---------- wave: a kinetic facade of photographs that ripples under the cursor ---------- */
  function wave(host, o) {
    const it = o.items, C = o.cols || 12, Rw = o.rows || 7, TW = 150, TH = 108, GP = 10;
    host.classList.add('fx-wave');
    const cells = Array.from({ length: C * Rw }, (_, i) => it[i % it.length]);
    host.innerHTML = head(o, 'fx-over') + `<div class="wv-stage"><div class="wv" data-lb-group style="width:${C * (TW + GP)}px;height:${Rw * (TH + GP)}px">${cells.map((p, i) => `<a class="wv-t" href="#" data-lb="${p.id}" data-cursor="Open" style="left:${(i % C) * (TW + GP)}px;top:${Math.floor(i / C) * (TH + GP)}px;width:${TW}px;height:${TH}px"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy" draggable="false"></a>`).join('')}</div></div><div class="fx-hud"><span>Move across the facade</span><b class="wv-n"></b></div>`;
    const wv = $('.wv', host), ts = $$('.wv-t', host).map((el, i) => ({ el, x: (i % C) * (TW + GP) + TW / 2, y: Math.floor(i / C) * (TH + GP) + TH / 2, z: 0 }));
    let sp = 0; ScrollTrigger.create({ trigger: host, start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: (s) => (sp = s.progress) });
    host.addEventListener('pointerover', (e) => { const t = e.target.closest('.wv-t'); if (t) $('.wv-n', host).textContent = t.querySelector('img').alt; });
    loop((t) => {
      const r = host.getBoundingClientRect(), W = C * (TW + GP), H = Rw * (TH + GP);
      const tilt = 46 - sp * 26; wv.style.transform = `translate(-50%,-50%) rotateX(${tilt}deg) rotateZ(${(ptr.x / innerWidth - .5) * -6}deg)`;
      const mx = (ptr.x - (r.left + r.width / 2)) / .92 + W / 2, my = ((ptr.y - (r.top + r.height / 2)) / Math.cos(tilt * Math.PI / 180)) + H / 2, inside = ptr.y > r.top && ptr.y < r.bottom;
      ts.forEach((c) => { const d2 = (c.x - mx) ** 2 + (c.y - my) ** 2, push = inside ? 170 * Math.exp(-d2 / (2 * 190 * 190)) : 0, w = 26 * Math.sin(t / 700 + c.x / 160 + c.y / 240 + sp * 12); c.z += (push + w - c.z) * .12; c.el.style.transform = `translateZ(${c.z.toFixed(1)}px) rotateX(${(-(c.y - my) / 40 * push / 170).toFixed(2)}deg)`; c.el.style.filter = `brightness(${(.6 + c.z / 280).toFixed(3)})`; });
    }, host);
  }

  /* ---------- shatter: photographs break into a cloud of tiles and rebuild as the next ---------- */
  function shatter(host, o) {
    const it = o.items, Kn = it.length, C = 12, Rr = 7;
    host.classList.add('fx-shatter');
    host.innerHTML = `<div class="sh-stage"><div class="sh">${Array.from({ length: C * Rr }, () => '<i></i>').join('')}</div></div>${head(o, 'fx-over')}<div class="fx-hud"><span><b class="sh-n">01</b> / ${pad(Kn)}</span><b class="sh-t"></b></div>`;
    const sh = $('.sh', host), tiles = $$('.sh i', host).map((el, i) => ({ el, c: i % C, r: Math.floor(i / C), rx: (Math.random() - .5) * 720, ry: (Math.random() - .5) * 720, dx: (Math.random() - .5) * 900, dy: (Math.random() - .5) * 700, dz: 300 + Math.random() * 900 }));
    let p = 0, cp = 0, shown = -1;
    const paint = (k) => { const p0 = it[k], box = sh.getBoundingClientRect(); aspect(p0.img, (a) => { const [bw, bh] = cover(box.width, box.height, a), tw = box.width / C, th = box.height / Rr; tiles.forEach((t) => { t.el.style.backgroundImage = `url("${G(p0.img)}")`; t.el.style.backgroundSize = `${bw}px ${bh}px`; t.el.style.backgroundPosition = `${-t.c * tw - (bw - box.width) / 2}px ${-t.r * th - (bh - box.height) / 2}px`; }); }); $('.sh-n', host).textContent = pad(k + 1); $('.sh-t', host).textContent = `${p0.n} · ${loc(p0)}`; sh.dataset.id = p0.id; };
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=' + Kn * 100 + '%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    sh.addEventListener('click', () => { const a = document.createElement('a'); a.dataset.lb = sh.dataset.id; a.hidden = true; sh.appendChild(a); a.click(); a.remove(); });
    sh.dataset.cursor = 'Open';
    loop(() => {
      cp += (p - cp) * .1; const q = cp * (Kn - 1), i = Math.min(Kn - 1, Math.floor(q)), t = q - i, k = t < .5 ? i : Math.min(Kn - 1, i + 1);
      if (k !== shown) { shown = k; paint(k); }
      const a0 = Kn === 1 || q >= Kn - 1 ? 0 : (t < .5 ? t * 2 : (1 - t) * 2), a = a0 * a0 * (3 - 2 * a0);
      const b = sh.getBoundingClientRect(), mx = ptr.x - b.left, my = ptr.y - b.top, tw = b.width / C, th = b.height / Rr;
      tiles.forEach((tl) => { const d2 = ((tl.c + .5) * tw - mx) ** 2 + ((tl.r + .5) * th - my) ** 2, push = 120 * Math.exp(-d2 / (2 * 110 * 110)); tl.el.style.transform = `translate3d(${tl.dx * a}px,${tl.dy * a}px,${tl.dz * a + push}px) rotateX(${tl.rx * a}deg) rotateY(${tl.ry * a}deg)`; tl.el.style.opacity = 1 - a * .25; });
    }, host);
    addEventListener('resize', () => paint(Math.max(0, shown)));
  }

  /* ---------- plane: an endless table of projects seen in perspective, drag to fly over it ---------- */
  function plane(host, o) {
    const PR = D.projects.filter((p) => p.img), COLS = 16, CW = 300, CH = 380, ROWS = Math.ceil(PR.length / COLS), TW = COLS * CW, TH = ROWS * CH;
    host.classList.add('fx-plane');
    host.innerHTML = `<div class="pl-stage"><div class="pl" data-lb-group>${PR.map((p) => `<a class="pl-t" href="#" data-lb="${p.id}" data-s="${p.s}" data-cursor="Open"><span class="in"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy" draggable="false"></span><b>${esc(p.n)}</b></a>`).join('')}</div></div>` + (o.overlay || '');
    const pl = $('.pl', host), ts = $$('.pl-t', host).map((el, i) => ({ el, bx: (i % COLS) * CW + (Math.floor(i / COLS) % 2 ? CW / 2 : 0), by: Math.floor(i / COLS) * CH }));
    let ox = 0, oy = 0, rx = 54, rz = -8; const mod = (a, n) => ((a % n) + n) % n;
    PX.drag(host, (dx, dy) => { ox += dx * 1.1; oy += dy * 1.7; }, { friction: .95 });
    loop(() => {
      oy += .35; rx += ((54 + (ptr.y / innerHeight - .5) * 8) - rx) * .05; rz += ((-8 + (ptr.x / innerWidth - .5) * 10) - rz) * .05;
      pl.style.transform = `translate(-50%,-50%) rotateX(${rx}deg) rotateZ(${rz}deg)`;
      ts.forEach((t) => { const x = mod(t.bx + ox, TW) - TW / 2, y = mod(t.by + oy, TH) - TH / 2; t.el.style.transform = `translate3d(${x}px,${y}px,0)`; t.el.style.opacity = clamp(1.6 - Math.abs(y) / (TH * .32), 0, 1).toFixed(3); });
    }, host);
    return { filter(f) { ts.forEach((t) => t.el.classList.toggle('off', !(f === 'all' || t.el.dataset.s === f))); return ts.filter((t) => !t.el.classList.contains('off')).length; } };
  }

  /* ---------- prism: a facade of three-sided fins turning between buildings ---------- */
  function prism(host, o) {
    const it = o.items, N = o.n || 14, GAPX = 2; let cur = 0, busy = false, ang = 0;
    host.classList.add('fx-prism');
    host.innerHTML = `<div class="pr-row">${Array.from({ length: N }, () => '<div class="pr-w"><div class="pr"><i></i><i></i><i></i></div></div>').join('')}</div>` + (o.overlay || '');
    const prs = $$('.pr', host), faces = prs.map((p) => $$('i', p)), row = $('.pr-row', host);
    const off = prs.map(() => 0);
    const geo = () => { const b = row.getBoundingClientRect(), w = (b.width - GAPX * (N - 1)) / N, r = w / (2 * Math.tan(Math.PI / 3)); faces.forEach((fs) => fs.forEach((f, j) => (f.style.transform = `rotateY(${j * 120}deg) translateZ(${r}px)`))); return { b, w }; };
    const setFace = (j, k) => { const p = it[(k % it.length + it.length) % it.length]; aspect(p.img, (a) => { const { b, w } = geo(), [bw, bh] = cover(b.width, b.height, a); faces.forEach((fs, i) => { const f = fs[j]; f.style.backgroundImage = `url("${G(p.img)}")`; f.style.backgroundSize = `${bw}px ${bh}px`; f.style.backgroundPosition = `${-i * (w + GAPX) - (bw - b.width) / 2}px ${-(bh - b.height) / 2}px`; }); }); };
    const front = () => ((Math.round(-ang / 120) % 3) + 3) % 3;
    const caption = () => { const p = it[cur % it.length]; o.onChange && o.onChange(p, cur % it.length); };
    setFace(0, 0); setFace(1, 1); setFace(2, -1); caption();
    function turn(dir = 1, from = 0) { if (busy) return; busy = true; const f = front(), nf = ((f + dir) % 3 + 3) % 3; setFace(nf, cur + dir); ang -= 120 * dir;
      gsap.to(prs, { rotateY: ang, duration: 1.3, ease: 'expo.inOut', stagger: { each: .05, from }, onComplete() { cur += dir; busy = false; caption(); o.onTurn && o.onTurn(); } }); }
    row.addEventListener('pointermove', (e) => { if (busy) return; const b = row.getBoundingClientRect(), x = (e.clientX - b.left) / b.width; prs.forEach((p, i) => { const d = Math.abs((i + .5) / N - x); gsap.to(p, { rotateY: ang - Math.max(0, 1 - d * 5) * 46, duration: .8, ease: 'power3.out', overwrite: 'auto' }); }); });
    row.addEventListener('pointerleave', () => { if (!busy) gsap.to(prs, { rotateY: ang, duration: 1, ease: 'power3.out', overwrite: 'auto' }); });
    row.addEventListener('click', (e) => { const b = row.getBoundingClientRect(); turn(1, Math.floor((e.clientX - b.left) / b.width * N)); });
    addEventListener('resize', () => { setFace(0, cur + (0 - front())); });
    loop(() => { row.style.transform = `rotateX(${(ptr.y / innerHeight - .5) * -6}deg)`; }, host);
    return { turn, get index() { return cur; } };
  }

  /* ---------- slabs: a field of standing monoliths, the camera walks among them ---------- */
  function slabs(host, o) {
    const it = o.items, N = it.length;
    host.classList.add('fx-slabs');
    const pos = it.map((_, i) => { const c = i % 4, r = Math.floor(i / 4); return { x: (c - 1.5) * 420 + (r % 2 ? 140 : -60), z: -r * 760, ry: ((i * 53) % 30) - 15 }; });
    host.innerHTML = head(o, 'fx-over') + `<div class="sl-stage"><div class="sl-cam"><div class="sl-floor"></div>${it.map((p, i) => `<a class="sb" href="#" data-lb="${p.id}" data-cursor="Open" data-n="${esc(p.n)} · ${esc(p.c)}" style="transform:translate3d(${pos[i].x}px,0,${pos[i].z}px) rotateY(${pos[i].ry}deg)"><span class="f"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy" draggable="false"></span><span class="bk"></span><span class="sd l"></span><span class="sd r"></span><span class="tp"></span></a>`).join('')}</div></div><div class="fx-hud"><span>Move to walk around · click a slab</span><b class="sl-t"></b></div>`;
    $('.sl-cam', host).setAttribute('data-lb-group', '');
    host.addEventListener('pointerover', (e) => { const s = e.target.closest('.sb'); if (s) $('.sl-t', host).textContent = s.dataset.n; });
    let p = 0, cp = 0, ry = 0;
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=220%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    loop(() => { cp += (p - cp) * .07; ry += ((ptr.x / innerWidth - .5) * 40 - ry) * .05; $('.sl-cam', host).style.transform = `translateZ(${-400 + cp * 1900}px) rotateX(-6deg) rotateY(${ry}deg)`; }, host);
  }

  /* ---------- book: a portfolio whose pages turn with scroll or drag ---------- */
  function book(host, o) {
    const it = o.items, N = it.length;
    host.classList.add('fx-book');
    const sheet = (p, n) => p ? `<div class="bk-txt"><span class="k-eyebrow">Plate ${pad(n)}</span><h3>${esc(p.n)}</h3><dl><div><dt>Location</dt><dd>${esc(loc(p))}</dd></div><div><dt>Scope</dt><dd>${K.SVC[p.s]}</dd></div>${p.g ? `<div><dt>Builder</dt><dd>${esc(p.g)}</dd></div>` : ''}${p.ar ? `<div><dt>Architect</dt><dd>${esc(p.ar)}</dd></div>` : ''}</dl></div>` : `<div class="bk-txt end"><h3>${esc(o.end || 'Fin.')}</h3></div>`;
    host.innerHTML = `<div class="bk-l">${head(o)}</div><div class="bk-stage"><div class="bk"><div class="bk-left">${sheet(null, 0).replace('Fin.', esc(o.cover || 'Selected works'))}</div>${it.map((p, i) => `<div class="pg" style="z-index:${N - i}"><a class="pg-f" href="#" data-lb="${p.id}" data-cursor="Open"><img src="${G(p.img)}" alt="${esc(p.n)}" loading="lazy" draggable="false"><span class="pg-no">${pad(i + 1)}</span></a><div class="pg-b">${sheet(it[i + 1], i + 2)}</div></div>`).join('')}</div></div>`;
    $('.bk', host).setAttribute('data-lb-group', '');
    const pgs = $$('.pg', host); let p = 0, cp = 0, drag = 0;
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=' + N * 70 + '%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    PX.drag($('.bk-stage', host), (dx) => { drag = clamp(drag - dx / 420, -N, N); });
    loop(() => { cp += (clamp(p * N + drag, 0, N) - cp) * .09; pgs.forEach((pg, i) => { const t = clamp(cp - i, 0, 1), e = t * t * (3 - 2 * t); pg.style.transform = `rotateY(${-e * 180}deg)`; pg.style.zIndex = t > .5 ? 100 + i : N - i; pg.style.setProperty('--sh', Math.sin(e * Math.PI).toFixed(3)); }); $('.bk', host).style.transform = `rotateX(${14 + (ptr.y / innerHeight - .5) * -8}deg) rotateY(${(ptr.x / innerWidth - .5) * 10}deg)`; }, host);
  }

  /* ---------- coverflow: cards flow past in depth, drag or scroll ---------- */
  function coverflow(host, o) {
    const it = o.items, N = it.length;
    host.classList.add('fx-cover');
    host.innerHTML = head(o, 'fx-over') + `<div class="cf-stage"><div class="cf" data-lb-group>${it.map((c) => `<a class="cf-c" href="#" data-lb="${c.p.id}" data-cursor="Open"><img src="${G(c.p.img)}" alt="${esc(c.p.n)}" loading="lazy" draggable="false"><b>${esc(c.p.n)}</b></a>`).join('')}</div></div><div class="cf-info"></div>`;
    const cs = $$('.cf-c', host), info = $('.cf-info', host); let p = 0, cp = 0, drag = 0, last = '';
    ScrollTrigger.create({ trigger: host, start: 'top top', end: '+=' + N * 30 + '%', pin: true, scrub: true, onUpdate: (s) => (p = s.progress) });
    PX.drag(host, (dx) => { drag = clamp(drag - dx / 260, -N, N); });
    loop(() => {
      cp += (clamp(p * (N - 1) + drag, 0, N - 1) - cp) * .1;
      cs.forEach((c, i) => { const d = i - cp, ad = Math.abs(d); c.style.transform = `translateX(${d * 230 + Math.sign(d) * Math.min(ad, 1) * 140}px) translateZ(${-ad * 260}px) rotateY(${-Math.sign(d) * Math.min(ad, 1) * 58}deg)`; c.style.zIndex = 100 - Math.round(ad * 10); c.style.filter = `brightness(${(1 - Math.min(ad, 3) * .2).toFixed(2)})`; });
      const k = clamp(Math.round(cp), 0, N - 1), c = it[k];
      if (c.group !== last) { last = c.group; info.innerHTML = `<p class="dr-n">${esc(c.tag)}</p><h3>${esc(c.group)}</h3><p>${esc(c.text)}</p>`; gsap.fromTo(info.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .7, ease: 'expo.out' }); }
    }, host);
  }

  /* ---------- table: a light table of prints you can pick up and throw ---------- */
  function table(host, o) {
    const it = o.items;
    host.classList.add('fx-table');
    host.innerHTML = head(o, 'fx-over') + `<div class="tb" data-lb-group>${it.map((p) => `<figure class="tc" data-id="${p.id}" data-cursor="Throw"><img src="${G(p.img)}" alt="${esc(p.n)}" draggable="false"><figcaption>${esc(p.n)}</figcaption></figure>`).join('')}</div><div class="tb-ctl"><button type="button" data-a="scatter">Scatter</button><button type="button" data-a="tidy">Tidy into a grid</button><button type="button" data-a="stack">Stack</button><span>Drag and throw a print · click to open</span></div>`;
    const tb = $('.tb', host), cards = $$('.tc', host).map((el) => ({ el, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, w: 230, h: 172 }));
    let z = 10, grab = null, gx = 0, gy = 0, moved = 0, lt = 0;
    const scatter = () => { const b = tb.getBoundingClientRect(); cards.forEach((c) => { c.x = 80 + Math.random() * (b.width - 380); c.y = 120 + Math.random() * (b.height - 360); c.r = (Math.random() - .5) * 40; c.vx = (Math.random() - .5) * 30; c.vy = (Math.random() - .5) * 30; c.vr = (Math.random() - .5) * 8; }); };
    const arrange = (mode) => { const b = tb.getBoundingClientRect(), cols = 6; cards.forEach((c, i) => { const tx = mode === 'stack' ? b.width / 2 - 115 + (i - cards.length / 2) * 3 : 60 + (i % cols) * ((b.width - 120) / cols), ty = mode === 'stack' ? b.height / 2 - 86 + (i - cards.length / 2) * 2 : 140 + Math.floor(i / cols) * 200, tr = mode === 'stack' ? (i % 2 ? 4 : -4) : 0; c.vx = c.vy = c.vr = 0; gsap.to(c, { x: tx, y: ty, r: tr, duration: 1.1, delay: i * .02, ease: 'expo.inOut' }); }); };
    scatter();
    cards.forEach((c) => {
      c.el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); gsap.killTweensOf(c); grab = c; moved = 0; gx = e.clientX - c.x; gy = e.clientY - c.y; c.el.style.zIndex = ++z; c.el.classList.add('up'); c.el.setPointerCapture(e.pointerId); lt = performance.now(); });
      c.el.addEventListener('pointermove', (e) => { if (grab !== c) return; const nx = e.clientX - gx, ny = e.clientY - gy, now = performance.now(), dt = Math.max(8, now - lt); c.vx = (nx - c.x) / dt * 16; c.vy = (ny - c.y) / dt * 16; c.vr = c.vx * .15; moved += Math.abs(nx - c.x) + Math.abs(ny - c.y); c.x = nx; c.y = ny; lt = now; });
      c.el.addEventListener('pointerup', () => { if (grab !== c) return; grab = null; c.el.classList.remove('up'); if (moved < 6) { const a = document.createElement('a'); a.dataset.lb = c.el.dataset.id; a.hidden = true; tb.appendChild(a); a.click(); a.remove(); } });
    });
    $('.tb-ctl', host).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'scatter') scatter(); else arrange(b.dataset.a); });
    loop(() => { const b = tb.getBoundingClientRect(); cards.forEach((c) => { if (grab !== c) { c.x += c.vx; c.y += c.vy; c.r += c.vr; c.vx *= .94; c.vy *= .94; c.vr *= .92; if (c.x < 0 || c.x > b.width - c.w) { c.vx *= -.6; c.x = clamp(c.x, 0, b.width - c.w); } if (c.y < 0 || c.y > b.height - c.h) { c.vy *= -.6; c.y = clamp(c.y, 0, b.height - c.h); } } c.el.style.transform = `translate3d(${c.x}px,${c.y}px,0) rotate(${c.r}deg)`; }); }, host);
  }

  /* ---------- trail3d: photographs fly out of the screen behind the cursor ---------- */
  function trail3d(host, o) {
    const srcs = o.items.map((p) => G(p.img)); srcs.forEach((s) => { const i = new Image(); i.src = s; });
    const layer = document.createElement('div'); layer.className = 't3-layer'; host.appendChild(layer);
    const N = 18, pool = Array.from({ length: N }, () => { const f = document.createElement('figure'); f.innerHTML = '<img alt="" decoding="async">'; layer.appendChild(f); return f; });
    let k = 0, si = 0, lx = null, ly = null;
    const spawn = (x, y, ang) => { const f = pool[k++ % N], r = layer.getBoundingClientRect(); f.firstChild.src = srcs[si++ % srcs.length]; f.style.left = x - r.left - 120 + 'px'; f.style.top = y - r.top - 150 + 'px'; f.getAnimations().forEach((a) => a.cancel()); const ry = (Math.random() - .5) * 70, rz = (Math.random() - .5) * 24, dx = Math.cos(ang) * 160, dy = Math.sin(ang) * 160;
      f.animate([{ transform: `translate3d(0,0,-700px) rotateY(${ry}deg) rotateZ(${rz}deg)`, opacity: 0 }, { transform: `translate3d(${dx * .3}px,${dy * .3}px,-200px) rotateY(${ry * .5}deg) rotateZ(${rz}deg)`, opacity: 1, offset: .3 }, { transform: `translate3d(${dx}px,${dy}px,420px) rotateY(${-ry * .3}deg) rotateZ(${rz * 1.5}deg)`, opacity: 0 }], { duration: 1900, easing: 'cubic-bezier(.3,.6,.2,1)', fill: 'forwards' }); };
    host.addEventListener('pointermove', (e) => { if (lx === null) { lx = e.clientX; ly = e.clientY; return; } const d = Math.hypot(e.clientX - lx, e.clientY - ly); if (d < 70) return; const ang = Math.atan2(e.clientY - ly, e.clientX - lx); lx = e.clientX; ly = e.clientY; spawn(lx, ly, ang); });
    host.addEventListener('pointerleave', () => (lx = ly = null));
    if (fine) setTimeout(() => { let t0 = null; const r0 = host.getBoundingClientRect(); const demo = (t) => { if (t0 === null) t0 = t; const q = (t - t0) / 2400; if (q > 1) return; host.dispatchEvent(new PointerEvent('pointermove', { clientX: r0.left + r0.width * (.15 + .7 * q), clientY: r0.top + r0.height * (.4 + .16 * Math.sin(q * Math.PI * 3)), bubbles: true })); requestAnimationFrame(demo); }; requestAnimationFrame(demo); }, 700);
    if (o.word) { const w = o.word; w.innerHTML = w.textContent.split('').map((c) => `<span>${c}</span>`).join(''); const ls = $$('span', w).map((el) => ({ el, x: 0, y: 0, wt: 800 }));
      loop(() => { ls.forEach((l) => { const r = l.el.getBoundingClientRect(), cx = r.left + r.width / 2 - l.x, cy = r.top + r.height / 2 - l.y, dx = cx - ptr.x, dy = cy - ptr.y, d = Math.hypot(dx, dy), f = Math.max(0, 1 - d / 520); l.x += (dx / (d || 1) * f * 140 - l.x) * .12; l.y += (dy / (d || 1) * f * 90 - l.y) * .12; l.wt += ((800 - f * 600) - l.wt) * .12; l.el.style.transform = `translate(${l.x}px,${l.y}px) skewX(${-l.x * .06}deg)`; l.el.style.fontWeight = Math.round(l.wt); }); }, host); }
  }

  /* ---------- kinetype: the trades as giant words filled with their photographs ---------- */
  function kinetype(host, o) {
    const sv = o.services;
    host.classList.add('fx-kine');
    host.innerHTML = head(o) + sv.map((s, i) => `<div class="kt" data-i="${i}" data-cursor="${s.count} projects"><div class="kt-bg"><img src="${G(s.img)}" alt="" loading="lazy"></div><b class="kt-w" style="background-image:url('${G(s.img)}')">${esc(s.name)}</b><div class="kt-d"><span>${pad(i + 1)} · ${s.count} projects</span><p>${esc(s.short)}</p></div></div>`).join('');
    const rows = $$('.kt', host);
    rows.forEach((r) => { const bg = $('.kt-bg', r);
      r.addEventListener('pointerenter', (e) => { const b = r.getBoundingClientRect(); r.classList.add('on'); gsap.fromTo(bg, { clipPath: `circle(0px at ${e.clientX - b.left}px ${e.clientY - b.top}px)` }, { clipPath: `circle(${b.width}px at ${e.clientX - b.left}px ${e.clientY - b.top}px)`, duration: 1.1, ease: 'expo.out' }); });
      r.addEventListener('pointerleave', (e) => { const b = r.getBoundingClientRect(); r.classList.remove('on'); gsap.to(bg, { clipPath: `circle(0px at ${e.clientX - b.left}px ${e.clientY - b.top}px)`, duration: .6, ease: 'power3.in' }); }); });
    loop(() => { const v = clamp(velo() * .5, -14, 14); rows.forEach((r, i) => { const w = $('.kt-w', r), b = r.getBoundingClientRect(); w.style.transform = `skewX(${-v}deg) translateX(${(i % 2 ? 1 : -1) * (b.top / innerHeight - .5) * 160}px)`; w.style.backgroundPosition = `${(ptr.x / innerWidth) * 100}% ${(ptr.y / innerHeight) * 100}%`; }); }, host);
  }

  /* ---------- compare: night grade against the photograph as shot ---------- */
  function compare(host, o) {
    const it = o.items; let k = 0, x = .5;
    host.classList.add('fx-compare');
    host.innerHTML = `<div class="cp-l">${head(o)}<div class="cp-th">${it.map((p, i) => `<button type="button" data-i="${i}" style="background-image:url('${G(p.img)}')" aria-label="${esc(p.n)}"></button>`).join('')}</div><p class="cp-t"></p></div><div class="cp-stage" data-cursor="Drag"><img class="cp-day" alt=""><div class="cp-night"><img alt=""></div><div class="cp-bar"><i></i></div><span class="cp-a">Night grade</span><span class="cp-b">As shot</span></div>`;
    const st = $('.cp-stage', host), day = $('.cp-day', host), night = $('.cp-night img', host);
    const show = (i) => { k = i; const p = it[i]; day.src = DAYP(p.img); night.src = G(p.img); $('.cp-t', host).textContent = `${p.n} · ${loc(p)}`; $$('.cp-th button', host).forEach((b, j) => b.classList.toggle('on', j === i)); };
    const set = (v) => { x = clamp(v, 0, 1); st.style.setProperty('--x', x * 100 + '%'); };
    show(0); set(.5);
    PX.drag(st, () => {});
    st.addEventListener('pointermove', (e) => { const b = st.getBoundingClientRect(); if (e.buttons || fine) set((e.clientX - b.left) / b.width); });
    $('.cp-th', host).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { show(+b.dataset.i); gsap.fromTo({ v: 0 }, { v: 0 }, { v: 1, duration: 1.2, ease: 'expo.inOut', onUpdate() { set(this.targets()[0].v); } }); } });
    ScrollTrigger.create({ trigger: host, start: 'top 60%', once: true, onEnter: () => gsap.fromTo({ v: 1 }, { v: 1 }, { v: .5, duration: 1.6, ease: 'expo.inOut', onUpdate() { set(this.targets()[0].v); } }) });
  }

  window.FX = { helix, sphere, drum, zoom, tower, wave, shatter, plane, prism, slabs, book, coverflow, table, trail3d, kinetype, compare };
})();
