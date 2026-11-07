/* Inicio renovado — animaciones de scroll (GSAP + ScrollTrigger + Lenis) */
(function () {
  "use strict";
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Acordeón (funciona con o sin GSAP) ---------- */
  $$("[data-accordion] .fx-acc-item").forEach(function (item, _, all) {
    var btn = $("button", item);
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      all.forEach(function (o) { o.classList.remove("is-open"); $("button", o).setAttribute("aria-expanded", "false"); });
      if (open) { item.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
      setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 650);
    });
  });

  /* ---------- Videos: solo se reproducen visibles ---------- */
  var vIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting) { v.preload = "auto"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.2 });
  $$("video[data-autoplay]").forEach(function (v) { vIO.observe(v); });

  /* ---------- Indicador de sección en el marco ---------- */
  var nameEls = $$("[data-section-name]"), numEl = $("[data-section-num]");
  function setSection(sec) {
    nameEls.forEach(function (el) { el.textContent = sec.dataset.name; });
    if (numEl) numEl.textContent = sec.dataset.num;
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Scroll suave ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var el = $(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { duration: 1.6 }); else el.scrollIntoView({ behavior: "smooth" });
    });
  });

  var hero = $(".fx-hero"), cat = $(".fx-hero-cat");
  var letters1 = $$(".fx-row-1 > span"), letters2 = $$(".fx-row-2 > span");
  var tags = $$(".fx-hero-tag");

  /* ---------- Entrada de la portada ---------- */
  var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".fx-hero-kicker", { y: -20, opacity: 0, duration: 1 })
    .from(letters1, { yPercent: 110, duration: 1.3, stagger: 0.05 }, 0.1)
    .from(letters2, { yPercent: 110, duration: 1.3, stagger: 0.05 }, 0.25)
    .from(cat, { yPercent: 70, duration: 1.6 }, 0.35)
    .from(tags, { scale: 0, rotation: -30, duration: 0.9, stagger: 0.08, ease: "back.out(2)" }, 1)
    .from(".fx-hero-scroll", { opacity: 0, duration: 0.6 }, 1.3);

  /* ---------- Marco claro sobre fondos naranjas ---------- */
  ScrollTrigger.create({
    trigger: hero, start: "top top", end: "bottom 10%",
    onToggle: function (s) { body.classList.toggle("ui-light", s.isActive); }
  });

  $$("main > section").forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec, start: "top 50%", end: "bottom 50%",
      onToggle: function (s) { if (s.isActive) setSection(sec); }
    });
  });

  var mm = gsap.matchMedia();

  /* ---------- Escritorio: portada fija y paneles que se apilan ---------- */
  mm.add("(min-width: 821px)", function () {
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", pin: true, pinSpacing: false });

    gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
      .to(cat, { scale: 1.45, yPercent: 8, ease: "none" }, 0)
      .to(letters1, { yPercent: -40, xPercent: function (i) { return (i - 1.5) * 60; }, ease: "none" }, 0)
      .to(letters2, { yPercent: 30, xPercent: function (i) { return (i - 3) * 40; }, ease: "none" }, 0)
      .to(tags, { y: function (i) { return -180 - i * 60; }, rotation: function (i) { return i % 2 ? 25 : -25; }, opacity: 0, ease: "none" }, 0)
      .to(".fx-hero-inner", { opacity: 0.25, ease: "none" }, 0.5);

    var stack = $$(".fx-panel");
    stack.forEach(function (panel, i) {
      var next = stack[i + 1] || $(".fx-contact");
      var tall = function () { return panel.offsetHeight > innerHeight; };
      ScrollTrigger.create({
        trigger: panel,
        start: function () { return tall() ? "bottom bottom" : "top top"; },
        endTrigger: next, end: "top top",
        pin: true, pinSpacing: false, invalidateOnRefresh: true
      });
      gsap.fromTo(panel, { scale: 1, filter: "brightness(1)" }, {
        scale: 0.94, filter: "brightness(0.86)", ease: "none", transformOrigin: "50% 100%",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true, invalidateOnRefresh: true }
      });
    });

    /* Contacto: el círculo crece y llena la pantalla */
    var ctl = gsap.timeline({
      scrollTrigger: {
        trigger: ".fx-contact", start: "top top", end: "+=150%", pin: true, scrub: true,
        onUpdate: function (s) { body.classList.toggle("ui-light", s.progress > 0.45); },
        onLeaveBack: function () { body.classList.remove("ui-light"); }
      }
    });
    ctl.to(".fx-circle", { scale: 1, ease: "power2.in", duration: 1 })
      .from(".fx-contact-inner .fx-hero-kicker", { opacity: 0, y: -20, duration: 0.3 }, 0.75)
      .from(".fx-contact-title span", { yPercent: 120, opacity: 0, stagger: 0.1, duration: 0.5 }, 0.8)
      .from(".fx-contact-cat", { yPercent: 80, opacity: 0, duration: 0.6 }, 0.95)
      .from(".fx-contact-actions .fx-btn", { opacity: 0, y: 30, stagger: 0.1, duration: 0.3 }, 1.2);

    return function () { body.classList.remove("ui-light"); };
  });

  /* Celular: sin fijar paneles, el contacto ya aparece en naranja */
  mm.add("(max-width: 820px)", function () {
    gsap.set(".fx-circle", { scale: 1 });
  });

  /* ---------- Palabras gigantes que asoman desde abajo ---------- */
  $$(".fx-mask").forEach(function (mask) {
    gsap.from($(".fx-giant", mask), {
      yPercent: 100, ease: "none",
      scrollTrigger: { trigger: mask, start: "top 92%", end: "top 45%", scrub: true }
    });
  });

  /* ---------- Ficha ---------- */
  gsap.from(".fx-facts dl > div, .fx-crest", {
    opacity: 0, y: 30, stagger: 0.06, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".fx-facts", start: "top 80%" }
  });
  gsap.from(".fx-crest img", { rotation: -180, scale: 0.4, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".fx-facts", start: "top 80%" } });

  var statement = $("[data-lines]");
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="ln" style="display:inline-block"><span>' + w + "</span></span>";
    }).join(" ");
    gsap.from($$(".ln > span", statement), {
      yPercent: 110, duration: 1, stagger: 0.035, ease: "expo.out",
      scrollTrigger: { trigger: statement, start: "top 82%" }
    });
  }
  gsap.from("[data-fade]", { opacity: 0, y: 24, stagger: 0.12, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".fx-intro-copy", start: "top 70%" } });
  gsap.from(".fx-portrait", { clipPath: "inset(100% 0 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".fx-intro", start: "top 80%" } });
  gsap.from(".fx-mini-cat", { y: 40, rotation: -40, opacity: 0, duration: 1, ease: "back.out(2)", scrollTrigger: { trigger: ".fx-intro", start: "top 75%" } });

  /* ---------- Marcas ---------- */
  gsap.from(".fx-logo-grid li", {
    scale: 0.5, opacity: 0, rotation: function (i) { return i % 2 ? 12 : -12; }, stagger: 0.08, duration: 0.9, ease: "back.out(1.8)",
    scrollTrigger: { trigger: ".fx-logo-grid", start: "top 80%" }
  });
  gsap.fromTo(".fx-arc", { rotation: -120 }, { rotation: 30, ease: "none", scrollTrigger: { trigger: ".fx-split", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".fx-box", { y: 60, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".fx-box", start: "top 85%" } });
  $$("[data-count]").forEach(function (el) {
    var o = { v: 0 }, end = +el.dataset.count;
    gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------- Herramientas: las cartas caen sobre la mesa ---------- */
  gsap.from(".fx-cards li", {
    y: 220, opacity: 0, rotation: function (i) { return (i % 2 ? 1 : -1) * (14 + i * 2); },
    stagger: 0.07, duration: 1.1, ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".fx-cards", start: "top 88%" }
  });

  /* ---------- Trayectoria / Explorá / Reseñas ---------- */
  gsap.from(".fx-acc-item", { opacity: 0, x: -40, stagger: 0.08, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".fx-acc", start: "top 85%" } });
  gsap.from(".fx-flip", {
    y: 120, opacity: 0, rotationY: -60, stagger: 0.09, duration: 1.1, ease: "expo.out",
    scrollTrigger: { trigger: ".fx-deck", start: "top 85%" }
  });
  gsap.from(".fx-quote", { y: 70, opacity: 0, stagger: 0.1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".fx-quotes", start: "top 85%" } });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
