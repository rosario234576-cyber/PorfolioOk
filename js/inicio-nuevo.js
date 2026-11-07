/* Inicio renovado — interacciones y animaciones */
(function () {
  "use strict";
  var doc = document.documentElement;
  var finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* Smooth scroll (Lenis) */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  function scrollToTarget(el) {
    if (lenis) lenis.scrollTo(el, { offset: -20, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var el = id.length > 1 ? document.querySelector(id) : document.body;
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
    });
  });

  /* Header: solid after hero, hides on scroll down */
  var header = document.querySelector("[data-header]");
  var bar = document.querySelector(".nx-progress span");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    header.classList.toggle("is-solid", y > 40);
    header.classList.toggle("is-hidden", y > 400 && y > lastY && !menu.classList.contains("is-open"));
    lastY = y;
  }

  /* Mobile menu */
  var burger = document.querySelector(".nx-burger");
  var menu = document.getElementById("nx-menu");
  function closeMenu() {
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", function () {
    var open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Split headings into words */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span"); w.className = "split-word";
            var i = document.createElement("span"); i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    el.querySelectorAll(".split-word>span").forEach(function (s, i) { s.style.transitionDelay = (i * 0.06) + "s"; });
  });

  /* Manifesto words */
  var manifesto = document.querySelector("[data-words]");
  var words = [];
  if (manifesto) {
    manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
    words = manifesto.querySelectorAll(".w");
  }

  /* Reveal on view */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute("data-reveal"); }) : [];
      var idx = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = Math.min(idx * 0.08, 0.4) + "s";
      el.classList.add("is-in");
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll("[data-reveal],[data-split]").forEach(function (el) { io.observe(el); });

  /* Hero intro */
  requestAnimationFrame(function () {
    document.body.classList.add("nx-loaded");
    document.querySelectorAll(".nx-in").forEach(function (el, i) {
      el.style.transitionDelay = (0.35 + i * 0.12) + "s";
      el.classList.add("is-in");
    });
  });

  /* Count up */
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, end = +el.dataset.count, t0 = null;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1400, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  });
  document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = "0"; countIO.observe(el); });

  /* Hero card deck */
  var deck = document.querySelector("[data-deck]");
  if (deck) {
    var cards = Array.prototype.slice.call(deck.children);
    var order = cards.map(function (_, i) { return i; });
    var paint = function () { order.forEach(function (c, pos) { cards[c].dataset.pos = pos; }); };
    paint();
    setInterval(function () { order.push(order.shift()); paint(); }, 2800);
  }

  /* Hero tilt */
  var stage = document.querySelector("[data-tilt]");
  if (stage && finePointer) {
    var hero = document.querySelector(".nx-hero");
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      deck.style.transform = "rotateY(" + x * 14 + "deg) rotateX(" + -y * 10 + "deg)";
    });
    hero.addEventListener("mouseleave", function () { deck.style.transform = ""; });
  }

  /* Rotating images in tiles */
  document.querySelectorAll("[data-rotator]").forEach(function (box) {
    var imgs = box.querySelectorAll("img"), i = 0;
    imgs[0].classList.add("is-on");
    setInterval(function () {
      imgs[i].classList.remove("is-on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("is-on");
    }, 2600);
  });

  /* Autoplay videos only when visible */
  var vIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.25 });
  document.querySelectorAll("video[data-autoplay]").forEach(function (v) { vIO.observe(v); });

  /* Services hover preview */
  var preview = document.querySelector(".nx-svc-preview");
  if (preview && finePointer) {
    var pimg = preview.querySelector("img");
    var list = document.querySelector(".nx-svc-list");
    var px = 0, py = 0, tx = 0, ty = 0, raf = null;
    var loop = function () {
      px += (tx - px) * 0.18; py += (ty - py) * 0.18;
      preview.style.left = px + "px";
      preview.style.top = py + "px";
      raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    document.querySelectorAll("[data-preview]").forEach(function (a) {
      var pre = new Image(); pre.src = a.dataset.preview;
      a.addEventListener("mouseenter", function () { pimg.src = a.dataset.preview; preview.classList.add("is-on"); });
      a.addEventListener("mouseleave", function () { preview.classList.remove("is-on"); });
      a.addEventListener("mousemove", function (e) {
        var lr = list.getBoundingClientRect();
        tx = lr.left + lr.width * 0.66 + (e.clientX - lr.left - lr.width / 2) * 0.12; ty = e.clientY;
        if (!px) { px = tx; py = ty; }
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  /* Custom cursor + magnetic buttons */
  if (finePointer) {
    var cur = document.querySelector(".nx-cursor");
    var cx = innerWidth / 2, cy = innerHeight / 2, mx = cx, my = cy;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; cur.classList.add("is-live"); }, { passive: true });
    document.addEventListener("mouseleave", function () { cur.classList.remove("is-live"); });
    (function tick() {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(tick);
    })();
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("a,button");
      cur.classList.toggle("is-link", !!t && !t.closest(".nx-svc-list,.nx-bento"));
      cur.classList.toggle("is-hidden", !!(t && t.closest(".nx-svc-list,.nx-bento")));
    });
    document.querySelectorAll("[data-magnetic]").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.25 + "px," + (e.clientY - r.top - r.height / 2) * 0.35 + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* Reviews: arrows, drag, read more */
  var track = document.querySelector("[data-reviews]");
  if (track) {
    var stepBy = function (dir) {
      var card = track.querySelector(".nx-review");
      track.scrollBy({ left: dir * (card.offsetWidth + 18), behavior: "smooth" });
    };
    document.querySelector('[data-rev="prev"]').addEventListener("click", function () { stepBy(-1); });
    document.querySelector('[data-rev="next"]').addEventListener("click", function () { stepBy(1); });
    track.setAttribute("data-lenis-prevent-horizontal", "");
    if (finePointer) {
      var down = false, sx = 0, sl = 0, moved = false;
      track.addEventListener("mousedown", function (e) { down = true; moved = false; sx = e.pageX; sl = track.scrollLeft; track.classList.add("is-drag"); });
      window.addEventListener("mouseup", function () { if (!down) return; down = false; track.classList.remove("is-drag"); });
      track.addEventListener("mousemove", function (e) { if (!down) return; var d = e.pageX - sx; if (Math.abs(d) > 4) moved = true; track.scrollLeft = sl - d; });
      track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
    track.querySelectorAll(".nx-review").forEach(function (rev) {
      var btn = rev.querySelector(".nx-more"), bq = rev.querySelector("blockquote");
      if (bq.scrollHeight <= bq.clientHeight + 4) { btn.hidden = true; rev.classList.add("is-open"); return; }
      btn.addEventListener("click", function () {
        var open = rev.classList.toggle("is-open");
        btn.textContent = open ? "Mostrar menos" : "Leer completa";
      });
    });
  }

  /* Scroll-linked: manifesto words, process line, parallax */
  var steps = document.querySelector("[data-steps]");
  var stepItems = steps ? steps.querySelectorAll("li") : [];
  var para = document.querySelectorAll("[data-parallax]");
  function scrollFx() {
    var vh = innerHeight;
    if (words.length) {
      var r = manifesto.getBoundingClientRect();
      var p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
      var lit = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle("on", i < lit); });
    }
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var sp = Math.min(Math.max((vh * 0.8 - sr.top) / (vh * 0.5), 0), 1);
      steps.style.setProperty("--p", sp.toFixed(3));
      stepItems.forEach(function (li, i) { li.classList.toggle("on", sp >= i / stepItems.length + 0.05); });
    }
    para.forEach(function (el) {
      var pr = el.getBoundingClientRect();
      var c = pr.top + pr.height / 2 - vh / 2;
      var img = el.querySelector("img");
      if (img) img.style.transform = "translateY(" + (c * +el.dataset.parallax - 40) + "px)";
    });
  }
  window.addEventListener("scroll", function () { requestAnimationFrame(scrollFx); }, { passive: true });
  window.addEventListener("resize", scrollFx);
  scrollFx();
})();
