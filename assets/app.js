/* ============================================================
   GIT GLOBAL — interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Sticky nav ---------- */
  var nav = document.querySelector(".nav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".mobile-menu");
  if (burger) {
    burger.addEventListener("click", function () {
      menu.classList.toggle("open");
      burger.classList.toggle("x");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { menu.classList.remove("open"); burger.classList.remove("x"); });
    });
  }

  /* ---------- Scroll reveal (rect-based; robust across contexts) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function checkReveal() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = revealEls.length - 1; i >= 0; i--) {
      var el = revealEls[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) {           // reveal once its top crosses into view (or has passed)
        el.classList.add("in");
        revealEls.splice(i, 1);
      }
    }
    if (revealEls.length === 0) {
      window.removeEventListener("scroll", checkReveal);
      window.removeEventListener("resize", checkReveal);
    }
  }
  window.addEventListener("scroll", checkReveal, { passive: true });
  window.addEventListener("resize", checkReveal);
  checkReveal();
  // safety net: never leave content hidden — poll briefly in case scroll events are throttled
  window.addEventListener("load", checkReveal);
  var revealPoll = setInterval(function () {
    checkReveal();
    if (revealEls.length === 0) clearInterval(revealPoll);
  }, 250);
  setTimeout(function () { clearInterval(revealPoll); }, 12000);

  /* ---------- Active section in nav (scroll-based) ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function syncActive() {
    var mid = window.scrollY + (window.innerHeight || 800) * 0.4;
    var bestI = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].offsetTop <= mid) bestI = i;
    }
    navLinks.forEach(function (a, i) { a.classList.toggle("active", i === bestI); });
  }
  window.addEventListener("scroll", syncActive, { passive: true });
  syncActive();

  /* ---------- Process progress line + step lighting ---------- */
  var steps = document.querySelector(".steps");
  if (steps) {
    var stepEls = Array.prototype.slice.call(steps.querySelectorAll(".step"));
    var prog = steps.querySelector(".prog");
    var litDone = false;
    function checkSteps() {
      if (litDone) return;
      var r = steps.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      if (r.top < vh * 0.7 && r.bottom > 0) {
        litDone = true;
        if (prog) prog.style.width = "88%";
        stepEls.forEach(function (st, i) { setTimeout(function () { st.classList.add("lit"); }, 240 * i); });
        window.removeEventListener("scroll", checkSteps);
      }
    }
    window.addEventListener("scroll", checkSteps, { passive: true });
    checkSteps();
    var stepPoll = setInterval(function () { checkSteps(); if (litDone) clearInterval(stepPoll); }, 250);
    setTimeout(function () { clearInterval(stepPoll); }, 12000);
  }

  /* ---------- Hero canvas : orbital rings + drifting nodes ---------- */
  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, cx = 0, cy = 0;

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // focal point toward the right, vertically centered
    cx = W * (W > 900 ? 0.7 : 0.5);
    cy = H * 0.46;
  }
  resize();
  window.addEventListener("resize", resize);

  // Orbital ring definitions (radius factor, tilt, speed, count of nodes)
  var rings = [
    { rf: 0.16, tilt: 0.30, spd: 0.00040, n: 3, ph: 0.0 },
    { rf: 0.27, tilt: 0.42, spd: -0.00030, n: 4, ph: 1.1 },
    { rf: 0.40, tilt: 0.34, spd: 0.00022, n: 5, ph: 2.3 },
    { rf: 0.55, tilt: 0.50, spd: -0.00016, n: 6, ph: 0.6 }
  ];

  // free-floating background particles
  var parts = [];
  function seedParts() {
    parts = [];
    var count = Math.round((W * H) / 26000);
    count = Math.max(26, Math.min(70, count));
    for (var i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.4 + 0.5
      });
    }
  }
  seedParts();
  window.addEventListener("resize", seedParts);

  var mouse = { x: -9999, y: -9999 };
  canvas.parentElement.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener("mouseleave", function () { mouse.x = -9999; mouse.y = -9999; });

  function ringRadius(rf) { return Math.min(W, H) * rf * (W > 900 ? 1.45 : 1.15); }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    var base = Math.min(W, H);

    // ---- free particles + their links ----
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      // link to nearby
      for (var j = i + 1; j < parts.length; j++) {
        var q = parts[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 13000) {
          var a = (1 - d2 / 13000) * 0.16;
          ctx.strokeStyle = "rgba(0,212,255," + a + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < parts.length; k++) {
      var pp = parts[k];
      ctx.fillStyle = "rgba(150,190,235,0.45)";
      ctx.beginPath(); ctx.arc(pp.x, pp.y, pp.r, 0, 6.2832); ctx.fill();
    }

    // ---- orbital rings (elliptical) ----
    rings.forEach(function (ring) {
      var R = ringRadius(ring.rf);
      var ry = R * ring.tilt;
      // ring outline
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(0,212,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, R, ry, 0, 0, 6.2832);
      ctx.stroke();
      ctx.restore();

      // nodes on ring
      var ang0 = t * ring.spd + ring.ph;
      for (var m = 0; m < ring.n; m++) {
        var a2 = ang0 + (m / ring.n) * 6.2832;
        var nx = cx + Math.cos(a2) * R;
        var ny = cy + Math.sin(a2) * ry;
        var depth = (Math.sin(a2) + 1) / 2; // 0 back .. 1 front
        var size = 1.6 + depth * 2.6;
        var alpha = 0.35 + depth * 0.55;
        // glow
        var g = ctx.createRadialGradient(nx, ny, 0, nx, ny, size * 5);
        g.addColorStop(0, "rgba(15,255,212," + (alpha * 0.5) + ")");
        g.addColorStop(1, "rgba(0,212,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nx, ny, size * 5, 0, 6.2832); ctx.fill();
        // core
        ctx.fillStyle = "rgba(180,250,255," + alpha + ")";
        ctx.beginPath(); ctx.arc(nx, ny, size, 0, 6.2832); ctx.fill();
      }
    });

    // ---- central core glow ----
    var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.22);
    cg.addColorStop(0, "rgba(0,212,255,0.16)");
    cg.addColorStop(0.5, "rgba(0,153,204,0.06)");
    cg.addColorStop(1, "rgba(0,153,204,0)");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(cx, cy, base * 0.22, 0, 6.2832); ctx.fill();
    // core dot
    ctx.fillStyle = "rgba(220,250,255,0.9)";
    ctx.beginPath(); ctx.arc(cx, cy, 3.4, 0, 6.2832); ctx.fill();
  }

  if (prefersReduce) {
    draw(0);
  } else {
    var raf;
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    // pause when offscreen to save cycles
    var heroVisible = true;
    var hio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        heroVisible = e.isIntersecting;
        if (heroVisible && !raf) raf = requestAnimationFrame(loop);
        if (!heroVisible && raf) { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0.01 });
    hio.observe(canvas);
    raf = requestAnimationFrame(loop);
  }
})();

/* ---------- Contact form ---------- */
(function () {
  var form = document.querySelector('#contact .form');
  if (!form) return;
  var btn = form.querySelector('button[type="submit"]');
  var origHtml = btn.innerHTML;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name    = form.querySelector('#f-name').value.trim();
    var email   = form.querySelector('#f-email').value.trim();
    var org     = form.querySelector('#f-org').value.trim();
    var service = form.querySelector('#f-svc').value;
    var message = form.querySelector('#f-msg').value.trim();

    if (!name || !email || !message) {
      btn.innerHTML = 'Please fill required fields';
      setTimeout(function () { btn.innerHTML = origHtml; }, 3000);
      return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Sending…';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, org: org, service: service, message: message }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        btn.innerHTML = data.ok ? '✓ Sent!' : 'Failed — Try Again';
        if (data.ok) form.reset();
        setTimeout(function () { btn.disabled = false; btn.innerHTML = origHtml; }, 3000);
      })
      .catch(function () {
        btn.innerHTML = 'Failed — Try Again';
        setTimeout(function () { btn.disabled = false; btn.innerHTML = origHtml; }, 3000);
      });
  });
})();
