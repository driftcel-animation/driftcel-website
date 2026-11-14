/* Driftcel Animation · site behaviour (no dependencies) */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile nav ---- */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var toggle = nav.querySelector('.nav-toggle');
    var label = nav.querySelector('.nav-toggle-label');
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false); });
  }

  /* ---- Scroll progress + nav shadow ---- */
  var progress = document.querySelector('.progress');
  var onScroll = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Reveal on scroll + active nav link ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    var links = {};
    document.querySelectorAll('.nav-links a[href^="/#"]').forEach(function (a) { links[a.getAttribute('href').slice(2)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Drift's eyes follow the pointer ---- */
  var drifts = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));
  if (drifts.length && !reduceMotion) {
    var pending = false, px = 0, py = 0;
    var look = function () {
      pending = false;
      drifts.forEach(function (svg) {
        var r = svg.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var cx = r.left + r.width / 2, cy = r.top + r.height * 0.6;
        var dx = px - cx, dy = py - cy;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var reach = Math.min(1, dist / 400) * 20; // max travel in SVG units
        var tx = (dx / dist) * reach, ty = (dy / dist) * reach;
        svg.querySelectorAll('.pupil').forEach(function (p) { p.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)'; });
      });
    };
    window.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (!pending) { pending = true; requestAnimationFrame(look); }
    }, { passive: true });
  }

  /* ---- Drift's moods ---- */
  var stage = document.querySelector('[data-mood-stage]');
  if (stage) {
    var svg = stage.querySelector('svg');
    var caption = document.querySelector('[data-mood-caption]');
    var captions = {
      happy: 'Sunny skies. Drift is ready for an adventure.',
      sad: 'Uh oh, a little drizzle. Drift needs a hug.',
      angry: 'Thunder rumbles. Best give Drift a minute.',
      shy: 'Drift turns pink, and Spark tries to hide.'
    };
    document.querySelectorAll('[data-mood]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mood = btn.getAttribute('data-mood');
        document.querySelectorAll('[data-mood]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        stage.setAttribute('data-mood-current', mood);
        if (caption) caption.textContent = captions[mood] || '';
        if (svg && !reduceMotion) {
          svg.classList.remove('is-changing');
          void svg.getBoundingClientRect(); // restart squish animation
          svg.classList.add('is-changing');
          setTimeout(function () { svg.classList.remove('is-changing'); }, 520);
        }
      });
    });
  }

  /* ---- Contact form ----
     With data-endpoint (e.g. a Formspree URL) it posts there.
     Without one it opens the visitor's email app with the message pre-filled. */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    var say = function (msg, isError) { status.textContent = msg; status.classList.toggle('is-error', !!isError); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = null;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute('aria-invalid', String(bad));
        if (bad && !invalid) invalid = f;
      });
      if (invalid) { say('Please fill in your name, a valid email and a message.', true); invalid.focus(); return; }

      var data = new FormData(form);
      var endpoint = form.getAttribute('data-endpoint');
      if (endpoint) {
        var btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; say('Sending…');
        fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); say('Thank you! Drift will get back to you soon. ✦'); })
          .catch(function () { say('Something went wrong. Please email us directly instead.', true); })
          .then(function () { btn.disabled = false; });
      } else {
        var subject = 'New project: ' + data.get('type') + ' (from ' + data.get('name') + ')';
        var body = data.get('message') + '\n\n— ' + data.get('name') + ' <' + data.get('email') + '>';
        window.location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        say('Opening your email app…');
      }
    });
  }

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* ---- Drift cursor: the mouse pointer becomes Drift (desktop with a mouse only) ----
   Hover a link = excited. Each click = the next expression, then back to normal. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NAVY = '#001C4C';
  var eye = function (cx, r) { return '<circle cx="' + cx + '" cy="569" r="' + r + '" fill="#fff"/>'; };
  var pupil = function (cx, r, hr) { return '<circle cx="' + (cx + 18) + '" cy="560" r="' + r + '" fill="' + NAVY + '"/><circle cx="' + (cx + 35) + '" cy="538" r="' + hr + '" fill="#fff"/>'; };
  var arc = function (cx, up) { return '<path d="M' + (cx - 62) + ' ' + (up ? 595 : 560) + ' Q' + cx + ' ' + (up ? 505 : 640) + ' ' + (cx + 62) + ' ' + (up ? 595 : 560) + '" fill="none" stroke="' + NAVY + '" stroke-width="34" stroke-linecap="round"/>'; };
  var cross = function (cx) { return '<path d="M' + (cx - 48) + ' 521 L' + (cx + 48) + ' 617 M' + (cx + 48) + ' 521 L' + (cx - 48) + ' 617" stroke="' + NAVY + '" stroke-width="30" stroke-linecap="round"/>'; };
  var heart = function (cx) { return '<path transform="translate(' + cx + ' 590) scale(1.7)" d="M0 30C-62-14-38-72 0-40C38-72 62-14 0 30Z" fill="#FF3D6E"/>'; };

  var faces = {
    normal:  eye(627, 82) + pupil(627, 52, 17) + eye(833, 80) + pupil(833, 52, 17),
    excited: eye(627, 92) + pupil(627, 62, 20) + eye(833, 90) + pupil(833, 62, 20),
    happy:   arc(627, true) + arc(833, true) + '<path d="M680 680 Q730 740 780 680" fill="none" stroke="' + NAVY + '" stroke-width="26" stroke-linecap="round"/>',
    wink:    eye(627, 82) + pupil(627, 52, 17) + arc(833, false),
    wow:     eye(627, 96) + '<circle cx="627" cy="569" r="30" fill="' + NAVY + '"/>' + eye(833, 94) + '<circle cx="833" cy="569" r="30" fill="' + NAVY + '"/><ellipse cx="730" cy="712" rx="28" ry="36" fill="' + NAVY + '"/>',
    love:    heart(627) + heart(833),
    dizzy:   cross(627) + cross(833) + '<path d="M690 710 q20-20 40 0 t40 0" fill="none" stroke="' + NAVY + '" stroke-width="20" stroke-linecap="round"/>'
  };
  var cycle = ['happy', 'wink', 'wow', 'love', 'dizzy'];

  var el = document.createElement('div');
  el.className = 'drift-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<span class="drift-cursor-dot"></span>' +
    '<svg class="drift-cursor-svg" viewBox="364 152 818 664">' +
      '<defs><radialGradient id="cur-cloud" cx="700" cy="590" r="380" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0047A8"/><stop offset=".55" stop-color="#0270E0"/><stop offset="1" stop-color="#0A8CF5"/></radialGradient>' +
      '<radialGradient id="cur-spark" cx="975" cy="270" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFB40E"/><stop offset=".5" stop-color="#FF6A00"/><stop offset="1" stop-color="#FE5202"/></radialGradient></defs>' +
      '<g class="drift-cursor-body"><path fill="url(#cur-cloud)" d="M505 790C447 790 401 748 401 698C401 664 415 638 437 622C407 596 391 558 391 520C391 425 473 349 578 349C628 349 672 367 706 401C720 413 744 416 760 405C784 392 808 385 834 385C934 385 1003 468 1022 580C1026 600 1028 616 1028 634C1028 720 962 790 880 790Z"/>' +
      '<g class="drift-cursor-face"></g></g>' +
      '<path class="drift-cursor-spark" fill="url(#cur-spark)" stroke="#fff" stroke-width="22" stroke-linejoin="round" paint-order="stroke" d="M985 186C1006 262 1042 312 1148 340C1060 360 1030 412 1022 506C996 428 924 360 812 350C922 328 966 276 985 186Z"/>' +
    '</svg>';
  document.body.appendChild(el);
  document.documentElement.classList.add('has-drift-cursor');

  var faceEl = el.querySelector('.drift-cursor-face');
  var current = '';
  var setFace = function (name) { if (name !== current) { current = name; faceEl.innerHTML = faces[name]; } };
  setFace('normal');

  var x = -100, y = -100, queued = false, clickFace = null, clickTimer = 0, step = 0, hovering = false;
  var render = function () { queued = false; el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; };
  var interactive = 'a, button, [role="button"], label, select, summary, .card';
  var typing = 'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]';

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    el.classList.add('is-visible');
    var t = e.target instanceof Element ? e.target : null;
    el.classList.toggle('is-typing', !!(t && t.closest(typing)));
    var h = !!(t && t.closest(interactive));
    if (h !== hovering) { hovering = h; el.classList.toggle('is-hover', h); if (!clickFace) setFace(h ? 'excited' : 'normal'); }
    if (!queued) { queued = true; requestAnimationFrame(render); }
  }, { passive: true });

  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) el.classList.remove('is-visible'); });
  document.addEventListener('mousedown', function (e) { if (e.button === 0) el.classList.add('is-pressed'); });
  document.addEventListener('mouseup', function () { el.classList.remove('is-pressed'); });

  document.addEventListener('click', function (e) {
    if (e.detail === 0) return; // keyboard-triggered click: nothing to show
    clickFace = cycle[step++ % cycle.length];
    setFace(clickFace);
    el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');
    clearTimeout(clickTimer);
    clickTimer = setTimeout(function () { clickFace = null; setFace(hovering ? 'excited' : 'normal'); }, 1300);
    if (!calm) burst(e.clientX, e.clientY);
  });

  function burst(cx, cy) {
    for (var i = 0; i < 6; i++) {
      var s = document.createElement('span');
      s.className = 'cursor-spark';
      var a = (Math.PI * 2 * i) / 6 + Math.random() * 0.6, d = 26 + Math.random() * 18;
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px');
      if (i % 2) s.style.background = '#0A8CF5';
      document.body.appendChild(s);
      setTimeout(function (n) { return function () { n.remove(); }; }(s), 650);
    }
  }
})();
