/* ============================================================
   INTEMO — shared scripts (dark theme only)
   Each block guards for its own elements, so it's safe site-wide.
   ============================================================ */

/* ---- Sliding nav underline (animates between links on page change) ---- */
(function () {
  var links = document.querySelector('.nav-links');
  if (!links) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var u = document.createElement('span');
  u.className = 'nav-underline';
  links.appendChild(u);

  function metrics(el) {
    var pr = links.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { left: r.left - pr.left, width: r.width };
  }
  function place(el, animate) {
    if (!el) { u.style.opacity = '0'; return; }
    var m = metrics(el);
    u.style.transition = (animate && !reduce)
      ? 'transform .5s cubic-bezier(.65,.05,.25,1), width .5s cubic-bezier(.65,.05,.25,1)'
      : 'none';
    u.style.transform = 'translateX(' + m.left + 'px)';
    u.style.width = m.width + 'px';
    u.style.opacity = '1';
  }
  function page(p) { return (p || '').split('/').pop() || 'index.html'; }
  function linkFor(p) {
    var as = links.querySelectorAll('.nav-link');
    for (var i = 0; i < as.length; i++) {
      if (page(as[i].getAttribute('href')) === p) return as[i];
    }
    return null;
  }

  var cur = links.querySelector('.nav-link.is-active');
  var here = page(location.pathname);
  var prev = null;
  try { prev = sessionStorage.getItem('nav-prev'); } catch (e) {}

  if (cur) {
    var start = (prev && prev !== here) ? linkFor(prev) : null;
    if (start && start !== cur) {
      place(start, false); // sit under the page we came from
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { place(cur, true); }); // then glide to current
      });
    } else {
      place(cur, false);
    }
  }
  try { sessionStorage.setItem('nav-prev', here); } catch (e) {}

  window.addEventListener('resize', function () {
    place(links.querySelector('.nav-link.is-active'), false);
  });
})();

/* ---- Mobile nav toggle ---- */
(function () {
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMobile');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
      var open = menu.classList.contains('open');
      toggle.innerHTML = open ? '<i class="ti ti-x"></i>' : '<i class="ti ti-menu-2"></i>';
    });
  }
})();

/* ---- Smooth same-page navigation ----
   • In-page #anchor links scroll smoothly (offset for the sticky nav via CSS).
   • Links that point to the CURRENT page (e.g. "Home" while already home) scroll
     to top instead of triggering a full reload.
   • Mobile menu closes after any click. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('navMobile');
  var toggle = document.getElementById('navToggle');

  function closeMobile() {
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      if (toggle) toggle.innerHTML = '<i class="ti ti-menu-2"></i>';
    }
  }
  function here() { return location.pathname.split('/').pop() || 'index.html'; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') { return; }

    // pure in-page anchor: "#roi"
    if (href.charAt(0) === '#') {
      var t = document.getElementById(href.slice(1));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); closeMobile(); }
      return;
    }

    // resolve the link's path + hash and compare to the current page
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;            // external — leave alone
    var target = (url.pathname.split('/').pop() || 'index.html');
    if (target !== here()) return;                          // different page — normal nav

    // same page: scroll to the hash target, or to the top
    e.preventDefault();
    closeMobile();
    if (url.hash && document.getElementById(url.hash.slice(1))) {
      document.getElementById(url.hash.slice(1)).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  });
})();

/* ---- Hero node-network canvas ---- */
(function () {
  var C = document.getElementById('nodeCanvas');
  if (!C) return;
  var wrap = C.parentElement;
  var ctx = C.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // colors come from CSS custom properties so the canvas matches any theme
  var cs = getComputedStyle(document.documentElement);
  function v(name, fb) { var x = cs.getPropertyValue(name).trim(); return x || fb; }
  var COL = {
    accent:  v('--node-accent', '#7FD95A'),
    info:    v('--node-info', '#7FB3FF'),
    dim:     v('--node-dim', 'rgba(255,255,255,0.30)'),
    dimText: v('--node-dim-text', 'rgba(255,255,255,0.55)')
  };
  var EDGE = v('--node-edge', 'rgba(28,64,159,0.32)');
  var GLOW = v('--node-glow', 'rgba(28,64,159,0.10)');
  var FILL = v('--node-fill', '#0C0E14');
  function roleStroke(role) { return role === 'accent' ? COL.accent : role === 'info' ? COL.info : COL.dim; }
  function roleText(role) { return role === 'accent' ? COL.accent : role === 'info' ? COL.info : COL.dimText; }

  var nodes = [
    { label: 'Inquiry',  x: 0.50, y: 0.18, r: 26, role: 'accent' },
    { label: 'Rate',     x: 0.83, y: 0.32, r: 21, role: 'accent' },
    { label: 'Email',    x: 0.53, y: 0.42, r: 19, role: 'dim' },
    { label: 'Quote',    x: 0.72, y: 0.58, r: 22, role: 'accent' },
    { label: 'ERP',      x: 0.37, y: 0.62, r: 23, role: 'info' },
    { label: 'Job',      x: 0.21, y: 0.78, r: 20, role: 'info' },
    { label: 'Invoice',  x: 0.80, y: 0.80, r: 21, role: 'accent' },
    { label: 'Document', x: 0.16, y: 0.36, r: 27, role: 'dim' }
  ];
  var edges = [[0,2],[0,1],[2,3],[1,3],[3,4],[3,6],[4,5],[4,6],[0,7],[7,4]];
  var particles = edges.map(function (e) { return { e: e, t: Math.random(), spd: 0.004 + Math.random() * 0.004 }; });

  function resize() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    C.width = w * dpr; C.height = h * dpr;
    C.style.width = w + 'px'; C.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function px(n) { return { x: n.x * wrap.clientWidth, y: n.y * wrap.clientHeight }; }

  // pick the largest font (capped by radius) at which the label fits inside the node
  function fitFont(label, r) {
    var size = Math.min(13, Math.round(r * 0.5));
    var maxW = r * 2 - 10; // inner width with padding
    ctx.font = '500 ' + size + 'px Geist, sans-serif';
    while (size > 7 && ctx.measureText(label).width > maxW) {
      size -= 1;
      ctx.font = '500 ' + size + 'px Geist, sans-serif';
    }
    return size;
  }

  function frame() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    ctx.clearRect(0, 0, w, h);

    edges.forEach(function (e) {
      var a = px(nodes[e[0]]), b = px(nodes[e[1]]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = EDGE; ctx.lineWidth = 1; ctx.stroke();
    });
    particles.forEach(function (p) {
      p.t += p.spd; if (p.t > 1) p.t = 0;
      var a = px(nodes[p.e[0]]), b = px(nodes[p.e[1]]);
      var x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = COL.accent; ctx.fill();
    });
    nodes.forEach(function (n) {
      var p = px(n);
      ctx.beginPath(); ctx.arc(p.x, p.y, n.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = GLOW; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = FILL; ctx.fill();
      ctx.strokeStyle = roleStroke(n.role); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = roleText(n.role);
      ctx.font = '500 ' + fitFont(n.label, n.r) + 'px Geist, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.label, p.x, p.y);
    });
    requestAnimationFrame(frame);
  }
  resize(); frame();
  window.addEventListener('resize', resize);
})();

/* ---- Hero stats: count-up on scroll into view ---- */
(function () {
  var wrap = document.querySelector('.hero-stats');
  if (!wrap) return;
  var nums = [].slice.call(wrap.querySelectorAll('.stat-num'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // parse "70%" -> {target:70, suffix:'%'}, "24/7" -> static, "0" -> {target:0}
  nums.forEach(function (el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^(\d[\d,]*)(.*)$/);
    if (m && raw.indexOf('/') === -1) {
      el.dataset.target = m[1].replace(/,/g, '');
      el.dataset.suffix = m[2] || '';
      if (!reduce) el.textContent = '0' + (m[2] || '');
    }
  });

  wrap.classList.add('animate-ready');

  function run() {
    wrap.classList.add('in-view');
    if (reduce) return;
    nums.forEach(function (el) {
      if (el.dataset.target === undefined) return;
      var target = +el.dataset.target, suffix = el.dataset.suffix || '';
      if (target === 0) { el.textContent = '0' + suffix; return; }
      var start = performance.now(), dur = 1400;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(); io.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(wrap);
  } else { run(); }
})();

/* ---- Agent status board: resets to 0 each midnight, grows through the day ---- */
(function () {
  if (!document.getElementById('c-inq')) return;
  var totalEl = document.getElementById('tasks-done');
  var agents = [
    { id: 'c-inq',     daily: 150 },
    { id: 'c-rate',    daily: 95  },
    { id: 'c-quote',   daily: 40  },
    { id: 'c-job',     daily: 70  },
    { id: 'c-invoice', daily: 220 },
    { id: 'c-track',   daily: 1280 },
    { id: 'c-blsi',    daily: 22  }
  ];

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function dayFraction() {
    var d = new Date();
    return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
  }
  // stable per-day pseudo-random so reloads don't jump around within a day
  function seedRand(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 1000) / 1000;
  }

  var state;
  try { state = JSON.parse(localStorage.getItem('intemo-board') || 'null'); } catch (e) { state = null; }

  function freshDay(key) {
    var s = { date: key, vals: {} };
    var frac = dayFraction();
    agents.forEach(function (a) {
      var variation = 0.9 + seedRand(key + a.id) * 0.2; // ±10%
      s.vals[a.id] = Math.floor(a.daily * variation * frac);
    });
    return s;
  }

  if (!state || state.date !== todayKey()) state = freshDay(todayKey());

  function render() {
    var total = 0;
    agents.forEach(function (a) {
      var el = document.getElementById(a.id);
      var v = state.vals[a.id] || 0;
      if (el) el.textContent = v.toLocaleString('en-IN');
      total += v;
    });
    if (totalEl) totalEl.textContent = total.toLocaleString('en-IN');
  }
  function save() { try { localStorage.setItem('intemo-board', JSON.stringify(state)); } catch (e) {} }

  render(); save();

  setInterval(function () {
    // midnight rollover -> reset to 0
    if (todayKey() !== state.date) {
      state = { date: todayKey(), vals: {} };
      agents.forEach(function (a) { state.vals[a.id] = 0; });
      render(); save();
      return;
    }
    // live ticking, capped at a soft ceiling for the current time of day
    var frac = dayFraction();
    agents.forEach(function (a) {
      var ceiling = Math.floor(a.daily * 1.1 * Math.min(1, frac + 0.05));
      if (state.vals[a.id] < ceiling && Math.random() < 0.6) {
        state.vals[a.id] += 1 + Math.floor(Math.random() * (a.daily > 300 ? 3 : 1));
        if (state.vals[a.id] > ceiling) state.vals[a.id] = ceiling;
      }
    });
    render(); save();
  }, 2500);

  // dynamic daily trend: 12% ±3, stable per day
  (function () {
    var el = document.getElementById('board-trend');
    if (!el) return;
    var pct = 12 + Math.round((seedRand(todayKey() + 'trend') - 0.5) * 6); // 9..15
    var up = pct >= 0;
    el.textContent = (up ? '↑ ' : '↓ ') + Math.abs(pct) + '% vs yesterday';
    el.style.color = up ? 'var(--green)' : 'var(--text-muted)';
  })();
})();

/* ---- Mission visual: scattered particles organize into a row, then reform (M3) ---- */
(function () {
  var box = document.getElementById('missionParticles');
  if (!box) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    box.innerHTML = '';
    var W = box.clientWidth || 460, H = box.clientHeight || 360, N = 22;
    var gapX = (W - 80) / (N - 1);
    for (var i = 0; i < N; i++) {
      var d = document.createElement('div');
      d.className = 'd' + (i % 4 === 0 ? ' g' : '');
      var sx = 30 + Math.random() * (W - 60), sy = 30 + Math.random() * (H - 90);
      d.style.left = sx + 'px'; d.style.top = sy + 'px';
      d.dataset.sx = sx; d.dataset.sy = sy;
      d.dataset.ox = 40 + i * gapX; d.dataset.oy = H / 2 - 6;
      box.appendChild(d);
    }
    return [].slice.call(box.querySelectorAll('.d'));
  }

  var dots = build();
  if (reduce) {
    dots.forEach(function (d) { d.style.left = d.dataset.ox + 'px'; d.style.top = d.dataset.oy + 'px'; });
    return;
  }
  var ordered = false;
  function tick() {
    ordered = !ordered;
    dots.forEach(function (d) {
      d.style.transition = 'left 1.4s cubic-bezier(.7,0,.2,1), top 1.4s cubic-bezier(.7,0,.2,1), opacity .8s ease';
      d.style.left = (ordered ? d.dataset.ox : d.dataset.sx) + 'px';
      d.style.top = (ordered ? d.dataset.oy : d.dataset.sy) + 'px';
      d.style.opacity = ordered ? '1' : '0.5';
    });
  }
  tick();
  setInterval(tick, 2600);
  window.addEventListener('resize', function () {
    dots = build();
    ordered = false; tick();
  });
})();

/* ---- ERP carousel: repeat to fill width, then duplicate for seamless loop ---- */
(function () {
  var track = document.getElementById('erpTrack');
  if (!track) return;
  var base = track.innerHTML;
  var viewport = (track.parentElement && track.parentElement.clientWidth) || window.innerWidth;
  // repeat the base set until one sequence comfortably exceeds the viewport
  var guard = 0;
  while (track.scrollWidth < viewport * 1.5 && guard < 20) { track.innerHTML += base; guard++; }
  var halfWidth = track.scrollWidth;
  // duplicate the whole sequence so translateX(-50%) loops seamlessly
  track.innerHTML += track.innerHTML;
  // constant, calm speed (~55px/s) regardless of how many logos
  track.style.animationDuration = Math.max(24, Math.round(halfWidth / 55)) + 's';
})();

/* ---- ROI calculator ---- */
(function () {
  var enqEl = document.getElementById('enq');
  if (!enqEl) return;
  var revEl = document.getElementById('rev');
  var wrEl = document.getElementById('wr');
  var curEl = document.getElementById('cur');

  // All maths run in a base currency (INR); the revenue slider operates in the
  // SELECTED currency (so increments stay round), and converts to base for maths.
  // rate = base (INR) units per 1 unit of the currency. Indicative FX only.
  var CUR = {
    INR: { sym: '₹',    rate: 1,    loc: 'en-IN', abbr: [[1e7, 'Cr'], [1e5, 'L'], [1e3, 'K']], min: 10000, max: 1000000, step: 5000 },
    USD: { sym: '$',    rate: 83,   loc: 'en-US', abbr: [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']], min: 100, max: 12000, step: 100 },
    EUR: { sym: '€',    rate: 90,   loc: 'en-IE', abbr: [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']], min: 100, max: 11000, step: 100 },
    GBP: { sym: '£',    rate: 105,  loc: 'en-GB', abbr: [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']], min: 100, max: 10000, step: 100 },
    AED: { sym: 'AED ', rate: 22.6, loc: 'en-US', abbr: [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']], min: 500, max: 45000, step: 500 },
    SGD: { sym: 'S$',   rate: 62,   loc: 'en-US', abbr: [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']], min: 200, max: 16000, step: 200 }
  };
  var cur = CUR.INR;

  function conv(inr) { return inr / cur.rate; }
  function abbr(v) {
    for (var i = 0; i < cur.abbr.length; i++) {
      if (v >= cur.abbr[i][0]) return (Math.round(v / cur.abbr[i][0] * 10) / 10) + ' ' + cur.abbr[i][1];
    }
    if (v >= 1000) return Math.round(v).toLocaleString(cur.loc);
    return v < 10 ? v.toFixed(1) : Math.round(v).toString();
  }
  function money(inr) { return cur.sym + abbr(conv(inr)); }           // abbreviated (Cr/L/M/K)
  function moneyFull(inr) {
    var v = conv(inr);
    return cur.sym + (v < 100 ? (v < 10 ? v.toFixed(1) : Math.round(v).toString())
                              : Math.round(v).toLocaleString(cur.loc));
  }
  function rng(lo, hi) { return money(lo) + ' – ' + money(hi); }
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  function calc() {
    var enq = +enqEl.value, wr = +wrEl.value;
    var revInr = +revEl.value * cur.rate;          // slider is in selected currency
    set('enq-out', enq.toLocaleString('en-IN'));
    set('rev-out', moneyFull(revInr));
    set('wr-out', wr + '%');

    // deals won today = inquiries × win rate; Intemo lifts conversion 10–15% (relative)
    var wonNow = enq * (wr / 100);
    var sLo = Math.round(wonNow * 0.10), sHi = Math.round(wonNow * 0.15);
    var rMLo = sLo * revInr, rMHi = sHi * revInr;

    var hLo = enq * 2, hHi = enq * 3;
    var mCLo = hLo * 150, mCHi = hHi * 200;          // cost per manhour: ₹150–200 base
    var mSLo = Math.round(mCLo * 0.95), mSHi = Math.round(mCHi * 0.95);
    var tMLo = rMLo + mSLo, tMHi = rMHi + mSHi;

    set('r-ships', sLo + ' – ' + sHi);
    set('r-rev-month', rng(rMLo, rMHi));
    set('r-rev-year', rng(rMLo * 12, rMHi * 12));
    set('r-hours', hLo.toLocaleString('en-IN') + ' – ' + hHi.toLocaleString('en-IN') + ' hrs');
    set('r-mp-cost', rng(mCLo, mCHi));
    set('r-mp-save', rng(mSLo, mSHi));
    set('r-mp-year', rng(mSLo * 12, mSHi * 12));
    set('t-month', rng(tMLo, tMHi));
    set('t-year', rng(tMLo * 12, tMHi * 12));

    var peLo = Math.round(tMLo / enq), peHi = Math.round(tMHi / enq);
    set('t-per-enq', moneyFull(peLo) + ' – ' + moneyFull(peHi));
    set('f-rev', 'Revenue uplift = ' + enq.toLocaleString('en-IN') + ' inquiries × ' + wr + '% win rate × 10–15% conversion lift × ' + moneyFull(revInr));
    set('f-mp', 'Manpower savings = ' + enq.toLocaleString('en-IN') + ' inquiries × 2–3 hrs × ' + moneyFull(150) + '–' + moneyFull(200) + '/hr × 95% automation');
  }

  function applyCurrency(next) {
    var prevInr = +revEl.value * cur.rate;          // preserve the equivalent amount
    cur = CUR[next] || CUR.INR;
    revEl.min = cur.min; revEl.max = cur.max; revEl.step = cur.step;
    var v = Math.round((prevInr / cur.rate) / cur.step) * cur.step;
    revEl.value = Math.min(cur.max, Math.max(cur.min, v));
    calc();
  }

  [enqEl, revEl, wrEl].forEach(function (el) { el.addEventListener('input', calc); });
  if (curEl) curEl.addEventListener('change', function () { applyCurrency(curEl.value); });
  calc();
})();
