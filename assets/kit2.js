/* Pillar v2 kit: shared sections (nav, project index, contact) styled by each page's --k-* tokens. */
(function () {
  const { D, $, $$, esc, pad, loc } = PX;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const FIX = { 'The Silva Appartments': 'The Silva Apartments', 'Elizabeth Hosue': 'Elizabeth House', 'Kindom Fellowship Church': 'Kingdom Fellowship Church', 'Bishop Oconnell High School': "Bishop O'Connell High School", 'Oakvile Inova': 'Oakville Inova', 'Baltmore': 'Baltimore', 'Craftmanship Award': 'Craftsmanship Award', 'Senior Project Manage': 'Senior Project Manager' };
  const fx = (s) => FIX[s] || s;
  D.projects.forEach((p) => { p.n = fx(p.n); p.c = fx(p.c); });
  D.team.forEach((t) => (t.r = fx(t.r)));
  const G = (id) => `assets/img/g/${id}.jpg`;
  const SVC = { drywall: 'Drywall', rainscreen: 'Rainscreen', 'eifs-stucco': 'EIFS & Stucco', restoration: 'Restoration', 'exterior-panels': 'Exterior Panels' };
  const BEST = ['6565Rt', '8621Rt', 'V17-004D', 'The_Westerly_Waterfront_1', 'V12-026', 'V19-019R', 'College_Park_City_Hall_1', 'V18-002R', 'Oakvile_Inova_1', 'V17-007R', '8521Rt', 'Avocet_1', 'V16-035D', 'V16-018D', 'V17-014D', 'V18-014R', 'V17-030R', 'V16-047', 'V16-038', 'V16-046D', 'V16-051D', 'V15-003D', 'V15-020R', 'V14-018R', 'V14-025D', 'V14-047R', 'V13-020D', 'V12-055D', 'V12-013', 'EP_003', 'Institute_for_Digital_Innovation_1', 'VA_Hostpital_Fredericksburg_1', 'Reunion_Sq_1', 'Park_and_Rose_1', 'SOME_1', 'Elizabeth_Hosue_1', 'Harbour_Point_Baltimore_1', 'Anna_Gooding_School_1', '1224_M_ST_1', '1701_H_ST_1', '7699Rt', '7655Rt', '8302Rt', '8191Rt', '8061Rt', '7934Rt', '7726Rt', '7535Rt', 'D06-014', 'V18-005R', 'V18-012', 'V18-043R', 'V17-015R', 'V17-012R', 'V17-002R', 'V16-003', 'V16-014', 'V16-028', 'V15-028', 'V18-020', 'V18-024', 'The_Wharf_1', 'V14-041', 'V11-004D'];
  const byImg = PX.byImg;
  const best = (n, from = 0) => BEST.slice(from, from + n).map((id) => byImg[id]).filter(Boolean);
  const years = new Date().getFullYear() - +D.company.since;
  const states = new Set(D.projects.map((p) => p.st).filter(Boolean)).size;
  const honours = D.awards.reduce((n, a) => n + a.items.length, 0);

  function nav(links = [['#work', 'Work'], ['#services', 'Services'], ['#index', 'Index'], ['#contact', 'Contact']]) {
    return `<header class="k-nav"><a class="k-brand" href="#top" aria-label="Pillar Construction">${PX.logo('k-logo')}<span>Pillar</span></a>
      <nav aria-label="Sections">${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav>
      <a class="k-cta" href="#contact" data-mag="10">Start a project</a></header>`;
  }

  function index(host, opts = {}) {
    let filt = 'all', all = false; const LIM = opts.limit || 12;
    host.innerHTML = `<div class="k-ix-top"><div class="k-chips" role="group" aria-label="Filter projects by scope">${[['all', 'All', D.projects.length], ...D.services.map((s) => [s.id, SVC[s.id], D.projects.filter((p) => p.s === s.id).length])].map(([k, l, n], i) => `<button type="button" data-f="${k}" aria-pressed="${!i}">${l}<sup>${n}</sup></button>`).join('')}</div><span class="k-ix-n"></span></div>
      <div class="k-rows" data-lb-group></div><button class="k-more" type="button"></button>`;
    const rows = $('.k-rows', host), more = $('.k-more', host), cnt = $('.k-ix-n', host);
    const draw = () => {
      const list = D.projects.filter((p) => filt === 'all' || p.s === filt), shown = all ? list : list.slice(0, LIM);
      rows.innerHTML = shown.map((p, i) => `<a class="k-row" href="#" data-lb="${p.id}" data-cursor="View"><i class="k-band" style="background-image:url('${G(p.img)}')"></i><span class="k-no">${pad(i + 1, 3)}</span><span class="k-nm">${esc(p.n)}</span><span>${esc(loc(p))}</span><span>${SVC[p.s]}</span><span class="k-gc">${esc(p.g || '')}</span></a>`).join('');
      cnt.textContent = `${shown.length} of ${list.length}`;
      more.hidden = list.length <= LIM; more.textContent = all ? 'Show fewer' : `Show all ${list.length}`;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    $('.k-chips', host).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; filt = b.dataset.f; $$('.k-chips button', host).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
    more.addEventListener('click', () => { all = !all; draw(); });
    rows.addEventListener('pointermove', (e) => { const r = e.target.closest('.k-row'); if (!r) return; const b = r.getBoundingClientRect(); r.firstChild.style.backgroundPosition = `${(e.clientX - b.left) / b.width * 100}% 50%`; });
    draw();
  }

  function contact(title = 'Bring us in at design.') {
    const c = D.company, TZ = { 'Houston, TX': 'America/Chicago' };
    const html = `<section class="k-contact" id="contact"><div class="k-c-in">
      <p class="k-eyebrow">Start a project</p><h2 class="k-c-h">${title}</h2>
      <div class="k-c-grid">
        <form class="k-form" id="k-form" novalidate>
          <label for="k-name">Name<input id="k-name" autocomplete="name" placeholder="Jane Smith"></label>
          <label for="k-mail">Email<input id="k-mail" type="email" autocomplete="email" placeholder="jane@company.com"></label>
          <label for="k-msg" class="k-wide">About the project<textarea id="k-msg" rows="3" placeholder="Building type, location, schedule"></textarea></label>
          <button type="submit" class="k-send" data-mag="8">Send enquiry →</button><p class="k-fmsg" id="k-fmsg" hidden></p>
        </form>
        <div class="k-direct"><p><span>Email</span><b class="k-sel">${esc(c.email)}</b></p><p><span>Headquarters</span><b class="k-sel">${esc(c.phone)}</b></p><p><span>Address</span>${esc(c.address)}</p></div>
      </div>
      <div class="k-offices">${D.offices.map((o) => `<div><b>${esc(o.c)}</b><span>${o.a.map(esc).join('<br>')}</span><span>${esc(o.p)}</span><i data-tz="${TZ[o.c] || 'America/New_York'}"></i></div>`).join('')}</div>
    </div>
    <footer class="k-foot"><div class="k-word" aria-hidden="true">${'PILLAR'.split('').map((l) => `<span>${l}</span>`).join('')}</div>
      <div class="k-meta"><span>© ${new Date().getFullYear()} ${esc(c.legal)}</span><span>Concept direction · graded photography · atmosphere images from Unsplash</span><a href="index-v2.html">All six options</a></div></footer></section>`;
    return html;
  }
  function wireContact() {
    const f = $('#k-form'); if (!f) return;
    f.addEventListener('submit', (e) => { e.preventDefault(); const m = $('#k-fmsg'); m.hidden = false; const n = $('#k-name').value.trim(); m.textContent = `Thanks${n ? ', ' + n.split(' ')[0] : ''}. This concept page doesn't send enquiries. Email ${D.company.email} or call ${D.company.phone}.`; });
    const tick = () => $$('[data-tz]').forEach((el) => (el.textContent = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: el.dataset.tz }).format(new Date()) + ' local'));
    tick(); setInterval(tick, 20000);
    const ls = $$('.k-word span'), pics = ['6565Rt', '8621Rt', 'V17-004D', 'V19-019R', 'The_Westerly_Waterfront_1', 'College_Park_City_Hall_1'];
    ls.forEach((l, i) => (l.style.backgroundImage = `url('${G(pics[i % pics.length])}')`));
    let mx = innerWidth / 2, my = innerHeight / 2; addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const st = ls.map(() => ({ rx: 0, ry: 0, z: 0, y: 80 }));
    let rise = 0; if (window.gsap && window.ScrollTrigger) ScrollTrigger.create({ trigger: '.k-foot', start: 'top bottom', end: 'bottom bottom', scrub: true, onUpdate: (s) => (rise = s.progress) });
    (function spin() { requestAnimationFrame(spin); ls.forEach((l, i) => { const r = l.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return; const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.hypot(dx, dy), f = Math.max(0, 1 - d / 700), s = st[i];
      s.ry += (dx * .05 - s.ry) * .08; s.rx += (-dy * .05 - s.rx) * .08; s.z += (f * 120 - s.z) * .1; s.y += ((1 - rise) * 80 * (1 + i * .15) - s.y) * .1;
      l.style.transform = `translateY(${s.y}%) translateZ(${s.z}px) rotateX(${Math.max(-40, Math.min(40, s.rx))}deg) rotateY(${Math.max(-40, Math.min(40, s.ry))}deg)`; l.style.backgroundPosition = `${50 + dx * .03}% ${50 + dy * .03}%`; l.style.color = f > .55 ? 'transparent' : ''; }); })();
  }
  const svcs = (imgs) => D.services.map((s) => ({ id: s.id, name: SVC[s.id], short: s.short, scopes: s.scopes, count: D.projects.filter((p) => p.s === s.id).length, img: imgs[s.id] }));
  window.K = { G, SVC, BEST, best, years, states, honours, nav, index, contact, wireContact, fx, svcs };
})();
