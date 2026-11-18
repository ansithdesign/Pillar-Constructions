/* Pillar redesign — shared runtime for every option page.
   PX.init({ id:'01', look:{...}, lenis:true }) sets up grading, smooth scroll, reveals and the switcher. */
(function () {
  'use strict';
  const D = window.PILLAR;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // every option opens at its top: no browser scroll restoration, no #hash jump on arrival
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  const toTop = () => { window.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); };
  window.addEventListener('pageshow', () => { toTop(); requestAnimationFrame(toTop); setTimeout(toTop, 60); setTimeout(toTop, 250); });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const OPTIONS = [
    ['01', 'anatomy', 'Anatomy', 'stillform.homes', 'Depth fly-through gallery, pinned wipes'],
    ['02', 'verdigris', 'Verdigris', 'casainterior.framer.website', 'Grid zoom, drifting unveils, verdigris rooms'],
    ['03', 'filmstrip', 'Filmstrip', 'korda.framer.media', 'Fisheye filmstrip driven by the scroll'],
    ['04', 'monolith', 'Monolith', 'architecttura.framer.website', 'Slit-open hero, parallax reel, honours'],
    ['05', 'studio', 'Studio', 'mirellstudio.framer.website', 'Scroll-weighted wordmark, pinned wipes'],
    ['06', 'nord', 'Nord', 'norda.framer.website', 'Logo mask zoom, stacking intro, marquee'],
  ];
  const optHref = (o) => `${o[0]}-${o[1]}.html`;

  /* ---------------- data helpers ---------------- */
  // the source site marks an unknown owner / builder / architect with a literal "&mdash;": treat it as empty
  D.projects.forEach((p) => ['o', 'g', 'ar'].forEach((k) => { if (p[k] === '&mdash;') p[k] = ''; }));
  const SV = {}; D.services.forEach((s) => (SV[s.id] = s));
  const byImg = {}; D.projects.forEach((p) => { if (!byImg[p.img]) byImg[p.img] = p; });
  const years = new Date().getFullYear() - 1995;
  const stats = {
    years,
    projects: D.projects.length,
    honours: D.awards.reduce((n, a) => n + a.items.length, 0),
    awardYears: D.awards.length,
    states: new Set(D.projects.map((p) => p.st).filter(Boolean)).size,
    offices: D.offices.length,
    people: D.team.length,
    partners: D.testimonials.length,
  };
  /* one shared photo set for every option, chosen for quality and minimal composition */
  const SET = ["Oakvile_Inova_1", "V17-004D", "Avocet_1", "V13-007D", "8521Rt", "V18-002R", "7655Rt", "The_Westerly_Waterfront_1", "V17-007R", "D06-014", "V16-035D", "Institute_for_Digital_Innovation_1", "8302Rt", "V12-026", "V16-047", "College_Park_City_Hall_1", "8621Rt", "EP_003", "V19-019R", "8191Rt"];
  const svcImg = (s, k = 0) => `assets/img/p/${SET[(D.services.indexOf(s) * 4 + k * 2 + 1) % SET.length]}.jpg`;
  const svcP = (s) => byImg[SET[(D.services.indexOf(s) * 4 + 1) % SET.length]];
  const loc = (p) => [p.c, p.st].filter(Boolean).join(', ');
  const img = (id, k = 'p') => `assets/img/${k}/${id}.jpg`;
  const pick = (ids) => ids.map((i) => byImg[i]).filter(Boolean);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svcShort = { drywall: 'Drywall', rainscreen: 'Rainscreen', 'eifs-stucco': 'EIFS / Stucco', restoration: 'Restoration', 'exterior-panels': 'Exterior Panels' };
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  /* ---------------- colour grading engine (worker) ----------------
     look = { ev, contrast, pivot, lift[3], gamma[3], gain[3], fade, sat, vib, blue, warm,
              sh[3], shAmt, hi[3], hiAmt, mono, grain, vig } — all optional. */
  const WORKER_SRC = `
  const cache = new Map();
  function lut(L){
    const t=new Array(3);
    const ev=Math.pow(2,L.ev||0), c=L.contrast||0, pv=L.pivot??.5, fade=L.fade||0;
    const lift=L.lift||[0,0,0], gam=L.gamma||[1,1,1], gain=L.gain||[1,1,1];
    for(let ch=0;ch<3;ch++){ const a=new Float32Array(256);
      for(let i=0;i<256;i++){ let x=Math.min(1,(i/255)*ev);
        // pivoted sigmoid contrast
        if(c){ const k=1+c*4; const s=1/(1+Math.exp(-k*(x-pv))); const s0=1/(1+Math.exp(k*pv)), s1=1/(1+Math.exp(-k*(1-pv))); x=x+(Math.min(1,Math.max(0,(s-s0)/(s1-s0)))-x)*Math.min(1,Math.abs(c)*1.4)*(c<0?-1:1); }
        x=gain[ch]*(x+lift[ch]*(1-x)); x=Math.pow(Math.max(0,x),1/gam[ch]); x=fade+x*(1-fade);
        a[i]=Math.min(1,Math.max(0,x)); }
      t[ch]=a; }
    return t;
  }
  function process(d,w,h,L){
    const T=lut(L), R=T[0],G=T[1],B=T[2];
    const sat=L.sat??1, vib=L.vib||0, blue=L.blue||0, mono=L.mono||0, warm=L.warm||0;
    const sh=L.sh||[0,0,0], hi=L.hi||[0,0,0], sa=L.shAmt||0, ha=L.hiAmt||0, gr=L.grain||0, vig=L.vig||0;
    const cx=w/2, cy=h/2, md=cx*cx+cy*cy;
    let seed=1234567;
    for(let y=0;y<h;y++){ const dy=(y-cy)*(y-cy);
      for(let x=0;x<w;x++){ const i=(y*w+x)*4;
        let r=R[d[i]], g=G[d[i+1]], b=B[d[i+2]];
        const l=.2126*r+.7152*g+.0722*b;
        const mx=Math.max(r,g,b), mn=Math.min(r,g,b), ch=mx-mn;
        let f=sat*(1+vib*(1-ch*2));
        if(blue){ const bl=Math.max(0,b-Math.max(r,g))/(b+.001); f*=1-blue*Math.min(1,bl*2.2); }
        f*=1-mono;
        r=l+(r-l)*f; g=l+(g-l)*f; b=l+(b-l)*f;
        if(warm){ r+=warm*.06*(1-l*.3); b-=warm*.06*(1-l*.3); }
        const ws=(1-l)*(1-l)*sa, wh=l*l*ha;
        r+=sh[0]*ws+hi[0]*wh; g+=sh[1]*ws+hi[1]*wh; b+=sh[2]*ws+hi[2]*wh;
        if(vig){ const v=1-vig*(((x-cx)*(x-cx)+dy)/md); r*=v; g*=v; b*=v; }
        if(gr){ seed=(seed*1103515245+12345)&0x7fffffff; const n=(seed/0x7fffffff-.5)*gr*(1-Math.abs(l-.5)); r+=n; g+=n; b+=n; }
        d[i]=r*255; d[i+1]=g*255; d[i+2]=b*255;
      }
    }
  }
  onmessage=async(e)=>{ const {id,url,look,w}=e.data;
    try{
      const res=await fetch(url); if(!res.ok) throw new Error('fetch '+res.status);
      const blob=await res.blob();
      let bmp=await createImageBitmap(blob);
      if(w && bmp.width>w){ const s=w/bmp.width; const b2=await createImageBitmap(bmp,{resizeWidth:Math.round(bmp.width*s),resizeHeight:Math.round(bmp.height*s),resizeQuality:'high'}); bmp.close(); bmp=b2; }
      const c=new OffscreenCanvas(bmp.width,bmp.height), x=c.getContext('2d',{willReadFrequently:true});
      x.drawImage(bmp,0,0); const im=x.getImageData(0,0,c.width,c.height);
      process(im.data,c.width,c.height,look); x.putImageData(im,0,0);
      const out=await c.convertToBlob({type:'image/jpeg',quality:.9});
      postMessage({id,blob:out,w:c.width,h:c.height});
    }catch(err){ postMessage({id,err:String(err)}); }
  };`;

  const Grade = {
    look: null, workers: [], q: new Map(), cache: new Map(), n: 0, ok: false, rr: 0,
    setup(look) {
      this.look = look;
      if (!look) return;
      try {
        if (!('OffscreenCanvas' in window) || !('createImageBitmap' in window) || location.protocol === 'file:') throw 0;
        const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
        const k = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
        for (let i = 0; i < k; i++) {
          const w = new Worker(url);
          w.onmessage = (e) => {
            const job = this.q.get(e.data.id); if (!job) return; this.q.delete(e.data.id);
            if (e.data.err) job.rej(e.data.err); else job.res(URL.createObjectURL(e.data.blob));
          };
          this.workers.push(w);
        }
        this.ok = true;
      } catch (e) { this.ok = false; }
      if (!this.ok && look.css) document.documentElement.style.setProperty('--px-grade-css', look.css);
    },
    looks: {},
    url(src, w = 0, name = '') {
      const look = (name && this.looks[name]) || this.look;
      if (!look || !this.ok) return Promise.resolve(src);
      const key = src + '|' + w + '|' + name;
      if (this.cache.has(key)) return this.cache.get(key);
      const p = new Promise((res, rej) => {
        const id = ++this.n; this.q.set(id, { res, rej });
        const abs = new URL(src, location.href).href;
        this.workers[this.rr++ % this.workers.length].postMessage({ id, url: abs, look, w });
      }).catch(() => src);
      this.cache.set(key, p);
      return p;
    },
  };

  /* Images: <img data-g="assets/img/p/x.jpg" data-gw="900"> are graded lazily when near the viewport. */
  let gradeIO;
  function gradeImages(root = document) {
    const list = $$('img[data-g]:not([data-gs])', root);
    if (!gradeIO) {
      gradeIO = new IntersectionObserver((ents) => ents.forEach((e) => {
        if (!e.isIntersecting) return; gradeIO.unobserve(e.target); loadGraded(e.target);
      }), { rootMargin: '120% 120%' });
    }
    list.forEach((im) => { im.dataset.gs = '1'; if (!im.alt) im.alt = ''; im.decoding = 'async'; if (im.dataset.eager != null) loadGraded(im); else gradeIO.observe(im); });
  }
  function loadGraded(im) {
    const src = im.dataset.g, w = +im.dataset.gw || 0;
    im.classList.add('px-g');
    Grade.url(src, w, im.dataset.gl || '').then((u) => {
      im.onload = () => im.classList.add('px-ready');
      im.src = u;
      if (im.complete && im.naturalWidth) im.classList.add('px-ready');
    });
  }
  // graded images fade up once processed; css fallback filter if grading is unavailable
  const gs = document.createElement('style');
  gs.textContent = 'img.px-g{opacity:0;transition:opacity .9s cubic-bezier(.2,.7,.1,1)}img.px-g.px-ready{opacity:1}img[data-g]{filter:var(--px-grade-css,none)}';
  document.head.appendChild(gs);

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  function smooth(opts = {}) {
    if (reduced || !window.Lenis) return null;
    lenis = new window.Lenis({ lerp: opts.lerp ?? 0.085, wheelMultiplier: opts.wheel ?? 1, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    return lenis;
  }
  function scrollTo(target, o = {}) {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), ...o });
    else { const el = typeof target === 'string' ? $(target) : target; if (typeof target === 'number') scrollTo({ top: target }); else el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return; e.preventDefault(); scrollTo(el, { offset: -(+a.dataset.offset || 0) });
  });

  /* ---------------- text splitting + reveals ---------------- */
  function split(el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    const mode = el.dataset.split || 'lines';
    if (mode === 'chars') {
      let i = 0;
      const walk = (node) => { Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) { const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
            const ws = document.createElement('span'); ws.className = 'px-w';
            [...w].forEach((c) => { const s = document.createElement('span'); s.className = 'px-c'; s.style.setProperty('--i', i++); s.textContent = c; ws.appendChild(s); });
            f.appendChild(ws); });
          n.replaceWith(f); } else if (n.nodeType === 1 && n.tagName !== 'IMG') walk(n); }); };
      walk(el); return;
    }
    // words → measured lines (a first-line indent is carried by the first line only)
    const tiRaw = getComputedStyle(el).textIndent;
    const ti = (parseFloat(tiRaw) || 0) * (tiRaw.endsWith('%') ? el.clientWidth / 100 : 1);
    if (ti) el.style.textIndent = '0px';
    const words = [];
    const walk = (node) => { Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(document.createTextNode(' ')); else { const s = document.createElement('span'); s.className = 'px-w'; s.textContent = w; f.appendChild(s); words.push(s); } });
        n.replaceWith(f);
      } else if (n.nodeType === 1) { if (n.tagName === 'BR') return; n.classList.add('px-w'); words.push(n); } }); };
    walk(el);
    if (ti && words[0]) words[0].style.marginLeft = ti + 'px';
    const lines = []; let top = null, cur;
    words.forEach((w) => { if (cur && /^(SUP|SUB)$/.test(w.tagName)) { cur.push(w); return; } const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; } cur.push(w); });
    el.innerHTML = '';
    lines.forEach((ln, i) => { const o = document.createElement('span'); o.className = 'px-line'; const s = document.createElement('span'); s.style.setProperty('--i', i);
      ln.forEach((w, j) => { s.appendChild(w); if (j < ln.length - 1) s.appendChild(document.createTextNode(' ')); }); o.appendChild(s); el.appendChild(o); });
  }
  let revealIO;
  function reveal(root = document) {
    if (!('IntersectionObserver' in window) || reduced) { $$('[data-r],[data-split]', root).forEach((e) => e.classList.add('px-in')); return; }
    document.documentElement.classList.add('px-anim');
    $$('[data-split]', root).forEach(split);
    // clip-path reveals are measured on their parent: IO reports a fully clipped element as never intersecting
    if (!revealIO) revealIO = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      (e.target._pxEls || [e.target]).forEach((el) => el.classList.add('px-in'));
      revealIO.unobserve(e.target);
    }), { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r],[data-split]', root).forEach((e) => {
      if (e.classList.contains('px-in') || e._pxObs) return; e._pxObs = 1;
      const t = /clip/.test(e.dataset.r || '') && e.parentElement ? e.parentElement : e;
      if (t !== e) { (t._pxEls = t._pxEls || []).push(e); } revealIO.observe(t);
    });
  }

  /* ---------------- counters ---------------- */
  function counters(root = document) {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, to = parseFloat(el.dataset.count), dur = 1800, t0 = performance.now(), dec = (el.dataset.count.split('.')[1] || '').length, p = el.dataset.pad ? +el.dataset.pad : 0;
      if (reduced) { el.textContent = to.toFixed(dec); return; }
      const tick = (t) => { const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 4)); el.textContent = p ? pad(Math.round(v), p) : v.toFixed(dec); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: 0.4 });
    $$('[data-count]:not([data-cd])', root).forEach((e) => { e.dataset.cd = '1'; io.observe(e); });
  }

  /* ---------------- parallax (no gsap needed) ---------------- */
  function parallax(sel = '[data-par]') {
    const els = $$(sel); if (!els.length || reduced) return;
    const upd = () => { const vh = innerHeight; els.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      const k = (r.top + r.height / 2 - vh / 2) / vh; el.style.transform = `translate3d(0,${(-k * (+el.dataset.par || 12)).toFixed(2)}%,0)`; }); };
    (lenis ? lenis.on('scroll', upd) : addEventListener('scroll', upd, { passive: true })); addEventListener('resize', upd); upd();
  }

  /* ---------------- cursor-following preview ---------------- */
  function hoverPreview(rows, getSrc, opts = {}) {
    if (matchMedia('(hover: none)').matches) return;
    const box = document.createElement('div'); box.className = 'px-float' + (opts.cls ? ' ' + opts.cls : ''); document.body.appendChild(box);
    let x = 0, y = 0, tx = 0, ty = 0, on = false, raf;
    const loop = () => { x += (tx - x) * 0.14; y += (ty - y) * 0.14; box.style.left = x + 'px'; box.style.top = y + 'px'; raf = on || Math.abs(tx - x) > .5 ? requestAnimationFrame(loop) : 0; };
    const show = async (src) => {
      const u = await Grade.url(src, 900); const im = new Image(); im.src = u; im.alt = '';
      box.appendChild(im); while (box.children.length > 2) box.firstChild.remove();
      if (!reduced) im.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 600, easing: 'cubic-bezier(.2,.7,.1,1)' });
    };
    rows.forEach((r) => {
      r.addEventListener('mouseenter', (e) => { on = true; tx = x = e.clientX; ty = y = e.clientY; box.classList.add('on'); show(getSrc(r)); if (!raf) raf = requestAnimationFrame(loop); });
      r.addEventListener('mousemove', (e) => { tx = e.clientX + (opts.dx || 0); ty = e.clientY + (opts.dy || 0); if (!raf) raf = requestAnimationFrame(loop); });
      r.addEventListener('mouseleave', () => { on = false; box.classList.remove('on'); });
    });
  }

  /* ---------------- circular cursor label for [data-cursor] ---------------- */
  function cursor() {
    if (matchMedia('(hover: none)').matches) return;
    const c = document.createElement('div'); c.className = 'px-cursor'; document.body.appendChild(c);
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => { x += (tx - x) * 0.2; y += (ty - y) * 0.2; c.style.translate = `${x}px ${y}px`; requestAnimationFrame(loop); }; loop();
    document.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-cursor]'); if (t) { c.textContent = t.dataset.cursor; c.classList.add('on'); } else c.classList.remove('on'); });
  }

  /* ---------------- gallery viewer ----------------
     The clicked photograph flies from its place on the page into the viewer (and back on close).
     Wheel, arrows, swipe or the thumbnail strip move through the group; click the photo to inspect it at full size. */
  const EASE_IO = 'cubic-bezier(.76,0,.24,1)', EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
  // the box that visibly frames an image: nearest ancestor that clips it (or the image itself)
  function frameOf(im, stop) {
    let n = im.parentElement;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (/hidden|clip/.test(cs.overflow + cs.overflowX) || cs.clipPath !== 'none') return n;
      if (n === stop) break; n = n.parentElement;
    }
    return im;
  }
  const visible = (r) => r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const LB = {
    el: null, list: [], i: 0, origin: null, tok: 0, anims: [], z: null,
    build() {
      const el = document.createElement('div'); el.className = 'px-lb'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Project viewer');
      el.innerHTML = `<div class="px-lb-bgd"></div>
        <div class="px-lb-top"><span class="px-lb-count"><span class="px-roll"><span>01</span></span><span>/</span><span class="px-lb-tot"></span><span class="px-lb-svc"></span></span><span class="px-lb-hint">Click photo to inspect · Scroll or ← → to browse</span><button class="px-lb-x" type="button" aria-label="Close viewer">Close ✕</button></div>
        <div class="px-lb-stage"></div>
        <div class="px-lb-bot"><div class="px-lb-info"><h3><span></span></h3><dl></dl></div><div class="px-lb-nav"><button type="button" data-d="-1" aria-label="Previous project">←</button><button type="button" data-d="1" aria-label="Next project">→</button></div></div>
        <div class="px-lb-thumbs" role="tablist" aria-label="Projects in this set"></div>
        <div class="px-lb-zoom" aria-hidden="true"><img alt=""></div>`;
      document.body.appendChild(el); this.el = el;
      this.stage = el.querySelector('.px-lb-stage'); this.th = el.querySelector('.px-lb-thumbs'); this.zl = el.querySelector('.px-lb-zoom');
      this.frame = this.mkFrame();
      el.querySelector('.px-lb-x').onclick = () => this.close();
      el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => this.go(+b.dataset.d)));
      this.th.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) this.go(+b.dataset.i - this.i); });
      addEventListener('keydown', (e) => {
        if (!el.classList.contains('open')) return;
        if (e.key === 'Escape') { e.preventDefault(); this.z ? this.unzoom() : this.close(); }
        if (e.key === 'ArrowRight') this.go(1);
        if (e.key === 'ArrowLeft') this.go(-1);
      });
      let lockT = 0, acc = 0;
      el.addEventListener('wheel', (e) => {
        e.preventDefault(); if (this.z) return;
        acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const now = performance.now(); if (now < lockT) { acc = 0; return; }
        if (Math.abs(acc) > 40) { this.go(acc > 0 ? 1 : -1); acc = 0; lockT = now + 750; }
      }, { passive: false });
      let sx = 0, sy = 0;
      el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      el.addEventListener('touchend', (e) => { if (this.z) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) this.go(dx < 0 ? 1 : -1); });
      // inspect: the photo opens at full resolution and pans with the pointer
      this.zl.addEventListener('pointermove', (e) => { if (this.z) { this.z.px = e.clientX / innerWidth; this.z.py = e.clientY / innerHeight; } });
      this.zl.addEventListener('click', () => this.unzoom());
      addEventListener('resize', () => { if (this.el.classList.contains('open') && this.ar) this.place(this.frame, this.fit(this.ar)); });
    },
    mkFrame() { const f = document.createElement('div'); f.className = 'px-lb-frame'; f.dataset.cursor = 'Inspect'; f.innerHTML = '<img alt="">'; f.onclick = (e) => this.zoom(e); this.el.insertBefore(f, this.zl); return f; },
    fit(ar) { const s = this.stage.getBoundingClientRect(); const pad = innerWidth < 700 ? 0 : 24; let w = s.width - pad * 2, h = w / ar; if (h > s.height) { h = s.height; w = h * ar; } return { x: s.left + (s.width - w) / 2, y: s.top + (s.height - h) / 2, w, h }; },
    place(f, r) { Object.assign(f.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); },
    thumbs() {
      this.th.innerHTML = this.list.length < 2 ? '' : this.list.map((p, k) => `<button type="button" data-i="${k}" aria-label="${esc(p.n)}"><img data-g="${img(p.img)}" data-gw="200" alt=""></button>`).join('');
      gradeImages(this.th);
    },
    info(d = 0) {
      const p = this.list[this.i], el = this.el;
      el.querySelector('.px-lb-tot').textContent = pad(this.list.length);
      el.querySelector('.px-lb-svc').textContent = '· ' + (SV[p.s]?.title || '');
      const roll = el.querySelector('.px-roll'), old = roll.firstElementChild, nu = document.createElement('span'); nu.textContent = pad(this.i + 1);
      const h = el.querySelector('h3'), oh = h.firstElementChild, nh = document.createElement('span'); nh.textContent = p.n;
      el.querySelector('dl').innerHTML = [['Location', [p.a, loc(p)].filter(Boolean).join(' · ')], ['Owner', p.o], ['General contractor', p.g], ['Architect', p.ar]]
        .filter((r) => r[1]).map((r) => `<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join('');
      if (!d || reduced) { roll.replaceChildren(nu); h.replaceChildren(nh); }
      else {
        [[roll, old, nu], [h, oh, nh]].forEach(([box, o, n]) => {
          box.appendChild(n); box.style.position = 'relative';
          Object.assign(o.style, { position: 'absolute', left: 0, top: 0, width: '100%' });
          o.animate([{ transform: 'none' }, { transform: `translateY(${-d * 100}%)` }], { duration: 700, easing: EASE_IO }).onfinish = () => o.remove();
          n.animate([{ transform: `translateY(${d * 100}%)` }, { transform: 'none' }], { duration: 700, easing: EASE_IO });
        });
        el.querySelector('dl').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 150, easing: EASE_OUT, fill: 'backwards' });
      }
      $$('button', this.th).forEach((b, k) => b.classList.toggle('on', k === this.i));
      const b = this.th.children[this.i]; if (b) this.th.scrollTo({ left: b.offsetLeft - this.th.clientWidth / 2 + 46, behavior: d ? 'smooth' : 'auto' });
    },
    // natural aspect for a project, read from its graded or raw file
    load(p) { return Grade.url(img(p.img)).then((u) => new Promise((res) => { const im = new Image(); im.onload = () => res({ u, ar: im.naturalWidth / im.naturalHeight, w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res({ u, ar: 1.5, w: 1500, h: 1000 }); im.src = u; })); },
    async open(list, i = 0, origin = null) {
      if (!this.el) this.build();
      this.anims.forEach((a) => a.finish()); this.anims = [];
      this.list = list; this.i = i; this.origin = origin; const tok = ++this.tok;
      this.thumbs(); this.info(0);
      document.documentElement.classList.add('px-lb-on'); lenis && lenis.stop();
      this.el.classList.add('open'); this.el.querySelector('.px-lb-x').focus({ preventScroll: true });
      const f = this.frame, fim = f.querySelector('img'); f.classList.remove('on'); fim.removeAttribute('src');
      const sim = origin && (origin.tagName === 'IMG' ? origin : origin.querySelector('img'));
      const box = sim && frameOf(sim, origin), from = box && box.getBoundingClientRect();
      const quick = sim && sim.naturalWidth && visible(from) && !reduced;
      const src = quick ? (sim.currentSrc || sim.src) : null;
      const full = this.load(list[i]);
      const ar = quick ? sim.naturalWidth / sim.naturalHeight : (await full).ar;
      if (tok !== this.tok) return;
      this.ar = ar; const to = this.fit(ar); this.place(f, to);
      if (quick) {
        const fly = document.createElement('div'); fly.className = 'px-lb-fly'; fly.innerHTML = `<img src="${src}" alt="">`; this.el.insertBefore(fly, this.zl);
        const rad = getComputedStyle(box).borderRadius;
        sim.style.visibility = 'hidden'; this.hidden = sim;
        const a = fly.animate([{ left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: rad },
          { left: to.x + 'px', top: to.y + 'px', width: to.w + 'px', height: to.h + 'px', borderRadius: '0px' }], { duration: 1000, easing: EASE_IO, fill: 'forwards' });
        fim.src = src; this.anims.push(a);
        a.onfinish = () => { f.classList.add('on'); requestAnimationFrame(() => fly.remove()); };
      } else {
        f.classList.add('on');
        this.anims.push(f.animate([{ opacity: 0, transform: 'scale(.94)', clipPath: 'inset(8% 8% 8% 8%)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0% 0% 0% 0%)' }], { duration: 1000, easing: EASE_OUT, delay: 120, fill: 'backwards' }));
      }
      full.then((r) => { if (tok === this.tok && this.list[this.i] === list[i]) { this.full = r; const pre = new Image(); pre.onload = () => { if (tok === this.tok) fim.src = r.u; }; pre.src = r.u; } });
      this.preload(i);
    },
    preload(i) { [1, -1].forEach((d) => { const p = this.list[(i + d + this.list.length) % this.list.length]; if (p) Grade.url(img(p.img)); }); },
    async go(d) {
      if (!this.el || this.list.length < 2 || !d) return;
      if (this.z) this.unzoom(true);
      this.anims.forEach((a) => a.finish()); this.anims = [];
      const tok = ++this.tok; const dir = Math.sign(d);
      this.i = (this.i + d + this.list.length) % this.list.length; this.info(dir);
      const p = this.list[this.i], r = await this.load(p);
      if (tok !== this.tok) return;
      this.full = r; this.ar = r.ar;
      const out = this.frame, nf = this.mkFrame(), to = this.fit(r.ar);
      nf.querySelector('img').src = r.u; this.place(nf, to); nf.classList.add('on'); this.frame = nf;
      if (reduced) { out.remove(); return; }
      const a1 = out.animate([{ clipPath: 'inset(0% 0% 0% 0%)', transform: 'none' }, { clipPath: dir > 0 ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)', transform: `translateX(${-dir * 6}%)` }], { duration: 1050, easing: EASE_IO, fill: 'forwards' });
      const a2 = nf.animate([{ clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], { duration: 1050, easing: EASE_IO });
      const a3 = nf.querySelector('img').animate([{ transform: `scale(1.3) translateX(${dir * 8}%)` }, { transform: 'none' }], { duration: 1400, easing: EASE_OUT });
      a1.onfinish = () => out.remove(); this.anims.push(a1, a2, a3);
      this.preload(this.i);
    },
    zoom(e) {
      if (this.z || !this.full) return;
      const r = this.frame.getBoundingClientRect(), k = Math.max(1.6, Math.min(3, this.full.w / r.width));
      const zi = this.zl.querySelector('img'); zi.src = this.frame.querySelector('img').src;
      this.z = { x: r.left, y: r.top, w: r.width, h: r.height, tw: r.width * k, th: r.height * k, px: e.clientX / innerWidth, py: e.clientY / innerHeight, out: false, r };
      this.zl.classList.add('on'); this.el.classList.add('zoomed'); this.frame.style.visibility = 'hidden';
      const loop = () => {
        const z = this.z; if (!z) return;
        const W = innerWidth, H = innerHeight, tw = z.out ? z.r.width : z.tw, th = z.out ? z.r.height : z.th;
        const tx = z.out ? z.r.left : (tw > W ? -(tw - W) * z.px : (W - tw) / 2), ty = z.out ? z.r.top : (th > H ? -(th - H) * z.py : (H - th) / 2);
        const k = reduced ? 1 : 0.14; z.x += (tx - z.x) * k; z.y += (ty - z.y) * k; z.w += (tw - z.w) * k; z.h += (th - z.h) * k;
        zi.style.width = z.w + 'px'; zi.style.height = z.h + 'px'; zi.style.transform = `translate3d(${z.x}px,${z.y}px,0)`;
        if (z.out && Math.abs(z.w - tw) < 1 && Math.abs(z.x - tx) < 1) { this.zl.classList.remove('on'); this.frame.style.visibility = ''; this.z = null; return; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    unzoom(now) { if (!this.z) return; this.el.classList.remove('zoomed'); if (now) { this.zl.classList.remove('on'); this.frame.style.visibility = ''; this.z = null; } else { this.z.r = this.frame.getBoundingClientRect(); this.z.out = true; } },
    close() {
      if (!this.el || !this.el.classList.contains('open')) return;
      this.unzoom(true); this.anims.forEach((a) => a.finish()); this.anims = []; this.tok++;
      if (this.hidden) { this.hidden.style.visibility = ''; this.hidden = null; }
      const p = this.list[this.i], f = this.frame;
      // fly back to wherever this project sits on the page, if it is in view
      let back = null;
      const cands = [this.origin, ...$$(`[data-lb="${p.id}"]`)].filter((x) => x && x.dataset && +x.dataset.lb === p.id && !this.el.contains(x));
      for (const c of cands) { const im = c.tagName === 'IMG' ? c : c.querySelector('img'); if (!im || !im.naturalWidth) continue; const b = frameOf(im, c), r = b.getBoundingClientRect(); if (visible(r)) { back = { im, b, r }; break; } }
      lenis && lenis.start();
      this.el.classList.remove('open'); document.documentElement.classList.remove('px-lb-on');
      if (back && !reduced) {
        const fr = f.getBoundingClientRect(), fly = document.createElement('div'); fly.className = 'px-lb-fly'; fly.style.zIndex = 950;
        fly.innerHTML = `<img src="${back.im.currentSrc || back.im.src}" alt="">`; document.body.appendChild(fly);
        back.im.style.visibility = 'hidden'; f.classList.remove('on');
        fly.animate([{ left: fr.left + 'px', top: fr.top + 'px', width: fr.width + 'px', height: fr.height + 'px', borderRadius: '0px' },
          { left: back.r.left + 'px', top: back.r.top + 'px', width: back.r.width + 'px', height: back.r.height + 'px', borderRadius: getComputedStyle(back.b).borderRadius }], { duration: 850, easing: EASE_IO, fill: 'forwards' })
          .onfinish = () => { back.im.style.visibility = ''; fly.remove(); };
      } else f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).onfinish = () => f.classList.remove('on');
      this.origin = null;
    },
  };

  /* ---------------- scroll motion primitives ----------------
     data-m on a frame (an element that clips an <img>), space separated:
       unveil   frame wipes open (data-dir up|down|left|right|center) while the photo settles from 1.4x
       drift    photo travels inside its frame against the scroll (data-amt, % of height)
       zoomout  photo eases from 1.3x to rest as the frame reaches the middle of the screen
       expand   frame grows from an inset, rounded window to full size as it enters
       shrink   frame closes to an inset, rounded card as it leaves the top (heroes)
       color    frame moves from greyscale to full colour as it crosses the screen
       chars    text splits into letters that rise in with the scroll
     data-skew="k" leans an element with scroll velocity (data-skew-axis="x" for horizontal reels). */
  const hasG = () => !!(window.gsap && window.ScrollTrigger);
  const skewEls = new Set(); let velo = 0, skewOn = false, skewLast = false;
  function skewLoop() {
    const v = lenis ? lenis.velocity || 0 : 0; velo += (v - velo) * 0.1;
    const s = Math.max(-8, Math.min(8, velo * 0.22));
    if (Math.abs(s) < 0.005 && !skewLast) return; skewLast = Math.abs(s) >= 0.005;
    skewEls.forEach((el) => { if (!el.isConnected) { skewEls.delete(el); return; } const k = +el.dataset.skew || 1; gsap.set(el, el.dataset.skewAxis === 'x' ? { skewX: -s * k } : { skewY: s * k * 0.5 }); });
  }
  function splitChars(el) {
    if (el.dataset.chd) return $$('.px-ch>span', el); el.dataset.chd = 1;
    const out = [];
    const walk = (node) => Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); [...n.textContent].forEach((c) => { if (c === ' ') { f.appendChild(document.createTextNode(' ')); return; } const w = document.createElement('span'); w.className = 'px-ch'; const s = document.createElement('span'); s.textContent = c; w.appendChild(s); f.appendChild(w); out.push(s); }); n.replaceWith(f); }
      else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el); return out;
  }
  const INSET = { up: 'inset(100% 0% 0% 0%)', down: 'inset(0% 0% 100% 0%)', left: 'inset(0% 0% 0% 100%)', right: 'inset(0% 100% 0% 0%)', center: 'inset(50% 50% 50% 50%)', mid: 'inset(14% 20% 14% 20%)' };
  function motion(root = document) {
    const list = $$('[data-m]:not([data-md]),[data-skew]:not([data-md])', root);
    if (!list.length) return;
    if (reduced || !hasG()) { list.forEach((e) => (e.dataset.md = 1)); return; }
    gsap.registerPlugin(ScrollTrigger);
    list.forEach((el) => {
      el.dataset.md = 1;
      if (el.dataset.skew != null) { skewEls.add(el); if (!skewOn) { skewOn = true; gsap.ticker.add(skewLoop); } }
      const k = (el.dataset.m || '').split(/\s+/), has = (x) => k.includes(x);
      const im = el.tagName === 'IMG' ? el : el.querySelector(':scope > img, :scope > * > img');
      const amt = +el.dataset.amt || 8, rest = has('drift') ? 1 + amt * 2.3 / 100 : 1, del = +el.dataset.delay || 0;
      if (has('drift') && im) {
        gsap.set(im, { scale: rest, transformOrigin: '50% 50%' });
        gsap.fromTo(im, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
      if (has('unveil')) {
        const tl = gsap.timeline({ paused: true, delay: del });
        gsap.set(el, { clipPath: INSET[el.dataset.dir || 'up'] });
        tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' }, 0);
        if (im && !has('zoomout')) tl.fromTo(im, { scale: rest * 1.4 }, { scale: rest, duration: 2.1, ease: 'expo.out' }, 0.2);
        const play = () => tl.play();
        ScrollTrigger.create({ trigger: el, start: 'top 90%', end: 'bottom top', onEnter: play, onEnterBack: play, onLeave: play });
      }
      if (has('zoomout') && im) gsap.fromTo(im, { scale: rest * 1.32 }, { scale: rest, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 55%', scrub: true } });
      if (has('expand')) {
        const r = el.dataset.r || 28, end = el.dataset.end || 'top 15%';
        gsap.fromTo(el, { clipPath: `inset(10% 14% 10% 14% round ${r}px)` }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end, scrub: true } });
        if (im && !has('zoomout')) gsap.fromTo(im, { scale: rest * 1.25 }, { scale: rest, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end, scrub: true } });
      }
      if (has('shrink')) {
        const r = el.dataset.r || 28;
        gsap.fromTo(el, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: `inset(7% 5% 7% 5% round ${r}px)`, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
      }
      if (has('color')) gsap.fromTo(el, { filter: 'grayscale(1) brightness(.82)' }, { filter: 'grayscale(0) brightness(1)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'center 52%', scrub: true } });
      if (has('chars')) {
        const cs = splitChars(el);
        gsap.fromTo(cs, { yPercent: 115 }, { yPercent: 0, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: el, start: el.dataset.start || 'top 98%', end: el.dataset.end || 'bottom 82%', scrub: 0.6 } });
      }
    });
  }

  /* stacked photos in one frame: each new one wipes in over the last (direction follows the order) */
  function swapper(box) {
    let cur = 0, z = 50;
    const L = () => $$(':scope > img', box);
    L().forEach((x, j) => (x.style.zIndex = j ? 1 : z));
    return (i) => {
      const ims = L(), el = ims[i]; if (!el || i === cur) return;
      const dir = i > cur ? 1 : -1; cur = i; el.style.zIndex = ++z;
      if (reduced) return;
      el.animate([{ clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', transform: 'scale(1.22)' }, { clipPath: 'inset(0% 0% 0% 0%)', transform: 'scale(1)' }], { duration: 1300, easing: EASE_IO });
    };
  }
  /* photos inside cards of a pinned horizontal reel drift against the travel */
  function hdrift(ims, ca, amt = 12) {
    if (reduced || !hasG()) return;
    ims.forEach((im) => {
      gsap.set(im, { scale: 1 + amt * 2.3 / 100 });
      gsap.fromTo(im, { xPercent: -amt }, { xPercent: amt, ease: 'none', scrollTrigger: { trigger: im.parentElement, containerAnimation: ca, start: 'left right', end: 'right left', scrub: true } });
    });
  }

  /* ---------------- page curtain between options ---------------- */
  let cv = null;
  function curtain(on) {
    cv = document.createElement('div'); cv.className = 'px-cv'; cv.setAttribute('aria-hidden', 'true'); cv.innerHTML = '<span><b></b></span>';
    document.body.appendChild(cv);
    if (on && !reduced) { cv.classList.add('cover'); requestAnimationFrame(() => requestAnimationFrame(() => cv.classList.add('lift'))); }
    addEventListener('pageshow', (e) => { if (e.persisted) cv.className = 'px-cv'; });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
      const h = a.getAttribute('href'); if (!/^(\d\d-[a-z]+|index)\.html$/.test(h)) return;
      e.preventDefault(); leave(h);
    });
  }
  function leave(h) {
    if (!cv || reduced) { location.href = h; return; }
    const o = OPTIONS.find((x) => optHref(x) === h);
    cv.querySelector('b').textContent = o ? `${o[0]} — ${o[2]}` : 'All directions';
    cv.className = 'px-cv'; void cv.offsetWidth; cv.classList.add('in');
    setTimeout(() => (location.href = h), 820);
  }

  /* ---------------- scroll progress on the switcher ---------------- */
  function progress() {
    const bar = $('.px-sw-prog'); if (!bar) return;
    const upd = () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(1, scrollY / m) : 0})`; };
    lenis ? lenis.on('scroll', upd) : addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------------- option switcher ---------------- */
  function switcher(cur) {
    const i = OPTIONS.findIndex((o) => o[0] === cur);
    const prev = OPTIONS[(i - 1 + OPTIONS.length) % OPTIONS.length], next = OPTIONS[(i + 1) % OPTIONS.length], o = OPTIONS[i];
    const sw = document.createElement('nav'); sw.className = 'px-sw'; sw.setAttribute('aria-label', 'Design options');
    sw.innerHTML = `<div class="px-sw-panel" id="px-sw-panel">${OPTIONS.map((x) => `<a href="${optHref(x)}" class="${x[0] === cur ? 'on' : ''}"><figure><img src="assets/img/o/${x[0]}.jpg" alt="" loading="lazy" onerror="this.remove()"></figure><strong><span>${x[0]} ${x[2]}</span></strong><small>${x[4]}<br>ref · ${x[3]}</small></a>`).join('')}</div>
      <div class="px-sw-bar"><a href="index.html" aria-label="All options" title="All options">▦</a>
      <div class="px-sw-nums">${OPTIONS.map((x) => `<a href="${optHref(x)}" class="px-sw-n${x[0] === cur ? ' on' : ''}" data-name="${x[2]}" aria-label="Option ${x[0]} ${x[2]}"${x[0] === cur ? ' aria-current="page"' : ''}><b>${x[0]}</b>${x[0] === cur ? `<span>${x[2]}</span>` : ''}</a>`).join('')}</div>
      <button class="px-sw-cur" aria-expanded="false" aria-controls="px-sw-panel" aria-label="Preview all options" title="Preview all options">⌃</button><i class="px-sw-prog"></i></div>`;
    document.body.appendChild(sw);
    const btn = sw.querySelector('.px-sw-cur');
    btn.onclick = () => { const on = sw.classList.toggle('open'); btn.setAttribute('aria-expanded', on); };
    document.addEventListener('click', (e) => { if (!sw.contains(e.target)) { sw.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
    addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      if ($('.px-lb.open')) return;
      if (e.key === ']') leave(optHref(next));
      if (e.key === '[') leave(optHref(prev));
    });
  }

  /* ---------------- magnetic hover: [data-mag] (strength in px) ---------------- */
  function magnetic(root = document) {
    if (matchMedia('(hover: none)').matches || reduced) return;
    $$('[data-mag]:not([data-magd])', root).forEach((el) => {
      el.dataset.magd = 1; const k = +el.dataset.mag || 14; el.style.transition = 'transform .5s cubic-bezier(.2,.7,.1,1)';
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height; el.style.transform = `translate(${dx * k}px,${dy * k}px)`; });
      el.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
  }
  /* ---------------- tilt: [data-tilt] cards lean toward the cursor ---------------- */
  function tilt(root = document) {
    if (matchMedia('(hover: none)').matches || reduced) return;
    $$('[data-tilt]:not([data-tiltd])', root).forEach((el) => {
      el.dataset.tiltd = 1; const k = +el.dataset.tilt || 6; el.style.transition = 'transform .6s cubic-bezier(.2,.7,.1,1)'; el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${x * k}deg) rotateX(${-y * k}deg)`; });
      el.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
  }

  /* ---------------- misc ---------------- */
  function clock(el, tz = 'America/New_York', o = { hour: '2-digit', minute: '2-digit' }) {
    const f = new Intl.DateTimeFormat('en-US', { ...o, timeZone: tz });
    const t = () => (el.textContent = f.format(new Date())); t(); setInterval(t, 15000);
  }
  function form(f, msg) {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      msg.textContent = `Thanks — this preview doesn't send messages. Please email ${D.company.email} or call ${D.company.phone}.`;
      msg.hidden = false;
    });
  }
  function copy(btn, text) {
    btn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(text); btn.dataset.done = '1'; const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = o), 1600); } catch (e) { const r = document.createRange(); r.selectNodeContents(btn); getSelection().removeAllRanges(); getSelection().addRange(r); } });
  }
  /* project index filter: renders into list with chips */
  function filterable(chipsEl, onChange) {
    const chips = [['all', 'All', D.projects.length], ...D.services.map((s) => [s.id, svcShort[s.id], D.projects.filter((p) => p.s === s.id).length])];
    chipsEl.innerHTML = chips.map((c, i) => `<button type="button" data-f="${c[0]}" aria-pressed="${i === 0}">${c[1]}<sup>${c[2]}</sup></button>`).join('');
    chipsEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', chipsEl).forEach((x) => x.setAttribute('aria-pressed', x === b)); onChange(b.dataset.f); });
    onChange('all');
  }
  const logo = (cls = '') => `<svg class="${cls}" viewBox="0 0 64 56" aria-hidden="true" fill="currentColor"><path d="M32 0 64 56H0Z" opacity=".22"/><path d="M14.9 26h34.2l4.6 8H10.3Z"/><path d="M8 38h48l4.6 8H3.4Z"/><path d="M21.7 14h20.6l4.6 8H17.1Z" opacity=".6"/></svg>`;

  function init(cfg = {}) {
    Grade.setup(cfg.look); Grade.looks = cfg.looks || {};
    if (cfg.lenis !== false) smooth(cfg.lenisOpts);
    toTop(); requestAnimationFrame(toTop); window.addEventListener('load', toTop, { once: true });
    gradeImages();
    let fontsOk = false, t;
    const go = () => { fontsOk = true; reveal(); counters(); motion(); hasG() && ScrollTrigger.refresh(); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(go));
    // content rendered later (filters, sliders) is graded and revealed automatically
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { gradeImages(); magnetic(); tilt(); if (fontsOk) { reveal(); counters(); motion(); } }, 30); })
      .observe(document.body, { childList: true, subtree: true });
    magnetic(); tilt();
    if (cfg.cursor) cursor();
    if (cfg.id) switcher(cfg.id);
    curtain(cfg.curtain !== false); progress();
    // any [data-lb="<projectId>"] opens the viewer; siblings inside [data-lb-group] become the sequence
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-lb]'); if (!el || e.defaultPrevented) return;
      e.preventDefault();
      const g = el.closest('[data-lb-group]');
      const ids = g ? [...new Set($$('[data-lb]', g).map((x) => +x.dataset.lb))] : [+el.dataset.lb];
      const list = ids.map((k) => D.projects[k]);
      LB.open(list, Math.max(0, ids.indexOf(+el.dataset.lb)), el);
    });
  }

  window.PX = { D, SV, SET, svcImg, svcP, stats, loc, img, pick, byImg, esc, svcShort, pad, OPTIONS, optHref, init, Grade, gradeImages, reveal, motion, splitChars, leave, frameOf, swapper, hdrift, split, counters, parallax, hoverPreview, cursor, magnetic, tilt, LB, clock, form, copy, filterable, logo, scrollTo, get lenis() { return lenis; }, reduced, $, $$ };
})();
