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
