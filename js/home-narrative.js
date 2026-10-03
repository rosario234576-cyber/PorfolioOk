/*
 * Narrativa de scroll del home: transiciones propias entre secciones (sin hilo que siga al usuario).
 *
 * Partes:
 *   heroIntro      – entrada de carga (una vez): PORTFOLIO y 2026.
 *   heroScene      – con scroll (scrub, sin pin) solo se mueven PORTFOLIO y 2026.
 *   aboutScene     – secuencia eyebrow → título → foto (máscara) → texto.
 *   manifestoScene – un círculo crece y se vuelve el fondo naranja de la tarjeta.
 *   projectsScene  – título que se acomoda + filas que entran con máscara.
 *   expertScene    – Perfil creativo: stickers que salen del gato (una vez) y órbita que gira con el scroll.
 *   bridges        – conexiones distintas entre Redes, Perfil creativo, CTA, Proceso, Reseñas y Contacto.
 *
 * Desktop: experiencia completa. Tablet: sin pinning y con menos amplitud. Mobile: solo hero y proyectos.
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
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Los elementos que anima la narrativa dejan de usar el reveal genérico de aurelia-rebuild.js.
  const takeOver = (elements) => elements.filter(Boolean).forEach((el) => {
    el.removeAttribute("data-reveal");
    el.classList.add("is-visible");
  });

  /* ---------- Escenas ---------- */
  // Carga (una sola vez, sin scroll): PORTFOLIO entra con su máscara (CSS) y 2026 se revela justo después.
  // El resto del hero aparece con un fade corto y después queda quieto.
  const heroIntro = () => {
    const kicker = $(".hero-kicker", hero);
    const tag = $(".hero-kicker-tag", hero);
    const info = $(".hero-info", hero);
    takeOver([kicker, info]);
    if (tag) {
      gsap.set(tag, { rotation: -4 });
      gsap.fromTo(tag, { yPercent: 70, opacity: 0, clipPath: "inset(100% 0% 0% 0% round 8px)" },
        { yPercent: 0, opacity: 1, clipPath: "inset(0% 0% 0% 0% round 8px)", duration: 0.9, delay: 0.35, ease: "power3.out", clearProps: "clipPath" });
    }
    const rest = [...kicker.children].filter((el) => el !== tag);
    gsap.fromTo(rest, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.6, ease: "power2.out" });
    gsap.fromTo([...info.children], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.8, stagger: 0.08, ease: "power2.out" });
  };

  // Scroll (scrub, sin pin): solo PORTFOLIO y 2026 responden; el resto del hero no se mueve.
  const heroScene = ({ isMobile }) => {
    const portfolio = $(".hero-title .title-row", hero);
    const tag = $(".hero-kicker-tag", hero);
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } });
    if (portfolio) tl.fromTo(portfolio, { x: 0 }, { x: () => (isMobile ? -15 : -window.innerWidth * 0.04), ease: "none" }, 0);
    if (tag) tl.fromTo(tag, { x: 0, scale: 1, rotation: -4 }, { x: () => (isMobile ? 15 : window.innerWidth * 0.03), scale: 0.95, rotation: -4, ease: "none" }, 0);
  };

  const aboutScene = () => {
    const about = $("#sobre-mi");
    if (!about) return;
    const copy = $(".about-copy", about);
    const brands = $(".about-brands", about);
    const portrait = $(".about-portrait > img:not(.about-cat-signature)", about);
    takeOver([copy, brands]);
    const eyebrow = $(".eyebrow", copy);
    const title = $("h2", copy);
    const text = $$(".about-lead, .outline-button", copy);
    gsap.set(portrait, { clipPath: "inset(100% 0 0 0)", scale: 1.08 });
    gsap.timeline({ scrollTrigger: { trigger: about, start: "top 85%", end: "top 15%", scrub: 1 } })
      .fromTo(eyebrow, { y: 30, opacity: 0 }, { y: 0, opacity: 1, ease: "power2.out", duration: 0.2 }, 0)
      .fromTo(title, { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: "power3.out", duration: 0.2 }, 0.2)
      .to(portrait, { clipPath: "inset(0% 0 0 0)", scale: 1, ease: "power3.out", duration: 0.3 }, 0.4)
      .fromTo(text, { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, ease: "power2.out", duration: 0.2 }, 0.7)
      .fromTo($$(".about-brands-title, li", brands), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, ease: "power2.out", duration: 0.2 }, 0.72);
  };

  const manifestoScene = () => {
    const card = $(".manifesto-card");
    if (!card) return;
    takeOver([card]);
    // Un círculo naranja nace arriba al centro y se abre hasta cubrir toda la sección.
    gsap.fromTo(card, { clipPath: "circle(0% at 50% 0%)" }, {
      clipPath: "circle(150% at 50% 0%)",
      ease: "power2.inOut",
      scrollTrigger: { trigger: card, start: "top bottom", end: "top 35%", scrub: 1.2 }
    });
    gsap.fromTo($(".manifesto-card-top, .manifesto-card-bottom", card), { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.1, ease: "power2.out",
      scrollTrigger: { trigger: card, start: "top 60%", end: "top 25%", scrub: 1 }
    });
    // La estrella de fondo gira y sube mientras la sección cruza la pantalla.
    const star = $(".manifesto-star", card);
    if (star) gsap.fromTo(star, { rotate: -20, yPercent: 18 }, { rotate: 70, yPercent: -18, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.8 } });
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
    // La imagen del celular entra apenas agrandada y vuelve a su tamaño dentro de la sección.
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
  // Proceso en mobile: línea vertical que se llena con el scroll y activa cada etapa al llegar (sin pin).
  const processMobileScene = () => {
    const track = $(".process-timeline-track");
    if (!track) return;
    const steps = $$(".pt-step", track);
    ScrollTrigger.create({
      trigger: track, start: "top 70%", end: "bottom 45%", scrub: true,
      onUpdate: (self) => {
        track.style.setProperty("--pt-fill", `${(self.progress * 100).toFixed(1)}%`);
        const index = self.progress <= 0 ? -1 : Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        steps.forEach((step, i) => {
          step.classList.toggle("is-active", i === index);
          step.classList.toggle("is-done", i < index);
        });
      }
    });
    return () => {
      track.style.removeProperty("--pt-fill");
      steps.forEach((step) => step.classList.remove("is-active", "is-done"));
    };
  };

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


  // Perfil creativo, entrada: se crea una sola vez (fuera del montaje responsive, así un re-montaje no la corta).
  // Los stickers salen disparados desde el gato hasta su lugar en la órbita.
  const expertIntro = () => {
    const orbit = $(".expert-orbit");
    if (!orbit) return;
    const ring = $(".expert-ring", orbit);
    const stickers = $$(".sk", ring);
    const fromCenter = (axis) => (i, el) => {
      const o = orbit.getBoundingClientRect();
      const r = el.parentElement.getBoundingClientRect();
      return axis === "x" ? o.left + o.width / 2 - (r.left + r.width / 2) : o.top + o.height / 2 - (r.top + r.height / 2);
    };
    gsap.set(stickers, { opacity: 0 });
    ScrollTrigger.create({
      trigger: orbit, start: "top 72%", once: true,
      onEnter: () => gsap.fromTo(stickers, { x: fromCenter("x"), y: fromCenter("y"), scale: 0.2, opacity: 0 }, {
        x: 0, y: 0, scale: 1, opacity: 1, duration: 0.9, stagger: 0.07, ease: "back.out(1.5)",
        // Al terminar vuelve a mandar el CSS (inclinación y hover de cada sticker).
        clearProps: "transform,opacity", onComplete: () => ring.classList.add("is-ready")
      })
    });
  };

  // Perfil creativo, scroll: la órbita gira mientras la sección cruza la pantalla.
  const expertScene = ({ isMobile }) => {
    const orbit = $(".expert-orbit");
    if (!orbit) return;
    gsap.fromTo(orbit, { "--spin": "0deg" }, { "--spin": isMobile ? "70deg" : "120deg", ease: "none", scrollTrigger: { trigger: orbit, start: "top bottom", end: "bottom top", scrub: 0.8 } });
  };

  /* ---------- Puentes entre secciones (cada uno distinto) ---------- */
  const sectionBridges = ({ isDesktop }) => {
    const about = $("#sobre-mi");
    const services = $("#servicios");
    const work = $("#proyectos");
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

    // Manifiesto → Proyectos: sin transición de salida. El bloque naranja queda fijo al bajar (solo anima su entrada,
    // que se deshace al volver a subir) y Proyectos entra sin recortes para que el título nunca se corte.

    // Proyectos → Redes: un círculo oscuro se abre desde arriba y es el fondo de Redes.
    if (experience && work) {
      const nodes = $(".wc-num", work);
      const last = nodes[nodes.length - 1];
      const lx = 50;
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
      // Mobile: solo escenas livianas, sin pins ni recortes de sección. El return evita que corran las de escritorio.
      if (isMobile) {
        ScrollTrigger.refresh();
        heroScene({ isMobile: true });
        projectsScene({ isDesktop: false });
        const cleanProcess = processMobileScene();
        expertScene({ isMobile: true });
        return () => cleanProcess?.();
      }
      // El pin del proceso cambia el alto de la página: va primero y después las escenas aplican sus estados iniciales.
      processScene({ isDesktop });
      ScrollTrigger.refresh();
      heroScene({ isMobile: false });
      aboutScene();
      manifestoScene();
      projectsScene({ isDesktop });
      handoffTitles({ isDesktop });
      expertScene({ isMobile: false });
      ctaScene();
      blobScene();
      contactScene();
      sectionBridges({ isDesktop });
      ScrollTrigger.refresh();
    });
  };
  heroIntro();
  expertIntro();
  mount();

  // Imágenes diferidas o fuentes cambian el alto de la página: se recalculan las posiciones de los disparadores
  // (sin desmontar las escenas, para no cortar animaciones a mitad de camino). Los cambios de breakpoint los maneja gsap.matchMedia.
  let lastHeight = main.scrollHeight;
  let timer = null;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (Math.abs(main.scrollHeight - lastHeight) < 2) return;
      lastHeight = main.scrollHeight;
      ScrollTrigger.refresh();
    }, 200);
  }).observe(main);
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
