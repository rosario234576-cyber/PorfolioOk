/*
 * Narrativa de scroll del home: cada sección se transforma y da origen a la siguiente.
 * Un solo hilo de tinta (SVG) recorre la página; en cada tramo algo de la sección anterior
 * se convierte en algo de la siguiente (punto → línea → círculo → fondo → nodos → timeline → mancha → forma del contacto).
 *
 * Partes:
 *   InkThread      – capa SVG con los tramos del hilo, calculados desde el layout real (getBoundingClientRect).
 *   heroScene      – reveal de carga + compresión del hero al scrollear.
 *   aboutScene     – secuencia eyebrow → título → foto (máscara) → texto.
 *   manifestoScene – el final del hilo crece en círculo y se vuelve el fondo naranja de la tarjeta.
 *   projectsScene  – título que se acomoda + filas con nodo y tramo propio.
 *   bridges        – conexiones distintas entre Redes, Perfil creativo, CTA, Proceso, Reseñas y Contacto.
 *
 * Desktop: experiencia completa. Tablet: sin pinning y con menos amplitud. Mobile: una línea vertical simple.
 * prefers-reduced-motion: solo quedan los fades existentes (se puede forzar con ?motion=full).
 */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const main = document.querySelector("main");
  const hero = document.querySelector(".hero");
  if (!main || !hero) return;

  // Override para probar la experiencia completa con "animaciones reducidas" activado en el sistema.
  const params = new URLSearchParams(location.search);
  try {
    if (params.get("motion") === "full") localStorage.setItem("inkk-motion", "full");
    if (params.get("motion") === "auto") localStorage.removeItem("inkk-motion");
  } catch {}
  let forcedMotion = false;
  try { forcedMotion = localStorage.getItem("inkk-motion") === "full"; } catch {}
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches && !forcedMotion;
  if (reduced) return;

  document.documentElement.classList.add("narrative-on");
  const SVG_NS = "http://www.w3.org/2000/svg";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Los elementos que anima la narrativa dejan de usar el reveal genérico de aurelia-rebuild.js.
  const takeOver = (elements) => elements.filter(Boolean).forEach((el) => {
    el.removeAttribute("data-reveal");
    el.classList.add("is-visible");
  });

  /* ---------- Geometría ---------- */
  // Punto de un elemento en coordenadas de <main> (ax/ay: 0 = izquierda/arriba, 1 = derecha/abajo).
  const anchor = (el, ax = 0.5, ay = 0.5, dx = 0, dy = 0) => {
    const r = el.getBoundingClientRect();
    const m = main.getBoundingClientRect();
    return { x: r.left - m.left + r.width * ax + dx, y: r.top - m.top + r.height * ay + dy };
  };

  // Curva suave por puntos (Catmull-Rom → Bézier), con un leve temblor orgánico.
  const smoothPath = (points, wobble = 0) => {
    const pts = points.map((p, i) => (i === 0 || i === points.length - 1 || !wobble)
      ? p
      : { x: p.x + Math.sin(i * 2.3) * wobble, y: p.y + Math.cos(i * 1.7) * wobble * 0.5 });
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  /* ---------- InkThread ---------- */
  const layer = document.createElementNS(SVG_NS, "svg");
  layer.classList.add("ink-thread");
  layer.setAttribute("aria-hidden", "true");
  main.prepend(layer);

  const thread = {
    clear() { layer.replaceChildren(); },
    size() {
      layer.setAttribute("width", main.scrollWidth);
      layer.setAttribute("height", main.scrollHeight);
      layer.setAttribute("viewBox", `0 0 ${main.scrollWidth} ${main.scrollHeight}`);
    },
    // Contorno con path propio (para el cierre alrededor del contacto).
    outline(d, options = {}) {
      const start = d.match(/^M([\d.-]+),([\d.-]+)/);
      return this.segment([{ x: Number(start[1]), y: Number(start[2]) }], { ...options, d }, { wobble: 0, width: 2.5, className: "ink-seg-final" });
    },
    // Dibuja un tramo con el scroll; los nodos aparecen al llegar a su posición del recorrido.
    segment(points, options = {}, { wobble = 14, width = 2.5, nodes = [], className = "" } = {}) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", options.d || smoothPath(points, wobble));
      path.setAttribute("class", `ink-seg ${className}`.trim());
      path.style.strokeWidth = width;
      layer.append(path);
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

      // "Costo" de scroll de cada tramo: lo vertical cuesta 1:1 y lo horizontal menos, así la punta
      // del dibujo acompaña la altura de la pantalla en cualquier tamaño de ventana.
      const steps = Math.max(48, Math.ceil(length / 18));
      const samples = [];
      let cost = 0;
      let prev = path.getPointAtLength(0);
      for (let i = 0; i <= steps; i += 1) {
        const l = (length * i) / steps;
        const pt = path.getPointAtLength(l);
        cost += Math.abs(pt.y - prev.y) + Math.abs(pt.x - prev.x) * 0.35;
        samples.push({ l, cost, x: pt.x, y: pt.y });
        prev = pt;
      }
      const lengthAtCost = (c) => {
        if (c <= 0) return 0;
        if (c >= cost) return length;
        let lo = 0;
        let hi = samples.length - 1;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (samples[mid].cost < c) lo = mid; else hi = mid;
        }
        const s0 = samples[lo];
        const s1 = samples[hi];
        return s0.l + ((c - s0.cost) / Math.max(1e-6, s1.cost - s0.cost)) * (s1.l - s0.l);
      };

      const offset = main.getBoundingClientRect().top + window.scrollY;
      const tipAt = window.innerHeight * (options.tip ?? 0.62);
      const start = Math.max(0, offset + points[0].y - tipAt);
      // Si el tramo terminaría después del final de la página, se comprime para completarse antes.
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight - 30);
      const span = Math.max(120, Math.min(cost, maxScroll - start));
      const factor = cost / span;
      const head = document.createElementNS(SVG_NS, "circle");
      head.setAttribute("r", width * 2.6);
      head.setAttribute("class", "ink-head");
      layer.append(head);
      const headX = gsap.quickTo(head, "attr:cx", { duration: options.smooth ?? 0.9, ease: "power3.out" });
      const headY = gsap.quickTo(head, "attr:cy", { duration: options.smooth ?? 0.9, ease: "power3.out" });
      gsap.set(head, { attr: { cx: points[0].x, cy: points[0].y }, opacity: 0 });
      const draw = gsap.quickTo(path, "strokeDashoffset", { duration: options.smooth ?? 0.9, ease: "power3.out" });

      const dots = nodes.map(({ point, r = 6, tickTo = null }) => {
        let tick = null;
        if (tickTo !== null) {
          tick = document.createElementNS(SVG_NS, "path");
          tick.setAttribute("d", `M${point.x},${point.y} H${tickTo}`);
          tick.setAttribute("class", "ink-tick");
          layer.append(tick);
          const tl = Math.abs(tickTo - point.x);
          gsap.set(tick, { strokeDasharray: tl, strokeDashoffset: tl });
        }
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", point.x);
        dot.setAttribute("cy", point.y);
        dot.setAttribute("r", r);
        dot.setAttribute("class", "ink-node");
        layer.append(dot);
        gsap.set(dot, { scale: 0, transformOrigin: "50% 50%" });
        // El nodo aparece cuando la punta llega a su posición.
        const nearest = samples.reduce((best, sm) => (Math.hypot(sm.x - point.x, sm.y - point.y) < Math.hypot(best.x - point.x, best.y - point.y) ? sm : best), samples[0]);
        return { dot, tick, at: nearest.l, shown: false };
      });

      const update = (scroll) => {
        const drawn = lengthAtCost((scroll - start) * factor);
        draw(length - drawn);
        const tip = path.getPointAtLength(drawn);
        headX(tip.x);
        headY(tip.y);
        gsap.to(head, { opacity: drawn > 2 && drawn < length - 2 ? 1 : 0, duration: 0.3, overwrite: "auto" });
        dots.forEach((d) => {
          const show = drawn >= d.at - 2;
          if (show === d.shown) return;
          d.shown = show;
          gsap.to(d.dot, { scale: show ? 1 : 0, duration: 0.35, ease: show ? "power3.out" : "power2.in" });
          if (d.tick) gsap.to(d.tick, { strokeDashoffset: show ? 0 : d.tick.getTotalLength(), duration: 0.6, ease: "power3.out", delay: show ? 0.1 : 0 });
        });
      };
      const tl = ScrollTrigger.create({
        start,
        end: start + span + 1,
        onUpdate: (self) => update(self.scroll()),
        onRefresh: (self) => update(self.scroll())
      });
      update(window.scrollY);
      return { path, tl };
    }
  };

  /* ---------- Escenas ---------- */
  const heroScene = ({ isDesktop }) => {
    const kicker = $(".hero-kicker", hero);
    const rows = $$(".hero-title .title-row", hero);
    const info = $(".hero-info", hero);
    takeOver([kicker, info]);
    // Carga: PORTFOLIO ya entra con su máscara (CSS); 2026 llega después. La intro va en los hijos y el scroll en el contenedor.
    gsap.fromTo([...kicker.children], { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, delay: 0.75, stagger: 0.08, ease: "power3.out" });
    gsap.fromTo([...info.children], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 1, stagger: 0.08, ease: "power2.out" });
    const amp = isDesktop ? 1 : 0.6;
    gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 } })
      .fromTo(rows[0], { xPercent: 0 }, { xPercent: -9 * amp, ease: "none" }, 0)
      .fromTo(rows[1], { xPercent: 0 }, { xPercent: 4 * amp, ease: "none" }, 0)
      .fromTo(kicker, { x: 0, opacity: 1 }, { x: () => window.innerWidth * 0.08 * amp, opacity: 0.3, ease: "none" }, 0)
      .fromTo(info, { y: 0, opacity: 1 }, { opacity: 0.3, y: -30, ease: "none" }, 0);
  };

  const aboutScene = () => {
    const about = $("#sobre-mi");
    if (!about) return;
    const copy = $(".about-copy", about);
    const data = $(".about-data", about);
    const portrait = $(".about-portrait > img:not(.about-cat-signature)", about);
    takeOver([copy, data]);
    const eyebrow = $(".eyebrow", copy);
    const title = $("h2", copy);
    const text = $$(".about-lead, .about-personal, ul, .outline-button", copy);
    gsap.set(portrait, { clipPath: "inset(100% 0 0 0)", scale: 1.08 });
    gsap.timeline({ scrollTrigger: { trigger: about, start: "top 85%", end: "top 15%", scrub: 1 } })
      .fromTo(eyebrow, { y: 30, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", duration: 0.2 }, 0)
      .fromTo(title, { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 0.2 }, 0.2)
      .to(portrait, { clipPath: "inset(0% 0 0 0)", scale: 1, ease: "power3.out", duration: 0.3 }, 0.4)
      .fromTo(text, { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, ease: "power2.out", duration: 0.2 }, 0.7)
      .fromTo($(":scope > div, :scope > p", data), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, ease: "power2.out", duration: 0.2 }, 0.72);
  };

  const manifestoScene = (origin) => {
    const card = $(".manifesto-card");
    if (!card) return;
    takeOver([card]);
    // El círculo final del hilo crece hasta volverse el fondo naranja de la tarjeta.
    const c = card.getBoundingClientRect();
    const ox = origin ? ((origin.clientX - c.left) / c.width) * 100 : 50;
    gsap.fromTo(card, { clipPath: `circle(0% at ${ox.toFixed(1)}% 0%)` }, {
      clipPath: `circle(150% at ${ox.toFixed(1)}% 0%)`,
      ease: "power2.inOut",
      scrollTrigger: { trigger: card, start: "top bottom", end: "top 35%", scrub: 1.2 }
    });
    gsap.fromTo($(".manifesto-card-top, .manifesto-card-bottom", card), { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: card, start: "top 60%", end: "top 25%", scrub: 1 }
    });
  };

  const projectsScene = ({ isDesktop }) => {
    const work = $("#proyectos");
    if (!work) return;
    const title = $(".work-head h2", work);
    // PROYECTOS entra enorme cerca del centro y se acomoda en su lugar real del grid.
    gsap.fromTo(title, {
      scale: isDesktop ? 1.9 : 1.4,
      x: () => window.innerWidth / 2 - title.getBoundingClientRect().left - title.offsetWidth * 0.95,
      transformOrigin: "0% 100%"
    }, {
      scale: 1, x: 0, ease: "power3.out",
      scrollTrigger: { trigger: work, start: "top 95%", end: "top 20%", scrub: 1.2, invalidateOnRefresh: true }
    });
    $$(".wc-item", work).forEach((item) => {
      const st = { trigger: item, start: "top 92%", end: "top 58%", scrub: 1 };
      gsap.timeline({ scrollTrigger: st })
        .fromTo(item, { yPercent: 18, clipPath: "inset(35% 0% 0% 0% round 22px)" }, { yPercent: 0, clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "power3.out" }, 0)
        .fromTo($(".wc-thumb", item), { y: 30, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out" }, 0.1)
        .fromTo($(".wc-static-copy", item), { x: -50, opacity: 0 }, { x: 0, opacity: 1, ease: "power2.out" }, 0.2)
        .fromTo($(".wc-num", item), { scale: 0 }, { scale: 1, ease: "power2.out" }, 0.35);
    });
  };

  // Redes → Perfil creativo: el título sale por la izquierda y el siguiente entra por la misma trayectoria.
  const handoffTitles = ({ isDesktop }) => {
    const out = $(".experience-main h2");
    const inTitle = $(".expert-intro h2");
    const phone = $(".experience-phone-frame");
    if (out) gsap.fromTo(out, { xPercent: 0, opacity: 1 }, { xPercent: isDesktop ? -45 : -25, opacity: 0.15, ease: "none", scrollTrigger: { trigger: out, start: "top 25%", end: "top -40%", scrub: 1 } });
    if (inTitle) {
      takeOver([$(".expert-intro")]);
      gsap.fromTo(inTitle, { xPercent: isDesktop ? 45 : 25, opacity: 0.15 }, { xPercent: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: inTitle, start: "top 98%", end: "top 45%", scrub: 1 } });
    }
    // La imagen del celular se expande al recibir el hilo y vuelve a su tamaño dentro de la sección.
    if (phone) gsap.fromTo(phone, { scale: 1.16, rotate: -3 }, { scale: 1, rotate: 0, ease: "power2.out", scrollTrigger: { trigger: phone, start: "top 90%", end: "center 50%", scrub: 1 } });
  };

  // Perfil creativo → CTA: un círculo crece y revela la sección oscura; el título se une desde los dos lados.
  const ctaScene = () => {
    const cta = $(".big-cta");
    if (!cta) return;
    const panel = $(".cta-panel", cta);
    const h2 = $("h2", panel);
    takeOver([panel]);
    if (h2 && !h2.dataset.split2) {
      h2.dataset.split2 = "true";
      h2.innerHTML = h2.innerHTML.split(/<br\s*\/?>/i).map((line) => `<span class="ink-line">${line}</span>`).join("");
    }
    gsap.fromTo(cta, { clipPath: "circle(0% at 50% 0%)" }, { clipPath: "circle(150% at 50% 0%)", ease: "power2.inOut", scrollTrigger: { trigger: cta, start: "top 95%", end: "top 15%", scrub: 1.2 } });
    const lines = $$(".ink-line", h2);
    gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 85%", end: "center 55%", scrub: 1 } })
      .fromTo(lines[0], { xPercent: -40, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out" }, 0)
      .fromTo(lines[1], { xPercent: 40, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out" }, 0)
      .fromTo($(".outline-button", panel), { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, ease: "power2.out" }, 0.3);
  };

  // Proceso: la línea se vuelve timeline fija; cada tramo activa una etapa.
  const processScene = ({ isDesktop }) => {
    const process = $(".process");
    const track = $(".process-timeline-track", process || document);
    if (!process || !track) return;
    const steps = $$(".pt-step", track);
    const title = $(".process-head h2", process);
    const ensure = (selector, tag, className, parent, where = "prepend") => {
      let el = $(selector, parent);
      if (!el) {
        el = document.createElement(tag);
        el.className = className;
        el.setAttribute("aria-hidden", "true");
        parent[where](el);
      }
      return el;
    };
    const bar = ensure(".ink-timeline", "span", "ink-timeline", track);
    const playhead = ensure(".ink-playhead", "span", "ink-playhead", track);
    const stage = ensure(".ink-stage-word", "span", "ink-stage-word", process);
    gsap.set(bar, { scaleX: 0, transformOrigin: "0% 50%" });
    gsap.set(playhead, { x: 0, scale: 0 });
    steps.forEach((step) => step.classList.remove("is-active", "is-done"));

    // Qué etapa está activa según el avance: la anterior queda "hecha", la palabra de fondo cambia.
    let active = -1;
    const setActive = (index) => {
      if (index === active) return;
      active = index;
      steps.forEach((step, i) => {
        step.classList.toggle("is-active", i === index);
        step.classList.toggle("is-done", i < index);
      });
      const word = index >= 0 ? $("h3", steps[index])?.textContent.trim() : "";
      gsap.to(stage, { opacity: 0, y: -20, duration: 0.25, ease: "power2.in", onComplete: () => {
        stage.textContent = word;
        gsap.fromTo(stage, { y: 30 }, { opacity: word ? 1 : 0, y: 0, duration: 0.6, ease: "power3.out" });
      } });
    };

    const per = 1;
    const lead = 0.6;
    const total = lead + steps.length * per + 0.8;
    const tl = gsap.timeline({
      defaults: { ease: "sine.inOut" },
      scrollTrigger: {
        ...(isDesktop
          ? { trigger: process, start: "top top", end: "+=230%", pin: true, scrub: 1.2, anticipatePin: 1 }
          : { trigger: track, start: "top 80%", end: "bottom 30%", scrub: 1 }),
        onUpdate: (self) => {
          const t = self.progress * total - lead;
          setActive(t < 0 ? -1 : Math.min(steps.length - 1, Math.floor(t / per)));
        }
      }
    });
    const words = title ? $$(".split-word", title) : [];
    if (words.length) {
      const mid = (words.length - 1) / 2;
      tl.fromTo(words, { x: (i) => i * (isDesktop ? 30 : 16) }, { x: 0, ease: "power2.out", duration: lead }, 0);
    }
    tl.to(playhead, { scale: 1, duration: 0.3, ease: "power2.out" }, 0.3);
    // Posición real de cada nodo dentro de la línea (no se asume un reparto parejo).
    const dotX = (i) => {
      const dot = $(".pt-dot", steps[i]);
      return dot.getBoundingClientRect().left + dot.offsetWidth / 2 - track.getBoundingClientRect().left;
    };
    steps.forEach((step, i) => {
      const at = lead + i * per;
      const h3 = $("h3", step);
      const text = $("p", step);
      // El punto viaja al nodo de esta etapa justo antes de que se encienda.
      tl.to(bar, { scaleX: () => dotX(i) / track.offsetWidth, duration: per * 0.55 }, at - per * 0.55)
        .to(playhead, { x: () => dotX(i), duration: per * 0.55 }, at - per * 0.55)
        .fromTo(h3, { clipPath: "inset(0% 0% 100% 0%)", y: 24 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: per * 0.45, ease: "power3.out" }, at)
        .fromTo(text, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: per * 0.45, ease: "power2.out" }, at + 0.15);
    });
    // Salida: la línea termina de recorrer el ancho y el punto se va hacia la siguiente sección.
    const exitAt = lead + steps.length * per;
    tl.to(bar, { scaleX: 1, duration: 0.6 }, exitAt)
      .to(playhead, { x: () => track.offsetWidth + 30, scale: 2.2, opacity: 0, duration: 0.6, ease: "power2.in" }, exitAt);
    return { lastDot: $(".pt-step:last-child .pt-dot", track) };
  };

  // Proceso → Reseñas: el último nodo crece, se vuelve una mancha y viaja en diagonal hasta quedar detrás del título.
  const blobScene = () => {
    const testimonials = $(".testimonials");
    if (!testimonials) return;
    let blob = $(".ink-blob", testimonials);
    if (!blob) {
      blob = document.createElement("span");
      blob.className = "ink-blob";
      blob.setAttribute("aria-hidden", "true");
      testimonials.prepend(blob);
    }
    gsap.fromTo(blob,
      { x: () => window.innerWidth * 0.45, y: () => -window.innerHeight * 0.55, scale: 0.05, borderRadius: "50%" },
      { x: 0, y: 0, scale: 1, borderRadius: "58% 42% 63% 37% / 45% 58% 42% 55%", ease: "power2.out",
        scrollTrigger: { trigger: testimonials, start: "top 100%", end: "top 20%", scrub: 1.3, invalidateOnRefresh: true } });
  };

  const contactScene = () => {
    const contact = $("#contacto");
    if (!contact) return;
    const panel = $(".contact-panel", contact);
    const h2 = $("h2", panel);
    takeOver([panel]);
    if (h2 && !h2.dataset.split2) {
      h2.dataset.split2 = "true";
      h2.innerHTML = h2.innerHTML.split(/<br\s*\/?>/i).map((line) => `<span class="ink-line">${line}</span>`).join("");
    }
    const lines = $$(".ink-line", h2);
    const links = $(".contact-links", panel);
    gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 90%", end: "center 55%", scrub: 1 } })
      .fromTo(lines[0], { xPercent: -35, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out" }, 0)
      .fromTo(lines[1], { xPercent: 35, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out" }, 0)
      .fromTo(links, { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, ease: "power2.out", onComplete: () => links.classList.add("is-breathing") }, 0.35);
  };


  /* ---------- Puentes entre secciones (cada uno distinto) ---------- */
  const sectionBridges = ({ isDesktop }) => {
    const about = $("#sobre-mi");
    const services = $("#servicios");
    const work = $("#proyectos");
    const manifesto = $(".manifesto-card");
    const experience = $(".experience");
    const expert = $(".expert");
    const cta = $(".big-cta");
    const process = $(".process");
    const testimonials = $(".testimonials");
    const contact = $("#contacto");

    // Servicios → Sobre mí: Sobre mí sube como una hoja con esquinas redondeadas y Servicios se hunde detrás.
    if (about && services) {
      const st = { trigger: about, start: "top bottom", end: "top 18%", scrub: 1.2 };
      gsap.fromTo(about, { clipPath: "inset(6% 4% 0% 4% round 64px 64px 0px 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "sine.inOut", scrollTrigger: st });
      gsap.fromTo($(".section-shell", services), { scale: 1, opacity: 1 }, { scale: 0.94, opacity: 0.45, transformOrigin: "50% 100%", ease: "sine.in", scrollTrigger: { ...st } });
    }

    // Manifiesto → Proyectos: la tarjeta se inclina y se aleja mientras Proyectos entra con un corte diagonal.
    if (work && manifesto) {
      const st = { trigger: work, start: "top bottom", end: "top 15%", scrub: 1.2 };
      gsap.fromTo(work, { clipPath: "polygon(0% 16%, 100% 0%, 100% 100%, 0% 100%)" }, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", ease: "sine.inOut", scrollTrigger: st });
      gsap.fromTo(manifesto, { scale: 1, rotate: 0, y: 0 }, { scale: 0.9, rotate: -2.5, y: -50, ease: "sine.in", scrollTrigger: { ...st } });
    }

    // Proyectos → Redes: el último nodo del hilo se abre en un círculo oscuro que es el fondo de Redes.
    if (experience && work) {
      const nodes = $(".wc-num", work);
      const last = nodes[nodes.length - 1];
      const lx = ((spineX() + main.getBoundingClientRect().left) / window.innerWidth) * 100;
      gsap.fromTo(experience, { clipPath: `circle(0% at ${lx.toFixed(1)}% 0%)` }, { clipPath: `circle(170% at ${lx.toFixed(1)}% 0%)`, ease: "power2.inOut", scrollTrigger: { trigger: experience, start: "top bottom", end: "top 5%", scrub: 1.2 } });
    }

    // Redes → Perfil creativo: un telón claro entra desde la derecha.
    if (expert) {
      gsap.fromTo(expert, { clipPath: "inset(0% 0% 0% 38% round 96px 0px 0px 96px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "power2.inOut", scrollTrigger: { trigger: expert, start: "top bottom", end: "top 20%", scrub: 1.2 } });
    }

    // CTA → Proceso: el CTA queda quieto y Proceso sube por encima como una tarjeta apilada.
    if (isDesktop && cta && process) {
      const panel = $(".cta-panel", cta);
      ScrollTrigger.create({ trigger: cta, start: "bottom bottom", endTrigger: process, end: "top top", pin: true, pinSpacing: false });
      gsap.fromTo(process, { borderRadius: "56px 56px 0 0" }, { borderRadius: "0px 0px 0 0", ease: "sine.inOut", scrollTrigger: { trigger: process, start: "top bottom", end: "top top", scrub: 1 } });
      if (panel) gsap.fromTo(panel, { scale: 1, opacity: 1 }, { scale: 0.88, opacity: 0.35, ease: "sine.in", scrollTrigger: { trigger: process, start: "top bottom", end: "top 20%", scrub: 1 } });
    }

    // Reseñas: las tarjetas llegan desde la derecha, una detrás de otra.
    if (testimonials) {
      gsap.fromTo($(".testimonial-track article", testimonials).slice(0, 3), { x: 140, rotate: 2.5, opacity: 0 }, { x: 0, rotate: 0, opacity: 1, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: testimonials, start: "top 75%", end: "top 10%", scrub: 1.2 } });
    }

    // Reseñas → Contacto: el contacto sube como hoja y su panel crece hasta su tamaño real.
    if (contact) {
      const panel = $(".contact-panel", contact);
      gsap.fromTo(contact, { clipPath: "inset(8% 6% 0% 6% round 72px 72px 0px 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "sine.inOut", scrollTrigger: { trigger: contact, start: "top bottom", end: "top 30%", scrub: 1.2 } });
      if (panel) gsap.fromTo(panel, { scale: 0.9 }, { scale: 1, ease: "power2.out", scrollTrigger: { trigger: contact, start: "top 90%", end: "top 30%", scrub: 1.2 } });
    }
  };

  /* ---------- Hilo: columna vertical con un nodo por sección ---------- */
  const spineX = () => {
    const shell = $("#servicios .section-shell") || $(".section-shell");
    const left = shell ? shell.getBoundingClientRect().left - main.getBoundingClientRect().left : 40;
    return Math.max(14, Math.round(left / 2));
  };

  const buildThread = () => {
    thread.clear();
    thread.size();
    const x = spineX();
    const nodes = [];
    const eyebrowNode = (section, opts = {}) => {
      const eyebrow = section && $(".eyebrow", section);
      if (!eyebrow) return;
      const star = $("i", eyebrow) || eyebrow;
      const st = anchor(star, 0, 0.5);
      // Solo los eyebrows alineados a la izquierda reciben conector; los centrados llevan solo el nodo.
      const aligned = st.x < x + 120;
      nodes.push({ point: { x, y: st.y }, r: 6, tickTo: aligned ? st.x - 8 : null, ...opts });
    };

    const services = $("#servicios");
    const about = $("#sobre-mi");
    const card = $(".manifesto-card");
    const work = $("#proyectos");
    const experience = $(".experience");
    const expert = $(".expert");
    const cta = $(".big-cta .cta-panel");
    const testimonials = $(".testimonials");
    const contactPanel = $(".contact-panel");

    eyebrowNode(services);
    eyebrowNode(about);
    if (card) nodes.push({ point: { x, y: anchor(card, 0, 0).y + 36 }, r: 7 });
    eyebrowNode(work);
    $$(".wc-num", work || document).forEach((num) => nodes.push({ point: { x, y: anchor(num).y }, r: 4, tickTo: anchor(num.closest(".wc-item"), 0, 0.5).x - 6 }));
    eyebrowNode(experience);
    eyebrowNode(expert);
    if (cta) nodes.push({ point: { x, y: anchor(cta, 0, 0.5).y }, r: 6 });
    eyebrowNode(testimonials);

    const startY = anchor(hero, 0, 1).y + 40;
    let endY = anchor(testimonials || hero, 0, 1).y;
    const points = [{ x, y: startY }];

    // Final: la columna llega al contacto y dibuja un contorno limpio, con esquinas redondeadas, alrededor del panel.
    if (contactPanel) {
      const pad = 16;
      const tl = anchor(contactPanel, 0, 0, -pad, -pad);
      const br = anchor(contactPanel, 1, 1, pad, pad);
      const r = 40;
      endY = tl.y + r;
      thread.segment([{ x, y: startY }, { x, y: endY }], {}, { wobble: 0, nodes });
      const left = x;
      const outline = [
        `M${x},${endY}`,
        `Q${x},${tl.y} ${x + r},${tl.y}`,
        `H${br.x - r}`, `Q${br.x},${tl.y} ${br.x},${tl.y + r}`,
        `V${br.y - r}`, `Q${br.x},${br.y} ${br.x - r},${br.y}`,
        `H${left + r}`, `Q${left},${br.y} ${left},${br.y - r}`,
        `V${endY}`
      ].join(" ");
      thread.outline(outline, { tip: 0.5 });
    } else {
      points.push({ x, y: endY });
      thread.segment(points, {}, { wobble: 0, nodes });
    }
    return { manifestoOrigin: { clientX: x + main.getBoundingClientRect().left } };
  };

  // Mobile: el concepto se mantiene con una línea vertical simple que une las secciones.
  const buildMobileThread = () => {
    thread.clear();
    thread.size();
    const sections = $$("main > section");
    const x = 12;
    const nodes = sections.map((s) => ({ point: { x, y: anchor(s, 0, 0, 0, 40).y } }));
    const top = nodes[1]?.point.y || 0;
    const bottom = anchor(sections[sections.length - 1], 0, 0.5).y;
    const total = bottom - top;
    thread.segment([{ x, y: top }, { x, y: bottom }],
      { scrub: 0.4 },
      { wobble: 0, width: 2, nodes: nodes.slice(1).map((n) => ({ ...n, at: (n.point.y - top) / total, r: 4 })) });
  };

  /* ---------- Montaje responsive ---------- */
  let mm = null;
  const mount = () => {
    mm = gsap.matchMedia();
    mm.add({
      isDesktop: "(min-width: 1051px)",
      isTablet: "(min-width: 761px) and (max-width: 1050px)",
      isMobile: "(max-width: 760px)"
    }, (context) => {
      const { isDesktop, isMobile } = context.conditions;
      if (isMobile) {
        ScrollTrigger.refresh();
        buildMobileThread();
        heroScene({ isDesktop: false });
        projectsScene({ isDesktop: false });
        return () => thread.clear();
      }
      // El pin del proceso cambia el alto de la página: va primero, después se mide el hilo
      // y recién entonces las escenas aplican sus estados iniciales (que mueven elementos).
      processScene({ isDesktop });
      ScrollTrigger.refresh();
      const { manifestoOrigin } = buildThread();
      heroScene({ isDesktop });
      aboutScene();
      manifestoScene(manifestoOrigin);
      projectsScene({ isDesktop });
      handoffTitles({ isDesktop });
      ctaScene();
      blobScene();
      contactScene();
      sectionBridges({ isDesktop });
      ScrollTrigger.refresh();
      return () => thread.clear();
    });
  };
  mount();

  // Imágenes diferidas o fuentes cambian el alto de la página: se vuelve a montar con el layout nuevo.
  const pinSpace = () => $$(".pin-spacer").reduce((sum, el) => sum + el.offsetHeight - (el.firstElementChild?.offsetHeight || 0), 0);
  let lastHeight = main.scrollHeight - pinSpace();
  let timer = null;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const height = main.scrollHeight - pinSpace();
      if (Math.abs(height - lastHeight) < 40) return;
      lastHeight = height;
      mm.revert();
      mount();
    }, 300);
  }).observe(main);
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (Math.abs(window.innerWidth - lastWidth) < 40) return;
    lastWidth = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(() => { mm.revert(); mount(); }, 300);
  });
})();
