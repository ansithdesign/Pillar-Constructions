/* Pillar redesign — shared runtime for every option page.
   PX.init({ id:'01', look:{...}, lenis:true }) sets up grading, smooth scroll, reveals and the switcher. */
(function () {
  'use strict';
  const D = window.PILLAR;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const OPTIONS = [
    ['01', 'escape', 'Escape', 'discoverybuildersllc.com', 'Serif calm, scroll-lit story, floating gallery'],
    ['02', 'anatomy', 'Anatomy', 'stillform.homes', 'Exploded wall-panel anatomy, photo cloud'],
    ['03', 'oxblood', 'Oxblood', 'casainterior.framer.website', 'Dark rooms, rounded cards, giant wordmark'],
    ['04', 'filmstrip', 'Filmstrip', 'korda.framer.media', 'Focus filmstrip, accordion services'],
    ['05', 'grid', 'Grid', 'solum.framer.website', 'Swiss column grid, split service panels'],
    ['06', 'monolith', 'Monolith', 'architecttura.framer.website', 'Name bar, expanding hero, stacked honours'],
    ['07', 'atelier', 'Atelier', 'formaatelier.framer.website', 'Images set inside type, warm counters'],
    ['08', 'index', 'Index', 'knoll.framer.website', 'Numbered index, list-first catalogue'],
    ['09', 'warmth', 'Warmth', 'luneo.framer.website', 'Staggered gallery, timeless warmth'],
    ['10', 'studio', 'Studio', 'mirellstudio.framer.website', 'Split wordmark, project slider with specs'],
    ['11', 'nord', 'Nord', 'norda.framer.website', 'Stacked preloader, awards table, partners'],
    ['12', 'shadow', 'Shadow', 'oynx-atelier.framer.ai', 'Shadow and stone, horizontal monographs'],
  ];
  const optHref = (o) => `${o[0]}-${o[1]}.html`;

  /* ---------------- data helpers ---------------- */
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
    url(src, w = 0) {
      if (!this.look || !this.ok) return Promise.resolve(src);
      const key = src + '|' + w;
      if (this.cache.has(key)) return this.cache.get(key);
      const p = new Promise((res, rej) => {
        const id = ++this.n; this.q.set(id, { res, rej });
        const abs = new URL(src, location.href).href;
        this.workers[this.rr++ % this.workers.length].postMessage({ id, url: abs, look: this.look, w });
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
    Grade.url(src, w).then((u) => {
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
    // words → measured lines
    const words = [];
    const walk = (node) => { Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(document.createTextNode(' ')); else { const s = document.createElement('span'); s.className = 'px-w'; s.textContent = w; f.appendChild(s); words.push(s); } });
        n.replaceWith(f);
      } else if (n.nodeType === 1) { if (n.tagName === 'BR') return; n.classList.add('px-w'); words.push(n); } }); };
    walk(el);
    const lines = []; let top = null, cur;
    words.forEach((w) => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; } cur.push(w); });
    el.innerHTML = '';
    lines.forEach((ln, i) => { const o = document.createElement('span'); o.className = 'px-line'; const s = document.createElement('span'); s.style.setProperty('--i', i);
      ln.forEach((w, j) => { s.appendChild(w); if (j < ln.length - 1) s.appendChild(document.createTextNode(' ')); }); o.appendChild(s); el.appendChild(o); });
  }
  let revealIO;
  function reveal(root = document) {
    if (!('IntersectionObserver' in window) || reduced) { $$('[data-r],[data-split]', root).forEach((e) => e.classList.add('in')); return; }
    document.documentElement.classList.add('px-anim');
    $$('[data-split]', root).forEach(split);
    // clip-path reveals are measured on their parent: IO reports a fully clipped element as never intersecting
    if (!revealIO) revealIO = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      (e.target._pxEls || [e.target]).forEach((el) => el.classList.add('in'));
      revealIO.unobserve(e.target);
    }), { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r],[data-split]', root).forEach((e) => {
      if (e.classList.contains('in') || e._pxObs) return; e._pxObs = 1;
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

  /* ---------------- lightbox ---------------- */
  const LB = {
    el: null, list: [], i: 0,
    build() {
      const el = document.createElement('div'); el.className = 'px-lb'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Project viewer');
      el.innerHTML = `<div class="px-lb-top"><span class="px-lb-count"></span><span class="px-lb-svc"></span><button class="px-lb-x" aria-label="Close">✕</button></div>
        <div class="px-lb-stage"><img alt=""></div>
        <div class="px-lb-bot"><div><h3></h3><dl></dl></div><div class="px-lb-nav"><button data-d="-1" aria-label="Previous project">←</button><button data-d="1" aria-label="Next project">→</button></div></div>`;
      document.body.appendChild(el); this.el = el;
      el.querySelector('.px-lb-x').onclick = () => this.close();
      el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => this.go(+b.dataset.d)));
      addEventListener('keydown', (e) => { if (!el.classList.contains('open')) return; if (e.key === 'Escape') this.close(); if (e.key === 'ArrowRight') this.go(1); if (e.key === 'ArrowLeft') this.go(-1); });
      let sx = 0; el.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
      el.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) this.go(d < 0 ? 1 : -1); });
    },
    open(list, i = 0) { if (!this.el) this.build(); this.list = list; this.i = i; this.render(); this.el.classList.add('open'); lenis && lenis.stop(); this.el.querySelector('.px-lb-x').focus({ preventScroll: true }); },
    close() { this.el.classList.remove('open'); lenis && lenis.start(); },
    go(d) { this.i = (this.i + d + this.list.length) % this.list.length; this.render(); },
    async render() {
      const p = this.list[this.i], el = this.el, im = el.querySelector('.px-lb-stage img');
      el.querySelector('.px-lb-count').textContent = `${pad(this.i + 1)} / ${pad(this.list.length)}`;
      el.querySelector('.px-lb-svc').textContent = SV[p.s]?.title || '';
      el.querySelector('h3').textContent = p.n;
      el.querySelector('dl').innerHTML = [['Location', [p.a, loc(p)].filter(Boolean).join(' · ')], ['Owner', p.o], ['General contractor', p.g], ['Architect', p.ar]]
        .filter((r) => r[1]).map((r) => `<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join('');
      im.classList.add('swap');
      const u = await Grade.url(img(p.img));
      if (this.list[this.i] !== p) return;
      im.onload = () => im.classList.remove('swap'); im.src = u; im.alt = p.n;
    },
  };

  /* ---------------- option switcher ---------------- */
  function switcher(cur) {
    const i = OPTIONS.findIndex((o) => o[0] === cur);
    const prev = OPTIONS[(i - 1 + OPTIONS.length) % OPTIONS.length], next = OPTIONS[(i + 1) % OPTIONS.length], o = OPTIONS[i];
    const sw = document.createElement('nav'); sw.className = 'px-sw'; sw.setAttribute('aria-label', 'Design options');
    sw.innerHTML = `<div class="px-sw-panel" id="px-sw-panel">${OPTIONS.map((x) => `<a href="${optHref(x)}" class="${x[0] === cur ? 'on' : ''}"><figure><img src="assets/img/o/${x[0]}.jpg" alt="" loading="lazy" onerror="this.remove()"></figure><strong><span>${x[0]} ${x[2]}</span></strong><small>${x[4]}<br>ref · ${x[3]}</small></a>`).join('')}</div>
      <div class="px-sw-bar"><a href="index.html" aria-label="All options" title="All options">▦</a><a href="${optHref(prev)}" aria-label="Previous option: ${prev[2]}">←</a>
      <button class="px-sw-cur" aria-expanded="false" aria-controls="px-sw-panel"><b>${o[0]}</b>${o[2]}<span>/ 12</span></button>
      <div class="px-sw-dots">${OPTIONS.map((x) => `<a href="${optHref(x)}" class="${x[0] === cur ? 'on' : ''}" aria-label="Option ${x[0]} ${x[2]}"></a>`).join('')}</div>
      <a href="${optHref(next)}" aria-label="Next option: ${next[2]}">→</a></div>`;
    document.body.appendChild(sw);
    const btn = sw.querySelector('.px-sw-cur');
    btn.onclick = () => { const on = sw.classList.toggle('open'); btn.setAttribute('aria-expanded', on); };
    document.addEventListener('click', (e) => { if (!sw.contains(e.target)) { sw.classList.remove('open'); btn.setAttribute('aria-expanded', false); } });
    addEventListener('keydown', (e) => {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === ']') location.href = optHref(next);
      if (e.key === '[') location.href = optHref(prev);
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
    Grade.setup(cfg.look);
    if (cfg.lenis !== false) smooth(cfg.lenisOpts);
    gradeImages();
    let fontsOk = false, t;
    const go = () => { fontsOk = true; reveal(); counters(); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(go));
    // content rendered later (filters, sliders) is graded and revealed automatically
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { gradeImages(); magnetic(); tilt(); if (fontsOk) { reveal(); counters(); } }, 30); })
      .observe(document.body, { childList: true, subtree: true });
    magnetic(); tilt();
    if (cfg.cursor) cursor();
    if (cfg.id) switcher(cfg.id);
    // any [data-lb="<projectId>"] opens the viewer; siblings inside [data-lb-group] become the sequence
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-lb]'); if (!el || e.defaultPrevented) return;
      e.preventDefault();
      const g = el.closest('[data-lb-group]');
      const ids = g ? [...new Set($$('[data-lb]', g).map((x) => +x.dataset.lb))] : [+el.dataset.lb];
      const list = ids.map((k) => D.projects[k]);
      LB.open(list, Math.max(0, ids.indexOf(+el.dataset.lb)));
    });
  }

  window.PX = { D, SV, stats, loc, img, pick, byImg, esc, svcShort, pad, OPTIONS, optHref, init, Grade, gradeImages, reveal, split, counters, parallax, hoverPreview, cursor, magnetic, tilt, LB, clock, form, copy, filterable, logo, scrollTo, get lenis() { return lenis; }, reduced, $, $$ };
})();
