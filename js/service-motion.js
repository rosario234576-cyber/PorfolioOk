/*
 * Animación de las páginas de servicios, con el mismo lenguaje que el home.
 *
 *   Entrada (una vez):  título del hero con máscara, etiqueta tipo sticker, collage que cae en su lugar,
 *                       títulos de sección palabra por palabra, tarjetas de clientes que se destapan,
 *                       piezas de las galerías que se "pegan" en cascada.
 *   Con el scroll (scrub, sin pin): el título del hero se corre, el collage sube más lento (parallax),
 *                       la cinta se inclina y el cierre se abre con un círculo.
 *
 * Animación activa por defecto; ?motion=reduced la apaga (lo resuelve el script del <head>).
 * Los elementos que anima GSAP dejan de usar el reveal genérico (.reveal / .visible) para no pelear con él.
 */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("service-motion-on");

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const revealClasses = ["reveal", "reveal-left", "reveal-right", "reveal-scale"];

  // Saca el elemento del reveal genérico de service-page.js (su .visible fuerza transform:none!important).
  const release = (elements) => elements.filter(Boolean).forEach((el) => {
    el.classList.remove(...revealClasses);
    if (typeof serviceObserver !== "undefined") serviceObserver.unobserve(el);
  });

  // Divide los textos de un título en palabras con máscara (respeta <br>, <span>, <em>, etc.).
  const splitWords = (root) => {
    if (root.dataset.smSplit) return $$(".sm-word > span", root);
    root.dataset.smSplit = "true";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) { fragment.append(part); return; }
        const outer = document.createElement("span");
        const inner = document.createElement("span");
        outer.className = "sm-word";
        inner.textContent = part;
        outer.append(inner);
        fragment.append(outer);
      });
      node.replaceWith(fragment);
    });
    return $$(".sm-word > span", root);
  };

  // Entrada que se reproduce una vez al llegar. Si un refresh (imágenes que terminan de cargar) encuentra
  // que ya se pasó el punto de inicio, se reproduce igual: así ninguna entrada queda en pausa para siempre.
  const arrive = (trigger, start, play) => {
    let done = false;
    const run = () => { if (!done) { done = true; play(); } };
    ScrollTrigger.create({ trigger, start, once: true, onEnter: run, onRefresh: (self) => { if (self.progress > 0) run(); } });
  };

  /* ---------- Hero ---------- */
  const hero = $(".service-hero, .wl-hero");
  if (hero) {
    const copy = $(".reveal-left", hero) || hero.querySelector("div > div");
    const visual = $(".service-hero-preview, .wl-hero-stage", hero);
    release([copy, visual]);
    const title = $("h1", hero);
    const kicker = $(".service-eyebrow, .wl-kicker", hero);
    const extras = $$(".service-hero-actions > *, .wl-lead, .wl-actions > *, .wl-stats > div", hero);
    const pieces = visual ? [...visual.children] : [];

    const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
    if (kicker) intro.fromTo(kicker, { scale: 0.6, rotation: -8, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, 0);
    if (title) intro.fromTo(title, { y: 50, clipPath: "inset(0% 0% 100% 0%)" }, { y: 0, clipPath: "inset(-25% -5% -25% -5%)", duration: 1, ease: "power4.out" }, 0.1);
    if (extras.length) intro.fromTo(extras, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06 }, 0.55);
    // El collage cae y gira hasta su lugar (gsap.from respeta la rotación propia de cada imagen en el CSS).
    if (pieces.length) intro.from(pieces, { y: 120, scale: 0.8, rotation: (i) => (i % 2 ? 14 : -14), opacity: 0, duration: 1, stagger: 0.12, ease: "back.out(1.4)" }, 0.25);

    const drift = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });
    if (title) drift.to(title, { x: mobile ? -14 : -window.innerWidth * 0.04, ease: "none" }, 0);
    if (visual) drift.to(visual, { y: mobile ? -30 : -110, ease: "none" }, 0);
  }

  /* ---------- Cinta: se inclina con el scroll ---------- */
  $$(".service-note-strip").forEach((strip) => {
    gsap.fromTo(strip, { rotation: -2.2 }, { rotation: 1.6, ease: "none", scrollTrigger: { trigger: strip, start: "top bottom", end: "bottom top", scrub: 0.8 } });
  });

  /* ---------- Títulos de sección: palabras que suben ---------- */
  $$("main h2").filter((h2) => !h2.closest(".client-work, .wl-hero, .service-hero") && !h2.hasAttribute("data-split")).forEach((h2) => {
    const holder = h2.closest(".reveal, .reveal-left, .reveal-right, .reveal-scale");
    release([holder]);
    const words = splitWords(h2);
    const rise = gsap.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: "power4.out", paused: true });
    arrive(h2, "top 88%", () => rise.play());
  });

  /* ---------- Tarjetas de cliente: se destapan y presentan su marca ---------- */
  $$(".client-work").forEach((card) => {
    release([card]);
    card.classList.add("visible");
    const head = $(".client-head", card);
    const logo = $(".client-logo-slot", card);
    const copy = $$(".client-kicker, .client-copy h2, .client-tags span", card);
    const tl = gsap.timeline({ paused: true });
    arrive(card, "top 86%", () => tl.play());
    tl.fromTo(card, { clipPath: "inset(14% 5% 0% 5% round 28px)", opacity: 0.4 }, { clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1, duration: 1.1, ease: "power3.out", clearProps: "clipPath" }, 0);
    if (logo) tl.fromTo(logo, { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.2)" }, 0.25);
    if (copy.length) tl.fromTo(copy, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }, 0.35);
    if (head && !logo && !copy.length) tl.fromTo(head, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.3);
  });

  /* ---------- Videos por marca: la marca se presenta y su nombre gigante se desliza con el scroll ---------- */
  $$(".video-brand").forEach((brand) => {
    const mark = $(".video-brand-mark", brand);
    const name = $(".video-brand-copy h3", brand);
    const meta = $$(".video-brand-copy small, .video-brand-count", brand);
    const count = $(".video-brand-count b", brand);
    const ghost = $(".video-brand-ghost", brand);
    const words = name ? splitWords(name) : [];
    const tl = gsap.timeline({ paused: true });
    arrive(brand, "top 82%", () => tl.play());
    if (mark) tl.fromTo(mark, { scale: 0, rotation: -30 }, { scale: 1, rotation: -4, duration: 0.8, ease: "back.out(2.2)" }, 0);
    if (words.length) tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.06, ease: "power4.out" }, 0.15);
    if (meta.length) tl.fromTo(meta, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }, 0.3);
    if (count) {
      const total = Number(count.textContent) || 0;
      const counter = { n: 0 };
      tl.to(counter, { n: total, duration: 0.8, ease: "power2.out", onUpdate: () => { count.textContent = Math.round(counter.n); } }, 0.35);
    }
    if (ghost) gsap.fromTo(ghost, { xPercent: mobile ? 8 : 12 }, { xPercent: mobile ? -30 : -38, ease: "none", scrollTrigger: { trigger: brand, start: "top bottom", end: "bottom top", scrub: 0.8 } });
  });

  /* ---------- Piezas de las galerías: se pegan en cascada como stickers ---------- */
  const pieceSelector = [
    ".work-card", ".account-card", ".wl-site", ".video-gallery-card", ".ads-variant-group",
    ".packaging-story figure", ".packaging-proof figure", ".wl-steps > *", ".wl-includes > *"
  ].join(", ");
  const piecesAll = $$(pieceSelector).filter((el) => !el.closest(".service-hero, .wl-hero"));
  release(piecesAll);
  gsap.set(piecesAll, { opacity: 0 });
  const pending = new Set(piecesAll);
  const stick = (batch) => {
    const fresh = batch.filter((el) => pending.delete(el));
    if (fresh.length) gsap.fromTo(fresh,
      { y: mobile ? 40 : 70, scale: 0.92, rotation: (i) => (i % 2 ? 3 : -3), opacity: 0 },
      { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "back.out(1.3)", clearProps: "transform" });
  };
  ScrollTrigger.batch(piecesAll, { start: "top 92%", once: true, onEnter: stick });
  // Después de cada refresh, las piezas que ya quedaron a la vista (o por encima) se muestran igual.
  ScrollTrigger.addEventListener("refresh", () => {
    if (!pending.size) return;
    const limit = window.innerHeight * 0.92;
    stick([...pending].filter((el) => el.getBoundingClientRect().top < limit));
  });

  /* ---------- Cierre: un círculo abre la caja final ---------- */
  $$(".service-end-box, .wl-cta-box").forEach((box) => {
    release([box, box.closest(".reveal")]);
    gsap.fromTo(box, { clipPath: "circle(0% at 50% 100%)" }, {
      clipPath: "circle(150% at 50% 100%)", ease: "power2.inOut",
      scrollTrigger: { trigger: box, start: "top bottom", end: "top 45%", scrub: 1 }
    });
    const buttons = $(".btn, .wl-btn", box);
    if (buttons.length) {
      const pop = gsap.fromTo(buttons, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, stagger: 0.08, ease: "back.out(2)", paused: true });
      arrive(box, "top 70%", () => pop.play());
    }
  });

  // Imágenes diferidas y videos cambian el alto: se recalculan los disparadores (sin rehacer las animaciones).
  let lastHeight = document.body.scrollHeight;
  let timer = null;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (Math.abs(document.body.scrollHeight - lastHeight) < 2) return;
      lastHeight = document.body.scrollHeight;
      ScrollTrigger.refresh();
    }, 200);
  }).observe(document.body);
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
